// emailService.js - EmailJS integration for PayFlow notifications

const EMAILJS_SERVICE_ID = 'service_lt2smna'
const EMAILJS_TEMPLATE_ID = 'template_m05s98g'
const EMAILJS_PUBLIC_KEY = 'Pmh0xfUpldwp4rBKS'

function sendEmail(templateParams) {
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    })
  })
    .then(function (response) {
      if (response.ok) {
        console.log('Email sent successfully')
        return true
      }
      console.log('Email sending failed')
      return false
    })
    .catch(function (error) {
      console.log('Email service error:', error.message)
      return false
    })
}

export function sendTransactionEmail(data) {
  // Mapping the transaction data properties to match your EmailJS Dashboard template variables
  return sendEmail({
    user_name: data.to_name || 'Customer',
    status: data.status ? data.status.toUpperCase() : 'PENDING',
    amount: data.amount || '0',
    transaction_id: data.transaction_id || 'N/A',
    payment_type: data.receiver ? 'Payment to ' + data.receiver : 'Transfer',
    date: data.date_time || new Date().toLocaleString('en-IN'),
    name: data.to_name || 'Customer',
    email: data.to_email
  })
}

export function sendRechargeEmail(data) {
  return sendEmail({
    user_name: data.to_name || 'Customer',
    status: data.status ? data.status.toUpperCase() : 'PENDING',
    amount: data.amount || '0',
    transaction_id: data.transaction_id || 'N/A',
    payment_type: 'Mobile Recharge (' + (data.operator || '') + ' - ' + (data.mobile_number || '') + ')',
    date: data.date_time || new Date().toLocaleString('en-IN'),
    name: data.to_name || 'Customer',
    email: data.to_email
  })
}

export function sendBillPaymentEmail(data) {
  return sendEmail({
    user_name: data.to_name || 'Customer',
    status: data.status ? data.status.toUpperCase() : 'PENDING',
    amount: data.amount || '0',
    transaction_id: data.transaction_id || 'N/A',
    payment_type: (data.bill_type || 'Bill') + ' Payment to ' + (data.provider || 'Provider'),
    date: data.date_time || new Date().toLocaleString('en-IN'),
    name: data.to_name || 'Customer',
    email: data.to_email
  })
}

export function sendWalletRequestEmail(data) {
  return sendEmail({
    user_name: data.to_name || 'Customer',
    status: data.status ? data.status.toUpperCase() : 'UPDATED',
    amount: data.amount || '0',
    transaction_id: 'Wallet-Req',
    payment_type: 'Wallet Fund Request',
    date: data.date_time || new Date().toLocaleString('en-IN'),
    name: data.to_name || 'Customer',
    email: data.to_email
  })
}

export function sendCashbackEmail(data) {
  return sendEmail({
    user_name: data.to_name || 'Customer',
    status: 'EARNED',
    amount: data.cashback_amount || '0',
    transaction_id: 'Cashback',
    payment_type: 'Cashback on ' + (data.type || 'payment') + ' (Original Amt: Rs.' + (data.original_amount || '0') + ')',
    date: data.date_time || new Date().toLocaleString('en-IN'),
    name: data.to_name || 'Customer',
    email: data.to_email
  })
}

export function sendBlockUnblockEmail(data) {
  return sendEmail({
    user_name: data.to_name || 'Customer',
    status: data.action ? data.action.toUpperCase() : 'UPDATED',
    amount: 'N/A',
    transaction_id: 'Account-Security',
    payment_type: data.action === 'blocked' ? 'Account Blocked by Admin' : 'Account Activated',
    date: data.date_time || new Date().toLocaleString('en-IN'),
    name: data.to_name || 'Customer',
    email: data.to_email
  })
}

export default sendTransactionEmail;