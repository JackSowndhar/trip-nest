import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const validate = {
  name: (v) => {
    if (!v.trim()) return 'Full name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email';
    return '';
  },
  password: (v) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Include at least one number';
    return '';
  },
  confirmPassword: (v, pw) => {
    if (!v) return 'Please confirm your password';
    if (v !== pw) return 'Passwords do not match';
    return '';
  },
};

const InputField = ({ label, type = 'text', value, onChange, onBlur, error, touched, placeholder, icon }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-body transition-all duration-200
          ${touched && error
            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
            : touched && !error
              ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-200'
              : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-200 focus:border-primary-500'
          }`}
      />
      {touched && !error && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
      )}
    </div>
    {touched && error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

export default function AuthDropdown({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const dropdownRef = useRef(null);
  const { login, register, loading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Reset on mode switch
  useEffect(() => {
    setFields({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setTouched({});
    setSubmitError('');
    clearError();
  }, [mode, clearError]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setFields((prev) => ({ ...prev, [field]: val }));
    if (touched[field]) {
      const err = field === 'confirmPassword'
        ? validate.confirmPassword(val, fields.password)
        : validate[field]?.(val) ?? '';
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = field === 'confirmPassword'
      ? validate.confirmPassword(fields.confirmPassword, fields.password)
      : validate[field]?.(fields[field]) ?? '';
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAll = () => {
    const newErrors = {};
    if (mode === 'register') newErrors.name = validate.name(fields.name);
    newErrors.email = validate.email(fields.email);
    newErrors.password = validate.password(fields.password);
    if (mode === 'register') newErrors.confirmPassword = validate.confirmPassword(fields.confirmPassword, fields.password);
    setErrors(newErrors);
    const allFields = mode === 'register'
      ? { name: true, email: true, password: true, confirmPassword: true }
      : { email: true, password: true };
    setTouched(allFields);
    return Object.values(newErrors).every((e) => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateAll()) return;

    let result;
    if (mode === 'login') {
      result = await login(fields.email, fields.password);
    } else {
      result = await register(fields.name, fields.email, fields.password);
    }

    if (result.success) {
      onClose();
      navigate('/dashboard');
    } else {
      setSubmitError(result.error);
    }
  };

  if (!isOpen) return null;

return (
  <div
    ref={dropdownRef}
    className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-[calc(100%+12px)] mx-auto sm:mx-0 w-auto sm:w-[360px] max-w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-slide-down overflow-hidden"
    style={{ animationFillMode: 'both' }}
  >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-400" />

      <div className="p-6">
        {/* Mode Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize
                ${mode === m
                  ? 'bg-white text-primary-600 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <h2 className="font-display text-xl font-bold text-gray-800 mb-1">
          {mode === 'login' ? 'Welcome back! 👋' : 'Create your account ✈️'}
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          {mode === 'login'
            ? 'Sign in to access your trip plans'
            : 'Start organizing your adventures today'}
        </p>

        {/* Error Banner */}
        {(submitError || authError) && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            <span>{submitError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <InputField
              label="Full Name"
              value={fields.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              error={errors.name}
              touched={touched.name}
              placeholder="Jane Smith"
              icon="👤"
            />
          )}

          <InputField
            label="Email Address"
            type="email"
            value={fields.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            placeholder="you@example.com"
            icon="✉️"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={fields.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all duration-200
                  ${touched.password && errors.password
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                    : touched.password && !errors.password
                      ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-200'
                      : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-200 focus:border-primary-500'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.password}
              </p>
            )}

            {/* Password strength indicator (register only) */}
            {mode === 'register' && fields.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => {
                    const strength = [
                      fields.password.length >= 8,
                      /[A-Z]/.test(fields.password),
                      /[0-9]/.test(fields.password),
                      /[^A-Za-z0-9]/.test(fields.password),
                    ];
                    const filled = strength.filter(Boolean).length;
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= filled
                            ? filled <= 2 ? 'bg-red-400' : filled === 3 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {(() => {
                    const s = [
                      fields.password.length >= 8,
                      /[A-Z]/.test(fields.password),
                      /[0-9]/.test(fields.password),
                      /[^A-Za-z0-9]/.test(fields.password),
                    ].filter(Boolean).length;
                    return ['', 'Weak', 'Fair', 'Good', 'Strong'][s];
                  })()}
                </p>
              </div>
            )}
          </div>

          {mode === 'register' && (
            <InputField
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={fields.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              placeholder="Re-enter your password"
              icon="🔐"
            />
          )}

          {mode === 'login' && (
            <div className="flex justify-end mb-4">
              <button type="button" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-emerald-500 text-white font-semibold text-sm rounded-xl
              hover:from-primary-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-primary-500/25
              disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {mode === 'login' ? '🚀 Sign In' : '✈️ Start Your Journey'}
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-primary-600 font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
