// App.jsx - Main application with routing
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import SendMoneyPage from './pages/SendMoneyPage'
import TransactionsPage from './pages/TransactionsPage'
import TransactionDetailPage from './pages/TransactionDetailPage'
import BankAccountsPage from './pages/BankAccountsPage'
import ProfilePage from './pages/ProfilePage'
import RechargePage from './pages/RechargePage'
import BillPaymentPage from './pages/BillPaymentPage'
import QRCodePage from './pages/QRCodePage'
import WalletRequestPage from './pages/WalletRequestPage'
import RewardsPage from './pages/RewardsPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminTransactions from './pages/AdminTransactions'
import AdminWalletRequests from './pages/AdminWalletRequests'
import AdminRecharges from './pages/AdminRecharges'
import AdminBillPayments from './pages/AdminBillPayments'
import AdminCashback from './pages/AdminCashback'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toast />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<ProtectedRoute><Navbar /><HomePage /><BottomNav /></ProtectedRoute>} />
        <Route path="/send" element={<ProtectedRoute><Navbar /><SendMoneyPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/recharge" element={<ProtectedRoute><Navbar /><RechargePage /><BottomNav /></ProtectedRoute>} />
        <Route path="/bills" element={<ProtectedRoute><Navbar /><BillPaymentPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/qr" element={<ProtectedRoute><Navbar /><QRCodePage /><BottomNav /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Navbar /><WalletRequestPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><Navbar /><RewardsPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Navbar /><TransactionsPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/transactions/:id" element={<ProtectedRoute><Navbar /><TransactionDetailPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/bank-accounts" element={<ProtectedRoute><Navbar /><BankAccountsPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Navbar /><ProfilePage /><BottomNav /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><Navbar /><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><Navbar /><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><Navbar /><AdminTransactions /></ProtectedRoute>} />
        <Route path="/admin/wallet" element={<ProtectedRoute adminOnly><Navbar /><AdminWalletRequests /></ProtectedRoute>} />
        <Route path="/admin/recharges" element={<ProtectedRoute adminOnly><Navbar /><AdminRecharges /></ProtectedRoute>} />
        <Route path="/admin/bills" element={<ProtectedRoute adminOnly><Navbar /><AdminBillPayments /></ProtectedRoute>} />
        <Route path="/admin/cashback" element={<ProtectedRoute adminOnly><Navbar /><AdminCashback /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
