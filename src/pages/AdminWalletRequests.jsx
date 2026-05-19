// AdminWalletRequests.jsx - Admin view of wallet add-money requests
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { sendWalletRequestEmail } from '../services/emailService'
import { IoArrowBack, IoWalletOutline, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from 'react-icons/io5'

function AdminWalletRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()
  const { addToast } = useToast()

  useEffect(function () {
    loadRequests()
  }, [page, filter])

  function loadRequests() {
    setLoading(true)
    api.get('/api/wallet/requests/all?page=' + page + '&per_page=20&status=' + filter)
      .then(function (res) {
        setRequests(res.data.requests)
        setTotalPages(res.data.total_pages)
      })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }

  function handleApprove(request) {
    api.put('/api/wallet/requests/' + request.id + '/approve')
      .then(function (res) {
        addToast('Request approved successfully', 'success')
        sendWalletRequestEmail({
          to_email: request.email,
          to_name: request.user_name,
          amount: request.amount,
          status: 'approved',
          date_time: new Date().toLocaleString('en-IN')
        })
        loadRequests()
      })
      .catch(function (err) {
        addToast(err.response?.data?.error || 'Failed to approve request', 'error')
      })
  }

  function handleReject(request) {
    api.put('/api/wallet/requests/' + request.id + '/reject')
      .then(function (res) {
        addToast('Request rejected', 'success')
        sendWalletRequestEmail({
          to_email: request.email,
          to_name: request.user_name,
          amount: request.amount,
          status: 'rejected',
          date_time: new Date().toLocaleString('en-IN')
        })
        loadRequests()
      })
      .catch(function (err) {
        addToast(err.response?.data?.error || 'Failed to reject request', 'error')
      })
  }

  var filters = ['all', 'pending', 'approved', 'rejected']

  function getFilteredRequests() {
    if (filter === 'all') return requests
    return requests.filter(function (r) { return r.status === filter })
  }

  return (
    <div className="page-container space-y-4">
      <button
        onClick={function () { navigate('/admin') }}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <IoArrowBack /> Admin Dashboard
      </button>

      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Wallet Requests</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(function (f) {
          return (
            <button
              key={f}
              onClick={function () { setFilter(f); setPage(1) }}
              className={'px-3 py-1 rounded-full text-xs font-medium transition-colors ' +
                (filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300')
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          )
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No wallet requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {getFilteredRequests().map(function (req) {
            var isApproved = req.status === 'approved'
            var isPending = req.status === 'pending'
            var isRejected = req.status === 'rejected'
            return (
              <div key={req.id} className="card animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={'w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ' +
                      (isApproved ? 'bg-emerald-100 dark:bg-emerald-900/30' : isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30')
                    }>
                      {isApproved
                        ? <IoCheckmarkCircle className="text-emerald-500" />
                        : isPending
                          ? <IoTimeOutline className="text-amber-500" />
                          : <IoCloseCircle className="text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {req.user_name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(req.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{'\u20B9'}{req.amount.toLocaleString('en-IN')}</p>
                    <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' +
                      (isApproved ? 'bg-emerald-100 text-emerald-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')
                    }>
                      {req.status}
                    </span>
                    {isPending && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={function () { handleApprove(req) }}
                          className="px-2 py-1 text-[10px] font-medium rounded bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={function () { handleReject(req) }}
                          className="px-2 py-1 text-[10px] font-medium rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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

export default AdminWalletRequests
