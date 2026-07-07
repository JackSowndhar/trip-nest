import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthDropdown from './AuthDropdown';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
  if (!showLogoutConfirm) return;
  const handler = (e) => {
    if (!e.target.closest('#logout-confirm-area')) setShowLogoutConfirm(false);
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, [showLogoutConfirm]);


  const navLinks = ['Features', 'Community', 'how-it-works'];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-md shadow-gray-100' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:scale-105 transition-transform">
            <span className="text-white text-lg">✈</span>
          </div>
          <span className="font-display font-bold text-xl text-gray-800">
            Trip<span className="text-primary-600">Nest</span>
          </span>
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200 relative group"
            >
              {link}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300 rounded-full" />
            </a>
          ))}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-2 sm:gap-3">
  {user ? (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        to="/dashboard"
        className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
      >
        Dashboard
      </Link>
      <div className="flex items-center gap-1.5 sm:gap-2 bg-primary-50 rounded-full pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5">
  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-white text-[10px] sm:text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
  </div><div className="flex items-center gap-1.5 sm:gap-2 bg-primary-50 rounded-full px-3 py-1.5">
  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[160px]">
    {user.name}
  </span>
</div>
</div>
      <div className="relative" id="logout-confirm-area">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-xs sm:text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
        >
          Logout
        </button>

  {showLogoutConfirm && (
    <div className="absolute top-full mt-2 right-0 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50">
      <p className="text-sm font-medium text-gray-800 mb-0.5">Sign out?</p>
      <p className="text-xs text-gray-400 mb-3">You'll be returned to the login screen.</p>
      <div className="flex gap-2">
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="flex-1 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { setShowLogoutConfirm(false); logout(); }}
          className="flex-1 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )}
</div>
            </div>
          ) : (
            <div className="relative">
              <button
                data-register-btn
                onClick={() => setAuthOpen(!authOpen)}
                className={`px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2
                  ${authOpen
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gradient-to-r from-primary-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5'
                  }`}
              >
                Login
                <svg className={`w-4 h-4 transition-transform duration-200 ${authOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AuthDropdown isOpen={authOpen} onClose={() => setAuthOpen(false)} />
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenu
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3 animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 py-1.5 transition-colors"
              onClick={() => setMobileMenu(false)}
            >
              {link}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
