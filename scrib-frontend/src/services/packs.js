import axiosInstance from '../utils/axios'

/**
 * Content packs — the paid Interview Prep bundles (full PDF + 10 quizzes each).
 *
 * Every price shown in the UI comes from these responses. The server re-reads
 * the price from its own row when creating and verifying an order, so nothing
 * here is trusted as an amount.
 */

export const fetchCatalogue = async (section = 'interview') => {
  const { data } = await axiosInstance.get('/scrib/packs/catalogue/', { params: { section } })
  return data
}

export const fetchPack = async (slug) => {
  const { data } = await axiosInstance.get(`/scrib/packs/${slug}/`)
  return data
}

export const fetchPackPdf = async (slug) => {
  const { data } = await axiosInstance.get(`/scrib/packs/${slug}/pdf/`)
  return data
}

export const fetchQuiz = async (quizId) => {
  const { data } = await axiosInstance.get(`/scrib/packs/quizzes/${quizId}/`)
  return data
}

export const submitQuiz = async (quizId, answers) => {
  const { data } = await axiosInstance.post(`/scrib/packs/quizzes/${quizId}/submit/`, { answers })
  return data
}

export const createPurchaseOrder = async ({ pack, bundle }) => {
  const { data } = await axiosInstance.post('/scrib/packs/purchase/', pack ? { pack } : { bundle })
  return data
}

export const verifyPurchase = async (payload) => {
  const { data } = await axiosInstance.post('/scrib/packs/purchase/verify/', payload)
  return data
}

/** Load the Razorpay checkout script once, reusing it on later purchases. */
let razorpayPromise = null
export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true)
  if (razorpayPromise) return razorpayPromise

  razorpayPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => {
      razorpayPromise = null
      resolve(false)
    }
    document.body.appendChild(script)
  })
  return razorpayPromise
}

/**
 * Run the full Razorpay checkout for a pack or the bundle.
 *
 * Resolves with the verification response on success, or null when the user
 * closes the checkout. Throws if the order or verification itself fails.
 */
export const purchasePack = async ({ pack, bundle, user }) => {
  const ready = await loadRazorpay()
  if (!ready) throw new Error('Could not reach the payment gateway. Check your connection and retry.')

  const order = await createPurchaseOrder({ pack, bundle })

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'Scrib by EasyLearnova',
      description: order.item,
      order_id: order.order_id,
      prefill: {
        name: user?.full_name || '',
        email: user?.email || '',
      },
      theme: { color: '#1f3a5f' },
      modal: {
        ondismiss: () => resolve(null),
      },
      handler: async (response) => {
        try {
          const result = await verifyPurchase({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            pack,
            bundle,
          })
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
    })

    checkout.on('payment.failed', (event) => {
      reject(new Error(event?.error?.description || 'The payment could not be completed.'))
    })

    checkout.open()
  })
}
