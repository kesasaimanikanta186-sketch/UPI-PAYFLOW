// HomePage.jsx - Main dashboard
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import BalanceCard from '../components/BalanceCard'
import QuickActions from '../components/QuickActions'
import TransactionCard from '../components/TransactionCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoChevronForward, IoGiftOutline } from 'react-icons/io5'

function HomePage() {
  const { user, fetchProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [rewardsStats, setRewardsStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(function () {
    loadDashboardData()
  }, [])

  function loadDashboardData() {
    Promise.all([
      fetchProfile(),
      api.get('/api/transactions?per_page=5'),
      api.get('/api/rewards/stats')
    ])
      .then(function (results) {
        setTransactions(results[1].data.transactions)
        setRewardsStats(results[2].data)
      })
      .catch(function () {
        addToast('Failed to load dashboard data', 'error')
      })
      .finally(function () { setLoading(false) })
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="page-container space-y-5">
      <div className="animate-fadeIn">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Hello, {user ? user.name.split(' ')[0] : 'User'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="animate-slideUp">
        <BalanceCard balance={user ? user.balance : 0} upiId={user ? user.upi_id : ''} />
      </div>

      {rewardsStats && rewardsStats.total_cashback > 0 && (
        <button
          onClick={function () { navigate('/rewards') }}
          className="w-full card animate-slideUp flex items-center gap-3 hover:shadow-md transition-shadow"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <IoGiftOutline className="text-xl text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {'\u20B9'}{rewardsStats.total_cashback.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Cashback Earned
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {rewardsStats.this_month > 0
                ? '\u20B9' + rewardsStats.this_month.toLocaleString('en-IN') + ' this month'
                : rewardsStats.count + ' rewards earned'
              }
            </p>
          </div>
          <IoChevronForward className="text-gray-400" />
        </button>
      )}

      <div className="card animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
        <QuickActions />
      </div>

      <div className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <button
            onClick={function () { navigate('/transactions') }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1"
          >
            View All <IoChevronForward />
          </button>
        </div>

        <div className="card">
          {transactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No transactions yet</p>
              <button
                onClick={function () { navigate('/send') }}
                className="mt-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium"
              >
                Send your first payment
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map(function (txn) {
                return <TransactionCard key={txn.id} transaction={txn} />
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage
