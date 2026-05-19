# rewards.py - Cashback and rewards routes for PayFlow
import uuid
import random
from flask import Blueprint, request, jsonify, g
from auth import login_required, admin_required
from database import get_db

rewards_bp = Blueprint('rewards', __name__)


def process_cashback(user_id, source_type, source_transaction_id):
    """Called after a successful payment. Returns cashback amount or 0."""
    if random.random() > 0.7:
        return 0

    cashback = round(random.uniform(1, 50), 2)
    reward_id = str(uuid.uuid4())

    db = get_db()
    db.execute(
        "INSERT INTO rewards (id, user_id, amount, reward_type, source_type, source_transaction_id) VALUES (?,?,?,?,?,?)",
        (reward_id, user_id, cashback, 'cashback', source_type, source_transaction_id)
    )
    db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (cashback, user_id))
    db.commit()
    db.close()
    return cashback


@rewards_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC",
        (g.user['id'],)
    ).fetchall()
    total_cashback = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM rewards WHERE user_id = ?",
        (g.user['id'],)
    ).fetchone()['total']
    db.close()

    return jsonify({
        'rewards': [dict(r) for r in rows],
        'total_cashback': total_cashback
    })


@rewards_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    db = get_db()
    total = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM rewards WHERE user_id = ?",
        (g.user['id'],)
    ).fetchone()['total']

    this_month = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM rewards WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
        (g.user['id'],)
    ).fetchone()['total']

    count = db.execute(
        "SELECT COUNT(*) as count FROM rewards WHERE user_id = ?",
        (g.user['id'],)
    ).fetchone()['count']
    db.close()

    return jsonify({
        'total_cashback': total,
        'this_month_cashback': this_month,
        'reward_count': count
    })


@rewards_bp.route('/history/all', methods=['GET'])
@admin_required
def get_all_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM rewards").fetchone()[0]
    total_distributed = db.execute("SELECT COALESCE(SUM(amount), 0) as total FROM rewards").fetchone()['total']
    rows = db.execute("""
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM rewards r JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    """, (per_page, offset)).fetchall()
    db.close()

    return jsonify({
        'rewards': [dict(r) for r in rows],
        'total': total,
        'total_distributed': total_distributed,
        'page': page,
        'total_pages': (total + per_page - 1) // per_page
    })
