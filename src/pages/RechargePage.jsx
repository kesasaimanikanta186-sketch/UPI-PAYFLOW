// RechargePage.jsx - 6-step mobile recharge flow
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { sendRechargeEmail, sendCashbackEmail } from '../services/emailService'
import { IoPhonePortraitOutline, IoCheckmarkCircle, IoCloseCircle, IoArrowBack } from 'react-icons/io5'

function RechargePage() {
  const { user, fetchProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [mobileNumber, setMobileNumber] = useState('')
  const [operator, setOperator] = useState('')
  const [planAmount, setPlanAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [pin, setPin] = useState('')
  const [result, setResult] = useState(null)

  var operators = [
    { name: 'Jio', color: 'bg-blue-500' },
    { name: 'Airtel', color: 'bg-red-500' },
    { name: 'Vi', color: 'bg-purple-500' },
    { name: 'BSNL', color: 'bg-green-500' }
  ]

  var plans = [
    { amount: 199, validity: '28 days', data: '1.5GB/day' },
    { amount: 239, validity: '28 days', data: '2GB/day' },
    { amount: 299, validity: '28 days', data: '2GB/day + extras' },
    { amount: 399, validity: '56 days', data: '1.5GB/day' }
  ]

  function handleMobileNext() {
    if (mobileNumber.length !== 10) {
      addToast('Enter a valid 10-digit mobile number', 'error')
      return
    }
    if (!operator) {
      addToast('Select an operator', 'error')
      return
    }
    setStep(2)
  }

  function handlePlanNext() {
    var amt = planAmount || customAmount
    if (!amt || parseFloat(amt) <= 0) {
      addToast('Select a plan or enter custom amount', 'error')
      return
    }
    setPlanAmount(amt)
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
      api.post('/api/recharge/process', {
        mobile_number: mobileNumber,
        operator: operator,
        plan_amount: parseFloat(planAmount),
        upi_pin: pin
      })
        .then(function (res) {
          setResult({ status: 'success', data: res.data })
          setStep(6)
          fetchProfile()

          sendRechargeEmail({
            to_email: user.email,
            to_name: user.name,
            amount: planAmount,
            mobile_number: mobileNumber,
            operator: operator,
            transaction_id: res.data.transaction_id,
            status: 'Success',
            date_time: new Date().toLocaleString('en-IN')
          })

          if (res.data.cashback && res.data.cashback > 0) {
            sendCashbackEmail({
              to_email: user.email,
              to_name: user.name,
              cashback_amount: res.data.cashback,
              original_amount: planAmount,
              type: 'recharge',
              date_time: new Date().toLocaleString('en-IN')
            })
          }
        })
        .catch(function (err) {
          var msg = err.response && err.response.data ? err.response.data.error : 'Recharge failed'
          var txnId = err.response && err.response.data ? err.response.data.transaction_id : null
          setResult({ status: 'failed', message: msg, transaction_id: txnId })
          setStep(6)

          if (txnId) {
            sendRechargeEmail({
              to_email: user.email,
              to_name: user.name,
              amount: planAmount,
              mobile_number: mobileNumber,
              operator: operator,
              transaction_id: txnId,
              status: 'Failed - ' + msg,
              date_time: new Date().toLocaleString('en-IN')
            })
          }
        })
    }, 2000)
  }

  function getFinalAmount() {
    return planAmount || customAmount || '0'
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

      {/* Step 1: Mobile Number + Operator */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mobile Recharge</h2>

          <div className="card">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
              Mobile Number
            </label>
            <div className="relative">
              <IoPhonePortraitOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={mobileNumber}
                onChange={function (e) {
                  var val = e.target.value.replace(/\D/g, '')
                  if (val.length <= 10) setMobileNumber(val)
                }}
                placeholder="Enter 10-digit number"
                className="input-field pl-10"
                maxLength={10}
              />
            </div>
          </div>

          <div className="card">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block">
              Select Operator
            </label>
            <div className="grid grid-cols-2 gap-3">
              {operators.map(function (op) {
                return (
                  <button
                    key={op.name}
                    onClick={function () { setOperator(op.name) }}
                    className={'p-4 rounded-xl border-2 transition-all text-center ' +
                      (operator === op.name
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')
                    }
                  >
                    <div className={'w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ' + op.color}>
                      <span className="text-white font-bold text-sm">{op.name[0]}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{op.name}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={handleMobileNext} className="btn-primary w-full">Continue</button>
        </div>
      )}

      {/* Step 2: Select Plan */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Plan</h2>

          <div className="space-y-3">
            {plans.map(function (plan) {
              return (
                <button
                  key={plan.amount}
                  onClick={function () { setPlanAmount(String(plan.amount)); setCustomAmount('') }}
                  className={'card w-full text-left transition-all border-2 ' +
                    (planAmount === String(plan.amount)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-transparent')
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {'\u20B9'}{plan.amount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.validity} | {plan.data}
                      </p>
                    </div>
                    <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center ' +
                      (planAmount === String(plan.amount)
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300 dark:border-gray-600')
                    }>
                      {planAmount === String(plan.amount) && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="card">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{'\u20B9'}</span>
              <input
                type="number"
                value={customAmount}
                onChange={function (e) { setCustomAmount(e.target.value); setPlanAmount('') }}
                placeholder="Custom amount"
                className="input-field pl-8"
                min="1"
              />
            </div>
          </div>

          <button onClick={handlePlanNext} className="btn-primary w-full">Continue</button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">Confirm Recharge</h2>

          <div className="card space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Recharge Amount</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white my-2">
                {'\u20B9'}{parseFloat(getFinalAmount()).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Operator</span>
                <span className="text-gray-900 dark:text-white font-medium">{operator}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mobile Number</span>
                <span className="text-gray-900 dark:text-white font-medium">{mobileNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="text-gray-900 dark:text-white font-medium">{'\u20B9'}{getFinalAmount()}</span>
              </div>
            </div>
          </div>

          <button onClick={handleConfirm} className="btn-primary w-full">
            Pay {'\u20B9'}{parseFloat(getFinalAmount()).toLocaleString('en-IN')}
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
            Confirm Recharge
          </button>
        </div>
      )}

      {/* Step 5: Processing */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center animate-pulse mb-6">
            <IoPhonePortraitOutline className="text-3xl text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Processing Recharge...</p>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Recharge Successful!</h2>
              <p className="text-3xl font-bold text-emerald-500 mb-2">
                {'\u20B9'}{parseFloat(planAmount).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {operator} recharge for {mobileNumber}
              </p>

              <div className="card w-full mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">{result.data.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Operator</span>
                  <span className="text-gray-900 dark:text-white">{operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile</span>
                  <span className="text-gray-900 dark:text-white">{mobileNumber}</span>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Recharge Failed</h2>
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
                setStep(1); setPlanAmount(''); setCustomAmount(''); setPin(''); setMobileNumber(''); setOperator(''); setResult(null)
              }}
              className="btn-primary flex-1"
            >
              Recharge Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RechargePage
