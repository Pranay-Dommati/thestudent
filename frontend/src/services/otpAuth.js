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
  try {
    const { data } = await axios.post('/auth/otp/signup/', {
      full_name,
      email,
      password,
      agreed_to_terms,
    });
    return data; // { message }
  } catch (err) {
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
