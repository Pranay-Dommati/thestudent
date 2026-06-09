/**
 * Scrib Payment Service
 *
 * Handles the full Razorpay credit-purchase flow:
 *   1. POST /api/scrib/payments/create-order/  → receive Razorpay order details
 *   2. Open Razorpay checkout popup
 *   3. On payment success → POST /api/scrib/payments/verify/  → backend verifies signature
 *   4. Return updated credit balance
 *
 * SECURITY:
 *  - Amounts are NEVER calculated on the frontend
 *  - Credits are NEVER added directly from frontend success
 *  - All critical logic happens on the backend after signature verification
 */
import axiosInstance from '../utils/axios'
import posthog from 'posthog-js'

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Dynamically load the Razorpay checkout script.
 * Safe to call multiple times — only loads once.
 */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = RAZORPAY_CHECKOUT_URL
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })
}

/**
 * Step 1: Create a Razorpay order on the backend.
 *
 * @param {'starter'|'popular'|'pro'} pack - The credit pack identifier
 * @returns {Promise<{key_id, order_id, amount, currency, credits, pack}>}
 */
export async function createOrder(pack) {
  const res = await axiosInstance.post('/scrib/payments/create-order/', { pack })
  return res.data
}

/**
 * Step 2: Verify the Razorpay payment on the backend.
 * Backend performs HMAC signature verification before crediting.
 *
 * @param {{razorpay_order_id, razorpay_payment_id, razorpay_signature}} paymentResponse
 * @returns {Promise<{success, credit_balance, credits_added, message}>}
 */
export async function verifyPayment(paymentResponse) {
  const res = await axiosInstance.post('/scrib/payments/verify/', {
    razorpay_order_id: paymentResponse.razorpay_order_id,
    razorpay_payment_id: paymentResponse.razorpay_payment_id,
    razorpay_signature: paymentResponse.razorpay_signature,
  })
  return res.data
}

/**
 * Fetch payment history for the current user.
 * @returns {Promise<Array>}
 */
export async function fetchPaymentHistory() {
  const res = await axiosInstance.get('/scrib/payments/history/')
  return res.data
}

/**
 * Full purchase flow:
 *   load script → create order → open Razorpay → verify on success
 *
 * @param {object} options
 * @param {'starter'|'popular'|'pro'} options.pack
 * @param {object} options.user - Current authenticated user
 * @param {function} options.onSuccess - Called with {credit_balance, credits_added}
 * @param {function} options.onFailure - Called with error message string
 * @param {function} options.onDismiss - Called when user closes the modal
 */
export async function startPaymentFlow({ pack, user, onSuccess, onFailure, onDismiss }) {
  // 1. Load the Razorpay script
  try {
    await loadRazorpayScript()
  } catch {
    onFailure?.('Could not load payment gateway. Please check your internet connection.')
    return
  }

  // 2. Create order on backend (server calculates the amount — never trust frontend)
  let orderData
  try {
    orderData = await createOrder(pack)
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to initiate payment. Please try again.'
    onFailure?.(msg)
    return
  }

  // 3. Open Razorpay checkout
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,     // in paise — set by backend
    currency: orderData.currency || 'INR',
    name: 'Scrib by EasyLearnova',
    description: `${orderData.credits} Credits Pack`,
    order_id: orderData.order_id,
    prefill: {
      name: user?.full_name || '',
      email: user?.email || '',
    },
    notes: {
      pack,
    },
    theme: {
      color: '#1f1f1f',
    },
    handler: async function (response) {
      // 4. Payment success — send to backend for signature verification
      // NEVER add credits here. Always verify on the server.
      try {
        const result = await verifyPayment(response)
        if (result.success) {
          posthog.capture('payment_completed', {
            pack,
            credits_added: result.credits_added,
            credit_balance: result.credit_balance,
          })
          onSuccess?.({
            credit_balance: result.credit_balance,
            credits_added: result.credits_added,
          })
        } else {
          onFailure?.('Payment verification failed. Please contact support.')
        }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Payment verification failed. Please contact support.'
        onFailure?.(msg)
      }
    },
    modal: {
      ondismiss: function () {
        onDismiss?.()
      },
    },
  }

  posthog.capture('payment_initiated', { pack, credits: orderData.credits, amount: orderData.amount })

  const razorpay = new window.Razorpay(options)

  razorpay.on('payment.failed', function (response) {
    const msg = response?.error?.description || 'Payment failed. Please try again.'
    posthog.capture('payment_failed', { pack, error: response?.error?.code })
    onFailure?.(msg)
  })

  razorpay.open()
}
