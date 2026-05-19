// RewardsPage.jsx - Cashback and rewards history
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoGiftOutline, IoTrendingUpOutline, IoCalendarOutline } from 'react-icons/io5'

function RewardsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(function () {
    setLoading(true)
    Promise.all([
      api.get('/api/rewards/history'),
      api.get('/api/rewards/stats')
    ])
      .then(function (results) {
        setHistory(results[0].data.rewards)
        setStats(results[1].data)
      })
      .catch(function () {
        addToast('Failed to load rewards', 'error')
      })
      .finally(function () {
        setLoading(false)
      })
  }, [])

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  function getSourceBadge(sourceType) {
    if (sourceType === 'transfer') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          Transfer
        </span>
      )
    }
    if (sourceType === 'recharge') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Recharge
        </span>
      )
    }
    if (sourceType === 'bill_payment') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          Bill Payment
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
        {sourceType}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="animate-fadeIn">
        {/* Header gradient card */}
        <div className="gradient-bg rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <IoGiftOutline className="text-2xl" />
            <h2 className="text-lg font-bold">My Rewards</h2>
          </div>
          <p className="text-sm opacity-80">Total Cashback Earned</p>
          <p className="text-3xl font-bold mt-1">
            {'\u20B9'}{stats ? parseFloat(stats.total_cashback).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4">
            <IoTrendingUpOutline className="text-xl text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {'\u20B9'}{stats ? parseFloat(stats.total_earned).toLocaleString('en-IN') : '0'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Total Earned</p>
          </div>
          <div className="card text-center py-4">
            <IoCalendarOutline className="text-xl text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {'\u20B9'}{stats ? parseFloat(stats.this_month).toLocaleString('en-IN') : '0'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">This Month</p>
          </div>
          <div className="card text-center py-4">
            <IoGiftOutline className="text-xl text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats ? stats.rewards_count : 0}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Rewards Count</p>
          </div>
        </div>

        {/* History List */}
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rewards History</h3>

        {history.length === 0 ? (
          <div className="card text-center py-8">
            <IoGiftOutline className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No rewards yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Make transactions to earn cashback</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(function (reward) {
              return (
                <div key={reward.id} className="card animate-slideUp">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <IoGiftOutline className="text-lg text-emerald-500" />
                      </div>
                      <div>
                        {getSourceBadge(reward.source_type)}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(reward.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-emerald-500">
                      +{'\u20B9'}{parseFloat(reward.amount).toLocaleString('en-IN')}
                    </p>
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

export default RewardsPage
