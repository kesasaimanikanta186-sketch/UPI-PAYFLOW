// WalletRequestPage.jsx - Request wallet top-up (admin approval required)
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoWalletOutline, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from 'react-icons/io5'

function WalletRequestPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [amount, setAmount] = useState('')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(function () {
    fetchRequests()
  }, [])

  function fetchRequests() {
    setLoading(true)
    api.get('/api/wallet/requests')
      .then(function (res) {
        setRequests(res.data.requests)
      })
      .catch(function () {
        addToast('Failed to load requests', 'error')
      })
      .finally(function () {
        setLoading(false)
      })
  }

  function handleSubmit(e) {
    e.preventDefault()
    var amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    setSubmitting(true)
    api.post('/api/wallet/request', { amount: amt })
      .then(function () {
        addToast('Wallet request submitted successfully', 'success')
        setAmount('')
        fetchRequests()
      })
      .catch(function (err) {
        var msg = err.response && err.response.data ? err.response.data.error : 'Request failed'
        addToast(msg, 'error')
      })
      .finally(function () {
        setSubmitting(false)
      })
  }

  function getStatusBadge(status) {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <IoCheckmarkCircle /> Approved
        </span>
      )
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <IoCloseCircle /> Rejected
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <IoTimeOutline /> Pending
      </span>
    )
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="page-container">
      <div className="animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <IoWalletOutline className="text-xl text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Wallet Request</h2>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="card mb-6">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
            Request Amount
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{'\u20B9'}</span>
              <input
                type="number"
                value={amount}
                onChange={function (e) { setAmount(e.target.value) }}
                placeholder="Enter amount"
                className="input-field pl-8"
                min="1"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-2 text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Request will be reviewed by admin before approval
          </p>
        </form>

        {/* Requests List */}
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Requests</h3>

        {loading ? (
          <LoadingSpinner />
        ) : requests.length === 0 ? (
          <div className="card text-center py-8">
            <IoWalletOutline className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(function (req) {
              return (
                <div key={req.id} className="card animate-slideUp">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {'\u20B9'}{parseFloat(req.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(req.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletRequestPage
