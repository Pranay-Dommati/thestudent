import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { otpVerify, otpResend } from '../../services/otpAuth';
import universalToast from '../../utils/universalToast';

export default function OtpModal({ open, email, fullName, onClose, onVerified }) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!open) {
      setCode('');
      setIsSubmitting(false);
      setResendCooldown(0);
    }
  }, [open]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
  universalToast.error('Enter the 6-digit code');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await otpVerify({ email, code: code.trim() });
      // tokens and user
      const { access, refresh, user } = data;
      if (!access || !refresh) throw new Error('Missing tokens');
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
  universalToast.success('Email verified!');
      onVerified?.(user);
      onClose?.();
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error || err?.response?.data?.detail;
      const msg = serverMsg || (status === 400 ? 'Invalid or expired code' : 'Verification failed');
  universalToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await otpResend({ email });
  universalToast.success('Code resent');
      setResendCooldown(60);
    } catch (err) {
      const status = err?.response?.status;
      let msg = err?.response?.data?.error || 'Unable to resend now';
      if (status === 429) {
        // Server enforces 1/minute and max per window
        msg = err?.response?.data?.error || 'Too many attempts. Please wait a minute.';
      }
  universalToast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
          >
            <h3 className="text-xl font-semibold text-gray-800">Verify your email</h3>
            <p className="mt-1 text-sm text-gray-600">We sent a 6-digit code to <span className="font-medium">{email}</span>.</p>

            <form className="mt-4" onSubmit={handleVerify}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none"
                placeholder="••••••"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying…' : 'Verify'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending || isSubmitting}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button onClick={onClose} className="hover:text-gray-800">Change email</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
