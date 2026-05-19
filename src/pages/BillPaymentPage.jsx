// BillPaymentPage.jsx - 6-step bill payment flow
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { sendBillPaymentEmail, sendCashbackEmail } from '../services/emailService'
import {
  IoFlashOutline, IoWaterOutline, IoFlameOutline, IoTvOutline,
  IoWifiOutline, IoShieldOutline, IoCardOutline,
  IoCheckmarkCircle, IoCloseCircle, IoArrowBack
} from 'react-icons/io5'

function BillPaymentPage() {
  const { user, fetchProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [billType, setBillType] = useState('')
  const [provider, setProvider] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [result, setResult] = useState(null)

  var billTypes = [
    { key: 'electricity', label: 'Electricity', icon: IoFlashOutline, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { key: 'water', label: 'Water', icon: IoWaterOutline, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { key: 'gas', label: 'Gas', icon: IoFlameOutline, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { key: 'dth', label: 'DTH', icon: IoTvOutline, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { key: 'broadband', label: 'Broadband', icon: IoWifiOutline, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30' },
    { key: 'insurance', label: 'Insurance', icon: IoShieldOutline, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { key: 'credit_card', label: 'Credit Card', icon: IoCardOutline, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' }
  ]

  var providers = {
    electricity: ['BESCOM', 'MSEDCL', 'TATA Power', 'Adani Electricity', 'CESC'],
    water: ['Delhi Jal Board', 'BWSSB', 'MCGM', 'Chennai Metro Water'],
    gas: ['Indraprastha Gas', 'Mahanagar Gas', 'Adani Gas', 'Gujarat Gas'],
    dth: ['Tata Play', 'Airtel Digital TV', 'Dish TV', 'Sun Direct'],
    broadband: ['Jio Fiber', 'Airtel Xstream', 'ACT Fibernet', 'BSNL Fiber'],
    insurance: ['LIC', 'ICICI Prudential', 'HDFC Life', 'SBI Life'],
    credit_card: ['HDFC', 'ICICI', 'SBI Card', 'Axis Bank', 'Kotak']
  }

  function handleBillTypeSelect(type) {
    setBillType(type)
    setProvider('')
    setStep(2)
  }

  function handleDetailsNext() {
    if (!provider) {
      addToast('Select a provider', 'error')
      return
    }
    if (!accountNumber.trim()) {
      addToast('Enter account number', 'error')
      return
    }
    var amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    setStep(3)
  }

  function handleConfirm() {
    setStep(4)
  }

  function handlePinSubmit() {
    if (pin.length !== 4) {
      addToast('Enter 4-digit UPI PIN', 'error')
      return
    }
    setStep(5)

    setTimeout(function () {
      api.post('/api/bills/pay', {
        bill_type: billType,
        provider: provider,
        account_number: accountNumber,
        amount: parseFloat(amount),
        upi_pin: pin
      })
        .then(function (res) {
          setResult({ status: 'success', data: res.data })
          setStep(6)
          fetchProfile()

          sendBillPaymentEmail({
            to_email: user.email,
            to_name: user.name,
            bill_type: billType,
            provider: provider,
            account_number: accountNumber,
            amount: amount,
            transaction_id: res.data.transaction_id,
            status: 'Success',
            date_time: new Date().toLocaleString('en-IN')
          })

          if (res.data.cashback && res.data.cashback > 0) {
            sendCashbackEmail({
              to_email: user.email,
              to_name: user.name,
              cashback_amount: res.data.cashback,
              original_amount: amount,
              type: 'bill_payment',
              date_time: new Date().toLocaleString('en-IN')
            })
          }
        })
        .catch(function (err) {
          var msg = err.response && err.response.data ? err.response.data.error : 'Bill payment failed'
          var txnId = err.response && err.response.data ? err.response.data.transaction_id : null
          setResult({ status: 'failed', message: msg, transaction_id: txnId })
          setStep(6)

          if (txnId) {
            sendBillPaymentEmail({
              to_email: user.email,
              to_name: user.name,
              bill_type: billType,
              provider: provider,
              account_number: accountNumber,
              amount: amount,
              transaction_id: txnId,
              status: 'Failed - ' + msg,
              date_time: new Date().toLocaleString('en-IN')
            })
          }
        })
    }, 2000)
  }

  function getBillTypeLabel() {
    var found = billTypes.find(function (bt) { return bt.key === billType })
    return found ? found.label : billType
  }

  return (
    <div className="page-container">
      {step > 1 && step < 5 && (
        <button
          onClick={function () { setStep(step - 1) }}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-gray-700"
        >
          <IoArrowBack /> Back
        </button>
      )}

      {/* Step 1: Select Bill Type */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pay Bills</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select bill category</p>

          <div className="grid grid-cols-3 gap-3">
            {billTypes.map(function (bt) {
              var Icon = bt.icon
              return (
                <button
                  key={bt.key}
                  onClick={function () { handleBillTypeSelect(bt.key) }}
                  className="card flex flex-col items-center gap-2 p-4 hover:shadow-md transition-shadow"
                >
                  <div className={'w-12 h-12 rounded-full flex items-center justify-center ' + bt.bg}>
                    <Icon className={'text-xl ' + bt.color} />
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{bt.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Provider + Account + Amount */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{getBillTypeLabel()} Bill</h2>

          <div className="card space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Select Provider
              </label>
              <select
                value={provider}
                onChange={function (e) { setProvider(e.target.value) }}
                className="input-field"
              >
                <option value="">Choose provider</option>
                {(providers[billType] || []).map(function (p) {
                  return <option key={p} value={p}>{p}</option>
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Account / Consumer Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={function (e) { setAccountNumber(e.target.value) }}
                placeholder="Enter account number"
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{'\u20B9'}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={function (e) { setAmount(e.target.value) }}
                  placeholder="Enter bill amount"
                  className="input-field pl-8"
                  min="1"
                />
              </div>
            </div>
          </div>

          <button onClick={handleDetailsNext} className="btn-primary w-full">Continue</button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">Confirm Payment</h2>

          <div className="card space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Bill Amount</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white my-2">
                {'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bill Type</span>
                <span className="text-gray-900 dark:text-white font-medium">{getBillTypeLabel()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-900 dark:text-white font-medium">{provider}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account No.</span>
                <span className="text-gray-900 dark:text-white font-medium">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="text-gray-900 dark:text-white font-medium">{'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <button onClick={handleConfirm} className="btn-primary w-full">
            Pay {'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}
          </button>
        </div>
      )}

      {/* Step 4: UPI PIN */}
      {step === 4 && (
        <div className="space-y-4 animate-fadeIn text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <span className="text-2xl">&#128274;</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enter UPI PIN</h2>
          <p className="text-sm text-gray-500">Enter your 4-digit UPI PIN to confirm</p>

          <div className="flex justify-center">
            <input
              type="password"
              value={pin}
              onChange={function (e) {
                if (e.target.value.length <= 4) setPin(e.target.value)
              }}
              placeholder="----"
              className="input-field w-40 text-center text-2xl tracking-[0.5em] font-bold"
              maxLength={4}
              autoFocus
            />
          </div>

          <button
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
            className="btn-primary w-full"
          >
            Confirm Payment
          </button>
        </div>
      )}

      {/* Step 5: Processing */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center animate-pulse mb-6">
            <IoCardOutline className="text-3xl text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Processing Payment...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
          <div className="flex gap-1 mt-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Step 6: Result */}
      {step === 6 && result && (
        <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
          {result.status === 'success' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <IoCheckmarkCircle className="text-5xl text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Payment Successful!</h2>
              <p className="text-3xl font-bold text-emerald-500 mb-2">
                {'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getBillTypeLabel()} bill paid to {provider}
              </p>

              <div className="card w-full mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">{result.data.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider</span>
                  <span className="text-gray-900 dark:text-white">{provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account</span>
                  <span className="text-gray-900 dark:text-white">{accountNumber}</span>
                </div>
                {result.data.cashback && result.data.cashback > 0 && (
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-emerald-600 font-medium">Cashback Earned</span>
                    <span className="text-emerald-600 font-bold">
                      {'\u20B9'}{result.data.cashback.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <IoCloseCircle className="text-5xl text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Payment Failed</h2>
              <p className="text-sm text-red-500">{result.message}</p>
              {result.transaction_id && (
                <p className="text-xs text-gray-400 mt-1">Ref: {result.transaction_id}</p>
              )}
            </>
          )}

          <div className="flex gap-3 w-full mt-6">
            <button onClick={function () { navigate('/') }} className="btn-secondary flex-1">Home</button>
            <button
              onClick={function () {
                setStep(1); setBillType(''); setProvider(''); setAccountNumber(''); setAmount(''); setPin(''); setResult(null)
              }}
              className="btn-primary flex-1"
            >
              Pay Another Bill
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillPaymentPage
