import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, X, ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendOtp, resetPassword } from '../services/auth.service';

const USER_ROLE = Object.freeze({ ADMIN: 'ADMIN', USER: 'USER' });

const RESEND_COOLDOWN = 60;

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all bg-white placeholder-gray-400';

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({ children, disabled, type = 'button', onClick, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 bg-red-800 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

function PasswordInput({ placeholder, registration, showPassword, onToggle }) {
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder || '••••••••'}
        className={`${inputCls} pr-11`}
        {...registration}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ─── OTP boxes ─────────────────────────────────────────────────────────────────
function OtpBoxes({ values, refs, onChange, onKeyDown, onPaste }) {
  return (
    <div className="flex justify-center gap-2">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => onChange(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-red-800 focus:ring-0 outline-none transition-colors bg-white"
        />
      ))}
    </div>
  );
}

// ─── Resend button ──────────────────────────────────────────────────────────────
function ResendButton({ countdown, sending, onResend }) {
  const label =
    countdown > 0
      ? `Resend code in 0:${String(countdown).padStart(2, '0')}`
      : 'Resend code';
  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onResend}
        disabled={countdown > 0 || sending}
        className={`text-xs font-semibold transition-colors ${countdown > 0 || sending
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-red-800 hover:underline'
          }`}
      >
        {sending ? (
          <span className="flex items-center justify-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Sending…
          </span>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

// ─── LoginModal ─────────────────────────────────────────────────────────────────
export function LoginModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();

  // 'login' | 'register' | 'forgot'
  const [tab, setTab] = useState('login');
  // register: 1 = form, 2 = otp
  const [registerStep, setRegisterStep] = useState(1);
  // forgot: 1 = email, 2 = otp+new password, 3 = success
  const [forgotStep, setForgotStep] = useState(1);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const countdownRef = useRef(null);

  // Holds email when transitioning to OTP step so resend doesn't rely on unmounted form inputs
  const [otpEmail, setOtpEmail] = useState('');

  const loginForm = useForm();
  const registerForm = useForm();
  const forgotForm = useForm();

  const resetAll = useCallback(() => {
    setTab('login');
    setRegisterStep(1);
    setForgotStep(1);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setServerError('');
    setOtpSending(false);
    setOtpValues(['', '', '', '', '', '']);
    setResendCountdown(0);
    setOtpEmail('');
    loginForm.reset();
    registerForm.reset();
    forgotForm.reset();
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, [loginForm, registerForm, forgotForm]);

  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen, resetAll]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const switchTab = (t) => {
    setTab(t);
    setRegisterStep(1);
    setForgotStep(1);
    setServerError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setOtpValues(['', '', '', '', '', '']);
    setResendCountdown(0);
    setOtpEmail('');
    loginForm.reset();
    registerForm.reset();
    forgotForm.reset();
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setResendCountdown(RESEND_COOLDOWN);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── OTP helpers ──────────────────────────────────────────────────────────────
  const handleOtpChange = (i, e) => {
    const char = e.target.value.slice(-1);
    if (char && !/\d/.test(char)) return;
    const next = [...otpValues];
    next[i] = char;
    setOtpValues(next);
    if (char && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (otpValues[i] === '' && i > 0) {
        otpRefs.current[i - 1]?.focus();
      } else {
        const next = [...otpValues]; next[i] = ''; setOtpValues(next);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((c, idx) => { next[idx] = c; });
    setOtpValues(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const resetOtp = () => {
    setOtpValues(['', '', '', '', '', '']);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── Register flow ────────────────────────────────────────────────────────────
  const handleSendRegisterOtp = async (formData) => {
    setServerError('');
    setOtpSending(true);
    try {
      await sendOtp(formData.email);
      setOtpEmail(formData.email);
      startCountdown();
      setRegisterStep(2);
      resetOtp();
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    if (!otpEmail) return;
    setServerError('');
    setOtpSending(true);
    try {
      await sendOtp(otpEmail);
      startCountdown();
      resetOtp();
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to resend code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegisterSubmit = async (formData) => {
    const otp = otpValues.join('');
    if (otp.length < 6) { setServerError('Please enter all 6 digits.'); return; }
    setServerError('');
    try {
      await registerUser({ name: formData.name, email: formData.email, password: formData.password, phone: formData.phone, otp });
      onClose?.();
      onSuccess?.();
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  // ── Login flow ───────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (formData) => {
    setServerError('');
    try {
      const result = await login({ email: formData.email, password: formData.password });
      const role = result?.data?.user?.role ?? result?.user?.role;
      loginForm.reset();
      onClose?.();
      if (role === USER_ROLE.ADMIN) { navigate('/admin/dashboard'); return; }
      onSuccess?.();
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Incorrect email or password.');
    }
  };

  // ── Forgot password flow ─────────────────────────────────────────────────────
  const handleSendForgotOtp = async (formData) => {
    setServerError('');
    setOtpSending(true);
    try {
      await sendOtp(formData.email);
      setOtpEmail(formData.email);
      startCountdown();
      setForgotStep(2);
      resetOtp();
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (!otpEmail) return;
    setServerError('');
    setOtpSending(true);
    try {
      await sendOtp(otpEmail);
      startCountdown();
      resetOtp();
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to resend code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleResetPasswordSubmit = async (formData) => {
    const otp = otpValues.join('');
    if (otp.length < 6) { setServerError('Please enter all 6 digits.'); return; }
    setServerError('');
    try {
      await resetPassword({ email: otpEmail, otp, newPassword: formData.newPassword });
      setForgotStep(3);
      if (countdownRef.current) clearInterval(countdownRef.current);
    } catch (err) {
      setServerError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Heading ──────────────────────────────────────────────────────────────────
  const headingText = () => {
    if (tab === 'login') return 'Welcome back';
    if (tab === 'forgot') {
      if (forgotStep === 1) return 'Reset your password';
      if (forgotStep === 2) return 'Check your email';
      return 'Password reset';
    }
    return registerStep === 1 ? 'Create your account' : 'Check your email';
  };

  const subheadingText = () => {
    if (tab === 'register' && registerStep === 2) {
      return <>We sent a 6-digit code to <span className="font-semibold text-gray-700">{otpEmail}</span></>;
    }
    if (tab === 'forgot' && forgotStep === 2) {
      return <>We sent a reset code to <span className="font-semibold text-gray-700">{otpEmail}</span></>;
    }
    if (tab === 'forgot' && forgotStep === 3) {
      return 'Your password has been updated successfully.';
    }
    return null;
  };

  const showTabSwitcher = tab !== 'forgot' && !(tab === 'register' && registerStep === 2);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="px-8 py-8">
          {/* Logo + heading */}
          <div className="text-center mb-6">
            <img src="/logo.png" className="w-10 h-10 object-contain mx-auto mb-3" alt="Logo" />
            <h2 className="text-xl font-bold text-gray-900">{headingText()}</h2>
            {subheadingText() && (
              <p className="text-sm text-gray-500 mt-1">{subheadingText()}</p>
            )}
          </div>

          {/* Tab switcher */}
          {showTabSwitcher && (
            <div className="flex border-b border-gray-200 mb-6 gap-6">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={`pb-2 text-sm transition-all ${tab === t
                      ? 'border-b-2 border-red-800 text-red-800 font-bold'
                      : 'text-gray-400 hover:text-gray-700'
                    }`}
                >
                  {t === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* ── LOGIN ────────────────────────────────────────────────────────── */}
          {tab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
              <Field label="Email" error={loginForm.formState.errors.email?.message}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                  })}
                />
              </Field>

              <Field label="Password" error={loginForm.formState.errors.password?.message}>
                <PasswordInput
                  registration={loginForm.register('password', { required: 'Password is required' })}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </Field>

              {serverError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                  {serverError}
                </p>
              )}

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchTab('forgot')}
                  className="text-xs text-red-800 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <PrimaryButton type="submit" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Logging in…</>
                ) : 'Login'}
              </PrimaryButton>

              <p className="text-center text-xs text-gray-500">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchTab('register')} className="text-red-800 font-semibold hover:underline">
                  Register
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER step 1 ─────────────────────────────────────────────── */}
          {tab === 'register' && registerStep === 1 && (
            <form onSubmit={registerForm.handleSubmit(handleSendRegisterOtp)} className="space-y-4">
              <Field label="Full Name" error={registerForm.formState.errors.name?.message}>
                <input
                  type="text"
                  placeholder="Your full name"
                  className={inputCls}
                  {...registerForm.register('name', { required: 'Name is required' })}
                />
              </Field>

              <Field label="Email" error={registerForm.formState.errors.email?.message}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  {...registerForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                  })}
                />
              </Field>

              <Field label="Phone Number" error={registerForm.formState.errors.phone?.message}>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className={inputCls}
                  {...registerForm.register('phone', { required: 'Phone number is required' })}
                />
              </Field>

              <Field label="Password" error={registerForm.formState.errors.password?.message}>
                <PasswordInput
                  registration={registerForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                  })}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </Field>

              <Field label="Confirm Password" error={registerForm.formState.errors.confirmPassword?.message}>
                <PasswordInput
                  placeholder="••••••••"
                  registration={registerForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === registerForm.getValues('password') || 'Passwords do not match',
                  })}
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((v) => !v)}
                />
              </Field>

              {serverError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                  {serverError}
                </p>
              )}

              <PrimaryButton type="submit" disabled={otpSending} className="mt-2">
                {otpSending ? (
                  <><Loader2 size={15} className="animate-spin" /> Sending code…</>
                ) : (
                  <><Mail size={15} /> Send Verification Code</>
                )}
              </PrimaryButton>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('login')} className="text-red-800 font-semibold hover:underline">
                  Login
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER step 2 (OTP) ───────────────────────────────────────── */}
          {tab === 'register' && registerStep === 2 && (
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-5">
              <OtpBoxes
                values={otpValues}
                refs={otpRefs}
                onChange={handleOtpChange}
                onKeyDown={handleOtpKeyDown}
                onPaste={handleOtpPaste}
              />

              <p className="text-center text-xs text-gray-400">
                Didn&apos;t receive the email? Check your <span className="font-semibold text-gray-500">Inbox</span> and <span className="font-semibold text-gray-500">Spam</span> folder.
              </p>

              {serverError && (
                <p className="text-xs text-red-600 flex items-center justify-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                  {serverError}
                </p>
              )}

              <PrimaryButton type="submit" disabled={registerForm.formState.isSubmitting || otpValues.join('').length < 6}>
                {registerForm.formState.isSubmitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                ) : 'Verify & Create Account'}
              </PrimaryButton>

              <ResendButton countdown={resendCountdown} sending={otpSending} onResend={handleResendRegisterOtp} />

              <button
                type="button"
                onClick={() => { setRegisterStep(1); setServerError(''); setOtpValues(['', '', '', '', '', '']); if (countdownRef.current) clearInterval(countdownRef.current); setResendCountdown(0); }}
                className="flex items-center justify-center gap-1 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={13} /> Back
              </button>
            </form>
          )}

          {/* ── FORGOT step 1 (enter email) ──────────────────────────────────── */}
          {tab === 'forgot' && forgotStep === 1 && (
            <form onSubmit={forgotForm.handleSubmit(handleSendForgotOtp)} className="space-y-4">
              <p className="text-sm text-gray-500 -mt-2 mb-2">
                Enter your email and we&apos;ll send you a verification code to reset your password.
              </p>

              <Field label="Email" error={forgotForm.formState.errors.email?.message}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  {...forgotForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                  })}
                />
              </Field>

              {serverError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                  {serverError}
                </p>
              )}

              <PrimaryButton type="submit" disabled={otpSending}>
                {otpSending ? (
                  <><Loader2 size={15} className="animate-spin" /> Sending code…</>
                ) : (
                  <><Mail size={15} /> Send Reset Code</>
                )}
              </PrimaryButton>

              <button
                type="button"
                onClick={() => switchTab('login')}
                className="flex items-center justify-center gap-1 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={13} /> Back to login
              </button>
            </form>
          )}

          {/* ── FORGOT step 2 (OTP + new password) ──────────────────────────── */}
          {tab === 'forgot' && forgotStep === 2 && (
            <form onSubmit={forgotForm.handleSubmit(handleResetPasswordSubmit)} className="space-y-5">
              <OtpBoxes
                values={otpValues}
                refs={otpRefs}
                onChange={handleOtpChange}
                onKeyDown={handleOtpKeyDown}
                onPaste={handleOtpPaste}
              />

              <p className="text-center text-xs text-gray-400">
                Didn&apos;t receive the email? Check your <span className="font-semibold text-gray-500">Inbox</span> and <span className="font-semibold text-gray-500">Spam</span> folder.
              </p>

              <Field label="New Password" error={forgotForm.formState.errors.newPassword?.message}>
                <PasswordInput
                  placeholder="Min. 8 characters"
                  registration={forgotForm.register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                  })}
                  showPassword={showNewPassword}
                  onToggle={() => setShowNewPassword((v) => !v)}
                />
              </Field>

              <Field label="Confirm New Password" error={forgotForm.formState.errors.confirmNewPassword?.message}>
                <PasswordInput
                  placeholder="••••••••"
                  registration={forgotForm.register('confirmNewPassword', {
                    required: 'Please confirm your new password',
                    validate: (val) => val === forgotForm.getValues('newPassword') || 'Passwords do not match',
                  })}
                  showPassword={showConfirmNewPassword}
                  onToggle={() => setShowConfirmNewPassword((v) => !v)}
                />
              </Field>

              {serverError && (
                <p className="text-xs text-red-600 flex items-center justify-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                  {serverError}
                </p>
              )}

              <PrimaryButton
                type="submit"
                disabled={forgotForm.formState.isSubmitting || otpValues.join('').length < 6}
              >
                {forgotForm.formState.isSubmitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Resetting…</>
                ) : 'Reset Password'}
              </PrimaryButton>

              <ResendButton countdown={resendCountdown} sending={otpSending} onResend={handleResendForgotOtp} />

              <button
                type="button"
                onClick={() => { setForgotStep(1); setServerError(''); setOtpValues(['', '', '', '', '', '']); if (countdownRef.current) clearInterval(countdownRef.current); setResendCountdown(0); }}
                className="flex items-center justify-center gap-1 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={13} /> Back
              </button>
            </form>
          )}

          {/* ── FORGOT step 3 (success) ──────────────────────────────────────── */}
          {tab === 'forgot' && forgotStep === 3 && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Your password has been reset. You can now log in with your new password.
              </p>
              <PrimaryButton onClick={() => switchTab('login')}>
                Back to Login
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default LoginModal;
