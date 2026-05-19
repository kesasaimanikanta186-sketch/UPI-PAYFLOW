# wallet.py - Wallet request routes for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required, admin_required
from database import get_db

wallet_bp = Blueprint('wallet', __name__)


@wallet_bp.route('/request', methods=['POST'])
@login_required
def submit_request():
    data = request.get_json()

    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400

    amount = float(data['amount'])
    if amount > 100000:
        return jsonify({'error': 'Maximum request amount is 1,00,000'}), 400

    db = get_db()
    req_id = str(uuid.uuid4())

    db.execute(
        "INSERT INTO wallet_requests (id, user_id, amount, status) VALUES (?,?,?,?)",
        (req_id, g.user['id'], amount, 'pending')
    )
    db.commit()
    db.close()

    return jsonify({
        'message': 'Wallet request submitted',
        'request': {
            'id': req_id,
            'amount': amount,
            'status': 'pending'
        }
    }), 201


@wallet_bp.route('/requests', methods=['GET'])
@login_required
def get_my_requests():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM wallet_requests WHERE user_id = ? ORDER BY request_date DESC",
        (g.user['id'],)
    ).fetchall()
    db.close()

    return jsonify({'requests': [dict(r) for r in rows]})


@wallet_bp.route('/requests/all', methods=['GET'])
@admin_required
def get_all_requests():
    db = get_db()
    status_filter = request.args.get('status', '')

    query = """
        SELECT wr.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
        FROM wallet_requests wr
        JOIN users u ON wr.user_id = u.id
    """
    params = []

    if status_filter:
        query += " WHERE wr.status = ?"
        params.append(status_filter)

    query += " ORDER BY wr.request_date DESC"

    rows = db.execute(query, params).fetchall()
    db.close()

    return jsonify({'requests': [dict(r) for r in rows]})


@wallet_bp.route('/requests/<request_id>/approve', methods=['PUT'])
@admin_required
def approve_request(request_id):
    db = get_db()

    req = db.execute("SELECT * FROM wallet_requests WHERE id = ?", (request_id,)).fetchone()
    if not req:
        db.close()
        return jsonify({'error': 'Request not found'}), 404

    if req['status'] != 'pending':
        db.close()
        return jsonify({'error': 'Request already processed'}), 400

    db.execute(
        "UPDATE wallet_requests SET status = 'approved', approved_by = ?, approved_date = CURRENT_TIMESTAMP WHERE id = ?",
        (g.user['id'], request_id)
    )
    db.execute(
        "UPDATE users SET balance = balance + ? WHERE id = ?",
        (req['amount'], req['user_id'])
    )
    db.commit()

    new_balance = db.execute("SELECT balance FROM users WHERE id = ?", (req['user_id'],)).fetchone()['balance']
    user = db.execute("SELECT name, email FROM users WHERE id = ?", (req['user_id'],)).fetchone()
    db.close()

    return jsonify({
        'message': 'Request approved',
        'user_name': user['name'],
        'user_email': user['email'],
        'amount': req['amount'],
        'user_new_balance': new_balance
    })


@wallet_bp.route('/requests/<request_id>/reject', methods=['PUT'])
@admin_required
def reject_request(request_id):
    db = get_db()

    req = db.execute("SELECT * FROM wallet_requests WHERE id = ?", (request_id,)).fetchone()
    if not req:
        db.close()
        return jsonify({'error': 'Request not found'}), 404

    if req['status'] != 'pending':
        db.close()
        return jsonify({'error': 'Request already processed'}), 400

    db.execute(
        "UPDATE wallet_requests SET status = 'rejected', approved_by = ?, approved_date = CURRENT_TIMESTAMP WHERE id = ?",
        (g.user['id'], request_id)
    )
    db.commit()

    user = db.execute("SELECT name, email FROM users WHERE id = ?", (req['user_id'],)).fetchone()
    db.close()

    return jsonify({
        'message': 'Request rejected',
        'user_name': user['name'],
        'user_email': user['email'],
        'amount': req['amount']
    })
