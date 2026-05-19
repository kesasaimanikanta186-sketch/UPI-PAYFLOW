// AdminCashback.jsx - Admin view of all cashback rewards
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoArrowBack, IoGiftOutline } from 'react-icons/io5'

function AdminCashback() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDistributed, setTotalDistributed] = useState(0)
  const navigate = useNavigate()

  useEffect(function () {
    loadRewards()
  }, [page])

  function loadRewards() {
    setLoading(true)
    api.get('/api/rewards/history/all?page=' + page + '&per_page=20')
      .then(function (res) {
        setRewards(res.data.rewards)
        setTotalPages(res.data.total_pages)
        setTotalDistributed(res.data.total_distributed || 0)
      })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }

  function getSourceBadgeClass(source) {
    if (source === 'transfer') return 'bg-indigo-100 text-indigo-600'
    if (source === 'recharge') return 'bg-blue-100 text-blue-600'
    if (source === 'bill_payment') return 'bg-purple-100 text-purple-600'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="page-container space-y-4">
      <button
        onClick={function () { navigate('/admin') }}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <IoArrowBack /> Admin Dashboard
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cashback & Rewards</h2>
        <span className="text-xs text-gray-500">{'\u20B9'}{totalDistributed.toLocaleString('en-IN')} distributed</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : rewards.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No cashback rewards found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map(function (reward) {
            return (
              <div key={reward.id} className="card animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-emerald-100 dark:bg-emerald-900/30">
                      <IoGiftOutline className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reward.user_name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' + getSourceBadgeClass(reward.source_type)}>
                          {reward.source_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(reward.created_at).toLocaleString('en-IN')} • {reward.source_transaction_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{'\u20B9'}{reward.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={function () { setPage(Math.max(1, page - 1)) }}
            disabled={page === 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={function () { setPage(Math.min(totalPages, page + 1)) }}
            disabled={page === totalPages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminCashback
