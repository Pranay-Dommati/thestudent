/**
 * Scrib Share Service — Earn While Learning
 *
 * Handles all API calls for the share-link feature:
 *   createShareLink    → POST /api/scrib/share/create/
 *   getShareMeta       → GET  /api/scrib/share/<code>/
 *   createPurchaseOrder → POST /api/scrib/share/<code>/purchase/
 *   verifySharePayment → POST /api/scrib/share/payment-verify/
 *   getShareStats      → GET  /api/scrib/share/stats/
 *   startSharePurchaseFlow → full Razorpay checkout for share purchases
 */
import axiosInstance from '../utils/axios'
import { loadRazorpayScript } from './paymentService'

/**
 * Create (or retrieve existing) share link for a pack or note.
 * Idempotent — safe to call multiple times.
 *
 * @param {{ packId?: number, noteId?: number }} options
 * @returns {Promise<{ share_code, share_url, is_new, is_creator, share_message }>}
 */
export async function createShareLink({ packId, noteId }) {
  const body = packId ? { pack_id: packId } : { note_id: noteId }
  const res = await axiosInstance.post('/scrib/share/create/', body)
  return res.data
}

/**
 * Fetch public metadata for a share link landing page.
 *
 * @param {string} shareCode - 8-char Base36 share code
 * @returns {Promise<{
 *   title, total_pages, price_per_page, total_price,
 *   reward_per_page, reward_type, topics_per_page,
 *   preview_token, already_purchased, is_own_link
 * }>}
 */
export async function getShareMeta(shareCode) {
  const res = await axiosInstance.get(`/scrib/share/${shareCode}/`)
  return res.data
}

/**
 * Get the preview PDF URL for a share landing page.
 * Returns a URL to GET /api/scrib/share/preview/<token>/ which redirects to S3.
 *
 * @param {string} previewToken
 * @returns {string} - The URL to use as the PDF source
 */
export function getPreviewUrl(previewToken) {
  const base = axiosInstance.defaults.baseURL || ''
  return `${base}/scrib/share/preview/${previewToken}/`
}

/**
 * Fetch presigned PDF URL for a buyer or owner after purchase.
 * Calls the authenticated /share/<code>/pdf/ endpoint.
 *
 * @param {string} shareCode
 * @returns {Promise<{ pdf_url, title, total_pages }>}
 */
export async function getSharePdf(shareCode) {
  const res = await axiosInstance.get(`/scrib/share/${shareCode}/pdf/`)
  return res.data
}

/**
 * Create a Razorpay order for purchasing via a share link.
 *
 * @param {string} shareCode
 * @returns {Promise<{ key_id, order_id, amount, currency, share_code, title, total_pages }>}
 */
export async function createSharePurchaseOrder(shareCode) {
  const res = await axiosInstance.post(`/scrib/share/${shareCode}/purchase/`)
  return res.data
}

/**
 * Verify Razorpay payment after share purchase checkout.
 *
 * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature, shareCode }} params
 * @returns {Promise<{ success, share_code, title, total_pages, reward_granted, reward_type }>}
 */
export async function verifySharePayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, shareCode }) {
  const res = await axiosInstance.post('/scrib/share/payment-verify/', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    share_code: shareCode,
  })
  return res.data
}

/**
 * Fetch the Earn While Learning stats for the current user's Creator Dashboard.
 *
 * @returns {Promise<{ notes_shared, successful_purchases, rewards_earned, reward_type }>}
 */
export async function getShareStats() {
  const res = await axiosInstance.get('/scrib/share/stats/')
  return res.data
}

/**
 * Full Razorpay purchase flow for share links.
 * Mirrors startPaymentFlow from paymentService.js but tailored for share purchases.
 *
 * @param {object} options
 * @param {string}   options.shareCode   - 8-char share code
 * @param {object}   options.meta        - result from getShareMeta()
 * @param {object}   options.user        - authenticated user
 * @param {function} options.onSuccess   - called with { result } on success
 * @param {function} options.onFailure   - called with error message string
 * @param {function} options.onDismiss   - called when user closes the modal
 */
export async function startSharePurchaseFlow({ shareCode, meta, user, onSuccess, onFailure, onDismiss, onAlreadyPurchased }) {
  // 1. Load Razorpay script
  try {
    await loadRazorpayScript()
  } catch {
    onFailure?.('Could not load payment gateway. Please check your internet connection.')
    return
  }

  // 2. Create order on backend
  let orderData
  try {
    orderData = await createSharePurchaseOrder(shareCode)
  } catch (err) {
    const code = err?.response?.data?.code
    // If already purchased, skip Razorpay and open the notes directly
    if (code === 'already_purchased') {
      onAlreadyPurchased?.(err?.response?.data)
      return
    }
    const msg = err?.response?.data?.message || 'Failed to initiate payment. Please try again.'
    onFailure?.(msg)
    return
  }

  // 3. Open Razorpay checkout
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: 'Scrib by EasyLearnova',
    description: `${orderData.title} — ${orderData.total_pages} Page${orderData.total_pages !== 1 ? 's' : ''}`,
    order_id: orderData.order_id,
    prefill: {
      name: user?.full_name || '',
      email: user?.email || '',
    },
    theme: { color: '#1f1f1f' },
    handler: async function (response) {
      // 4. Verify on backend — NEVER trust frontend success alone
      try {
        const result = await verifySharePayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          shareCode,
        })
        if (result.success) {
          onSuccess?.(result)
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

  const razorpay = new window.Razorpay(options)
  razorpay.on('payment.failed', function (response) {
    const msg = response?.error?.description || 'Payment failed. Please try again.'
    onFailure?.(msg)
  })
  razorpay.open()
}
