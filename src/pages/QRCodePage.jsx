// QRCodePage.jsx - QR code display and scanner
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { IoQrCodeOutline, IoScanOutline, IoArrowForward } from 'react-icons/io5'

function QRCodePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('myqr')
  const [manualUpi, setManualUpi] = useState('')
  const scannerRef = useRef(null)

  useEffect(function () {
    var scanner = null

    if (activeTab === 'scan') {
      scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }, false)

      scanner.render(
        function (decodedText) {
          scanner.clear()
          navigate('/send', { state: { prefillUpi: decodedText } })
        },
        function (error) {
          // scan error - ignore
        }
      )

      scannerRef.current = scanner
    }

    return function () {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(function () { })
        scannerRef.current = null
      }
    }
  }, [activeTab, navigate])

  function handleManualPay() {
    if (!manualUpi.trim() || !manualUpi.includes('@')) {
      addToast('Enter a valid UPI ID', 'error')
      return
    }
    navigate('/send', { state: { prefillUpi: manualUpi.trim() } })
  }

  return (
    <div className="page-container">
      <div className="animate-fadeIn">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">QR Code</h2>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={function () { setActiveTab('myqr') }}
            className={'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ' +
              (activeTab === 'myqr'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400')
            }
          >
            <IoQrCodeOutline /> My QR
          </button>
          <button
            onClick={function () { setActiveTab('scan') }}
            className={'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ' +
              (activeTab === 'scan'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400')
            }
          >
            <IoScanOutline /> Scan QR
          </button>
        </div>

        {/* My QR Tab */}
        {activeTab === 'myqr' && (
          <div className="animate-fadeIn">
            <div className="card flex flex-col items-center py-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                <QRCodeSVG
                  value={user ? user.upi_id : ''}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                {user ? user.name : ''}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {user ? user.upi_id : ''}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Scan this QR to pay me
              </p>
            </div>
          </div>
        )}

        {/* Scan QR Tab */}
        {activeTab === 'scan' && (
          <div className="animate-fadeIn space-y-4">
            <div className="card overflow-hidden">
              <div id="qr-reader" className="w-full"></div>
            </div>

            <div className="card">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Or enter UPI ID manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualUpi}
                  onChange={function (e) { setManualUpi(e.target.value) }}
                  placeholder="phone@payflow"
                  className="input-field flex-1"
                />
                <button onClick={handleManualPay} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
                  Pay <IoArrowForward />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRCodePage
