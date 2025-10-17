import axios from '../utils/axios';

function unwrapError(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const message = data?.error || data?.detail || err?.message || 'Request failed';
  const code = status === 429 ? 'RATE_LIMITED' : status === 400 ? 'BAD_REQUEST' : 'REQUEST_FAILED';
  const e = new Error(message);
  e.status = status;
  e.code = code;
  e.data = data;
  return e;
}

export async function otpSignup({ full_name, email, password, agreed_to_terms }) {
  // Create abort controller for hard timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Hard 10 second timeout
  
  try {
    const { data } = await axios.post('/auth/otp/signup/', {
      full_name,
      email,
      password,
      agreed_to_terms,
    }, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return data; // { message }
  } catch (err) {
    clearTimeout(timeoutId);
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
