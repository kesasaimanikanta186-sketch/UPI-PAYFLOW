# recharge.py - Mobile recharge routes for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required, admin_required
from database import get_db

recharge_bp = Blueprint('recharge', __name__)

VALID_OPERATORS = ['Jio', 'Airtel', 'Vi', 'BSNL']


@recharge_bp.route('/process', methods=['POST'])
@login_required
def process_recharge():
    data = request.get_json()

    if not data.get('mobile_number') or len(data['mobile_number']) != 10 or not data['mobile_number'].isdigit():
        return jsonify({'error': 'Valid 10-digit mobile number is required'}), 400
    if not data.get('operator') or data['operator'] not in VALID_OPERATORS:
        return jsonify({'error': 'Valid operator is required (Jio, Airtel, Vi, BSNL)'}), 400
    if not data.get('plan_amount') or float(data['plan_amount']) <= 0:
        return jsonify({'error': 'Valid plan amount is required'}), 400
    if not data.get('upi_pin') or len(str(data['upi_pin'])) != 4:
        return jsonify({'error': 'Valid 4-digit UPI PIN is required'}), 400

    amount = float(data['plan_amount'])
    if amount > 100000:
        return jsonify({'error': 'Maximum recharge limit is 1,00,000'}), 400

    db = get_db()
    recharge_id = str(uuid.uuid4())
    transaction_id = 'TXN' + uuid.uuid4().hex[:8].upper()

    # STEP 1: Insert recharge as PENDING
    db.execute(
        "INSERT INTO recharges (id, user_id, mobile_number, operator, plan_amount, status, transaction_id) VALUES (?,?,?,?,?,?,?)",
        (recharge_id, g.user['id'], data['mobile_number'], data['operator'], amount, 'pending', transaction_id)
    )
    db.commit()

    # STEP 2: Verify UPI PIN
    sender = db.execute("SELECT upi_pin, balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()
    if sender['upi_pin'] != str(data['upi_pin']):
        db.execute("UPDATE recharges SET status = 'failed' WHERE id = ?", (recharge_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Incorrect UPI PIN', 'status': 'failed', 'transaction_id': transaction_id}), 401

    # STEP 3: Check balance
    if sender['balance'] < amount:
        db.execute("UPDATE recharges SET status = 'failed' WHERE id = ?", (recharge_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Insufficient balance', 'status': 'failed', 'transaction_id': transaction_id}), 400

    # STEP 4: Deduct balance (race condition guard)
    result = db.execute(
        "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?",
        (amount, g.user['id'], amount)
    )
    if result.rowcount == 0:
        db.execute("UPDATE recharges SET status = 'failed' WHERE id = ?", (recharge_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Insufficient balance', 'status': 'failed', 'transaction_id': transaction_id}), 400

    # STEP 5: Mark SUCCESS
    db.execute("UPDATE recharges SET status = 'success' WHERE id = ?", (recharge_id,))
    db.commit()

    new_balance = db.execute("SELECT balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()['balance']

    # Process cashback
    cashback = 0
    try:
        from rewards import process_cashback
        cashback = process_cashback(g.user['id'], 'recharge', transaction_id)
        if cashback > 0:
            new_balance = db.execute("SELECT balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()['balance']
    except Exception:
        pass

    db.close()

    return jsonify({
        'message': 'Recharge successful',
        'status': 'success',
        'transaction_id': transaction_id,
        'recharge': {
            'id': recharge_id,
            'mobile_number': data['mobile_number'],
            'operator': data['operator'],
            'plan_amount': amount,
            'status': 'success'
        },
        'new_balance': new_balance,
        'cashback': cashback
    })


@recharge_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM recharges WHERE user_id = ?", (g.user['id'],)).fetchone()[0]
    rows = db.execute(
        "SELECT * FROM recharges WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (g.user['id'], per_page, offset)
    ).fetchall()
    db.close()

    return jsonify({
        'recharges': [dict(r) for r in rows],
        'total': total,
        'page': page,
        'total_pages': (total + per_page - 1) // per_page
    })


@recharge_bp.route('/history/all', methods=['GET'])
@admin_required
def get_all_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM recharges").fetchone()[0]
    rows = db.execute("""
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM recharges r JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    """, (per_page, offset)).fetchall()
    db.close()

    return jsonify({
        'recharges': [dict(r) for r in rows],
        'total': total,
        'page': page,
        'total_pages': (total + per_page - 1) // per_page
    })
