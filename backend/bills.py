# bills.py - Bill payment routes for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required, admin_required
from database import get_db

bills_bp = Blueprint('bills', __name__)

VALID_BILL_TYPES = ['electricity', 'water', 'gas', 'dth', 'broadband', 'insurance', 'credit_card']

PROVIDERS = {
    'electricity': ['BESCOM', 'MSEDCL', 'TATA Power', 'Adani Electricity', 'CESC'],
    'water': ['Delhi Jal Board', 'BWSSB', 'MCGM', 'Chennai Metro Water'],
    'gas': ['Indraprastha Gas', 'Mahanagar Gas', 'Adani Gas', 'Gujarat Gas'],
    'dth': ['Tata Play', 'Airtel Digital TV', 'Dish TV', 'Sun Direct'],
    'broadband': ['Jio Fiber', 'Airtel Xstream', 'ACT Fibernet', 'BSNL Fiber'],
    'insurance': ['LIC', 'ICICI Prudential', 'HDFC Life', 'SBI Life'],
    'credit_card': ['HDFC', 'ICICI', 'SBI Card', 'Axis Bank', 'Kotak']
}


@bills_bp.route('/providers', methods=['GET'])
@login_required
def get_providers():
    return jsonify({'providers': PROVIDERS, 'bill_types': VALID_BILL_TYPES})


@bills_bp.route('/pay', methods=['POST'])
@login_required
def pay_bill():
    data = request.get_json()

    if not data.get('bill_type') or data['bill_type'] not in VALID_BILL_TYPES:
        return jsonify({'error': 'Valid bill type is required'}), 400
    if not data.get('provider'):
        return jsonify({'error': 'Provider is required'}), 400
    if not data.get('account_number'):
        return jsonify({'error': 'Account/Consumer number is required'}), 400
    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400
    if not data.get('upi_pin') or len(str(data['upi_pin'])) != 4:
        return jsonify({'error': 'Valid 4-digit UPI PIN is required'}), 400

    amount = float(data['amount'])
    if amount > 100000:
        return jsonify({'error': 'Maximum bill payment limit is 1,00,000'}), 400

    db = get_db()
    bill_id = str(uuid.uuid4())
    transaction_id = 'TXN' + uuid.uuid4().hex[:8].upper()

    # STEP 1: Insert bill payment as PENDING
    db.execute(
        "INSERT INTO bill_payments (id, user_id, bill_type, provider, account_number, amount, status, transaction_id) VALUES (?,?,?,?,?,?,?,?)",
        (bill_id, g.user['id'], data['bill_type'], data['provider'], data['account_number'], amount, 'pending', transaction_id)
    )
    db.commit()

    # STEP 2: Verify UPI PIN
    sender = db.execute("SELECT upi_pin, balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()
    if sender['upi_pin'] != str(data['upi_pin']):
        db.execute("UPDATE bill_payments SET status = 'failed' WHERE id = ?", (bill_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Incorrect UPI PIN', 'status': 'failed', 'transaction_id': transaction_id}), 401

    # STEP 3: Check balance
    if sender['balance'] < amount:
        db.execute("UPDATE bill_payments SET status = 'failed' WHERE id = ?", (bill_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Insufficient balance', 'status': 'failed', 'transaction_id': transaction_id}), 400

    # STEP 4: Deduct balance (race condition guard)
    result = db.execute(
        "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?",
        (amount, g.user['id'], amount)
    )
    if result.rowcount == 0:
        db.execute("UPDATE bill_payments SET status = 'failed' WHERE id = ?", (bill_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Insufficient balance', 'status': 'failed', 'transaction_id': transaction_id}), 400

    # STEP 5: Mark SUCCESS
    db.execute("UPDATE bill_payments SET status = 'success' WHERE id = ?", (bill_id,))
    db.commit()

    new_balance = db.execute("SELECT balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()['balance']

    # Process cashback
    cashback = 0
    try:
        from rewards import process_cashback
        cashback = process_cashback(g.user['id'], 'bill_payment', transaction_id)
        if cashback > 0:
            new_balance = db.execute("SELECT balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()['balance']
    except Exception:
        pass

    db.close()

    return jsonify({
        'message': 'Bill payment successful',
        'status': 'success',
        'transaction_id': transaction_id,
        'bill_payment': {
            'id': bill_id,
            'bill_type': data['bill_type'],
            'provider': data['provider'],
            'account_number': data['account_number'],
            'amount': amount,
            'status': 'success'
        },
        'new_balance': new_balance,
        'cashback': cashback
    })


@bills_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM bill_payments WHERE user_id = ?", (g.user['id'],)).fetchone()[0]
    rows = db.execute(
        "SELECT * FROM bill_payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (g.user['id'], per_page, offset)
    ).fetchall()
    db.close()

    return jsonify({
        'bill_payments': [dict(r) for r in rows],
        'total': total,
        'page': page,
        'total_pages': (total + per_page - 1) // per_page
    })


@bills_bp.route('/history/all', methods=['GET'])
@admin_required
def get_all_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM bill_payments").fetchone()[0]
    rows = db.execute("""
        SELECT bp.*, u.name as user_name, u.email as user_email
        FROM bill_payments bp JOIN users u ON bp.user_id = u.id
        ORDER BY bp.created_at DESC LIMIT ? OFFSET ?
    """, (per_page, offset)).fetchall()
    db.close()

    return jsonify({
        'bill_payments': [dict(r) for r in rows],
        'total': total,
        'page': page,
        'total_pages': (total + per_page - 1) // per_page
    })
