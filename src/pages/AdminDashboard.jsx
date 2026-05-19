// AdminDashboard.jsx - Admin analytics dashboard with charts and auto-refresh
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { IoPeopleOutline, IoSwapHorizontalOutline, IoTrendingUp, IoTimeOutline, IoChevronForward, IoWalletOutline, IoPhonePortraitOutline, IoReceiptOutline, IoGiftOutline, IoRefreshOutline } from 'react-icons/io5'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const navigate = useNavigate()
  const intervalRef = useRef(null)

  function loadStats() {
    return api.get('/api/admin/stats')
      .then(function (res) {
        setStats(res.data)
        setLastRefresh(new Date())
      })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }

  useEffect(function () {
    loadStats()
    intervalRef.current = setInterval(loadStats, 30000)
    return function () {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (loading) return <LoadingSpinner fullScreen />
  if (!stats) return null

  var pieData = [
    { name: 'Success', value: stats.transactions.successful },
    { name: 'Failed', value: stats.transactions.failed },
    { name: 'Pending', value: stats.transactions.pending },
  ]
  var PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

  var monthlyData = (stats.monthly_transactions || []).reverse().map(function (m) {
    return {
      month: m.month,
      transactions: m.count,
      volume: Math.round((m.volume || 0) / 1000),
    }
  })

  var userGrowth = (stats.monthly_users || []).reverse().map(function (m) {
    return { month: m.month, users: m.count }
  })

  var rechargeByOperator = (stats.recharges && stats.recharges.by_operator) || []
  var billByType = (stats.bill_payments && stats.bill_payments.by_type) || []
  var cashbackBySource = (stats.cashback && stats.cashback.by_source) || []

  var CASHBACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

  var statCards = [
    { label: 'Total Users', value: stats.users.total, icon: IoPeopleOutline, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40' },
    { label: 'Transactions', value: stats.transactions.total, icon: IoSwapHorizontalOutline, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40' },
    { label: 'Active Users', value: stats.users.active, icon: IoTrendingUp, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40' },
    { label: 'Pending Txns', value: stats.transactions.pending, icon: IoTimeOutline, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
    { label: 'Wallet Pending', value: stats.wallet_requests ? stats.wallet_requests.pending : 0, icon: IoWalletOutline, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Recharges', value: stats.recharges ? stats.recharges.total : 0, icon: IoPhonePortraitOutline, color: 'text-red-600 bg-red-100 dark:bg-red-900/40' },
    { label: 'Bill Payments', value: stats.bill_payments ? stats.bill_payments.total : 0, icon: IoReceiptOutline, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/40' },
    { label: 'Cashback Given', value: '\u20B9' + ((stats.cashback ? stats.cashback.total_distributed : 0).toLocaleString('en-IN')), icon: IoGiftOutline, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/40' },
  ]

  var quickLinks = [
    { label: 'Manage Users', path: '/admin/users', icon: IoPeopleOutline, iconColor: 'text-indigo-500' },
    { label: 'Transactions', path: '/admin/transactions', icon: IoSwapHorizontalOutline, iconColor: 'text-emerald-500' },
    { label: 'Wallet Requests', path: '/admin/wallet', icon: IoWalletOutline, iconColor: 'text-blue-500' },
    { label: 'Recharges', path: '/admin/recharges', icon: IoPhonePortraitOutline, iconColor: 'text-red-500' },
    { label: 'Bill Payments', path: '/admin/bills', icon: IoReceiptOutline, iconColor: 'text-orange-500' },
    { label: 'Cashback', path: '/admin/cashback', icon: IoGiftOutline, iconColor: 'text-pink-500' },
  ]

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">System overview & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-[10px] text-gray-400">
              {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={loadStats}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh"
          >
            <IoRefreshOutline className="text-lg text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(function (card, i) {
          var Icon = card.icon
          return (
            <div key={i} className="card py-4 animate-slideUp" style={{ animationDelay: (i * 0.05) + 's' }}>
              <div className={'w-10 h-10 rounded-xl flex items-center justify-center mb-2 ' + card.color}>
                <Icon className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickLinks.map(function (link) {
          var Icon = link.icon
          return (
            <button
              key={link.path}
              onClick={function () { navigate(link.path) }}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <Icon className={link.iconColor + ' text-xl'} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{link.label}</span>
              </div>
              <IoChevronForward className="text-gray-400" />
            </button>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Transactions</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Transaction Status</h3>
          {stats.transactions.total > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={function (entry) { return entry.name + ': ' + entry.value }}
                >
                  {pieData.map(function (entry, index) {
                    return <Cell key={index} fill={PIE_COLORS[index]} />
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 - Recharges by Operator & Bills by Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recharges by Operator</h3>
          {rechargeByOperator.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rechargeByOperator}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="operator" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No recharge data yet</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bills by Type</h3>
          {billByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={billByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bill_type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No bill payment data yet</p>
          )}
        </div>
      </div>

      {/* Charts Row 3 - Cashback Distribution & User Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Cashback Distribution</h3>
          {cashbackBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={cashbackBySource.map(function (c) { return { name: c.source_type, value: c.total } })}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={function (entry) { return entry.name + ': \u20B9' + entry.value }}
                >
                  {cashbackBySource.map(function (entry, index) {
                    return <Cell key={index} fill={CASHBACK_COLORS[index % CASHBACK_COLORS.length]} />
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No cashback data yet</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Blocked Users</span>
            <span className="font-medium text-red-500">{stats.users.blocked}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Volume</span>
            <span className="font-medium text-gray-900 dark:text-white">{'\u20B9'}{stats.transactions.volume.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-medium text-emerald-500">
              {stats.transactions.total > 0
                ? ((stats.transactions.successful / stats.transactions.total) * 100).toFixed(1) + '%'
                : 'N/A'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Recharge Vol.</span>
            <span className="font-medium text-gray-900 dark:text-white">{'\u20B9'}{(stats.recharges ? stats.recharges.volume : 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bill Vol.</span>
            <span className="font-medium text-gray-900 dark:text-white">{'\u20B9'}{(stats.bill_payments ? stats.bill_payments.volume : 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Wallet Approved</span>
            <span className="font-medium text-gray-900 dark:text-white">{'\u20B9'}{(stats.wallet_requests ? stats.wallet_requests.approved_amount : 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center">Auto-refreshes every 30 seconds</p>
    </div>
  )
}

export default AdminDashboard
