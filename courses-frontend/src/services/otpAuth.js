import axios from '../utils/axios';

function unwrapError(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  
  // Extract message from various error formats
  let message = data?.error || data?.detail;
  
  // Handle field-specific validation errors (e.g., {"email": ["error message"]})
  if (!message && data && typeof data === 'object') {
    // Get the first field error
    const fieldErrors = Object.values(data).filter(v => v);
    if (fieldErrors.length > 0) {
      message = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
    }
  }
  
  // Fallback to generic error message
  if (!message) {
    message = err?.message || 'Request failed';
  }
  
  const code = status === 429 ? 'RATE_LIMITED' : status === 400 ? 'BAD_REQUEST' : 'REQUEST_FAILED';
  const e = new Error(message);
  e.status = status;
  e.code = code;
  e.data = data;
  e.response = err?.response; // Preserve original response for AuthForm field validation
  return e;
}

export async function otpSignup({ full_name, email, password, agreed_to_terms }) {
  // Use a generous, configurable hard timeout to tolerate slow SMTP in hosted environments
  const HARD_TIMEOUT_MS = parseInt(
    import.meta.env.VITE_OTP_SIGNUP_TIMEOUT_MS ||
    import.meta.env.VITE_API_TIMEOUT_MS ||
    '120000',
    10
  );

  const controller = new AbortController();
  const timeoutId = HARD_TIMEOUT_MS > 0 ? setTimeout(() => controller.abort(), HARD_TIMEOUT_MS) : null;

  try {
    const { data } = await axios.post('/auth/otp/signup/', {
      full_name,
      email,
      password,
      agreed_to_terms,
    }, {
      signal: controller.signal
    });
    if (timeoutId) clearTimeout(timeoutId);
    return data; // { message }
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    // Check if this was an abort/timeout
    if (err.name === 'AbortError' || err.name === 'CanceledError') {
      const timeoutError = new Error('Request timed out. The server is taking too long to respond.');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw unwrapError(err);
  }
}

export async function otpVerify({ email, code }) {
  try {
    const { data } = await axios.post('/auth/otp/verify/', { email, code });
    return data; // { user, refresh, access }
  } catch (err) {
    throw unwrapError(err);
  }
}

export async function otpResend({ email }) {
  try {
    const { data } = await axios.post('/auth/otp/resend/', { email });
    return data; // { message }
  } catch (err) {
    throw unwrapError(err);
  }
}
