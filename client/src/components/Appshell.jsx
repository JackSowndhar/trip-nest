import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
  { icon: '🗺️', label: 'My Trips', path: '/trips' },
];

const TRIP_NAV = (tripId) => [
  { icon: '📋', label: 'Overview', path: `/trips/${tripId}` },
  { icon: '📅', label: 'Itinerary', path: `/trips/${tripId}/itinerary` },
  { icon: '💸', label: 'Budget', path: `/trips/${tripId}/budget` },
  { icon: '👥', label: 'Members', path: `/trips/${tripId}/members` },
  { icon: '💬', label: 'Chat', path: `/trips/${tripId}/chat`}
];

export default function AppShell({ children }) {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setUploading(true);
    reader.onerror = () => {
      setUploading(false);
      alert('Failed to read file');
    };
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const { data } = await axios.put('/api/users/avatar', { avatar: base64 });
        
        if (data.user) {
          updateUser(data.user);
        }
      } catch (err) {
        console.error('Error uploading avatar:', err);
        alert(err.response?.data?.message || 'Failed to upload avatar');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Close mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/trips' && !tripId) return location.pathname === '/trips';
    return location.pathname === path;
  };

  const sidebarContent = (forceExpanded = false) => {
    const isCollapsed = forceExpanded ? false : collapsed;
    return (
      <>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white text-lg">✈</span>
              </div>
              <span className="font-display font-bold text-xl text-gray-800">
                Trip<span className="text-primary-600">Nest</span>
              </span>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md mx-auto">
              <span className="text-white text-lg">✈</span>
            </div>
          )}
          {/* Desktop collapse button */}
          {!isCollapsed && !forceExpanded && (
            <button onClick={() => setCollapsed(true)} className="hidden lg:block p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Mobile close button */}
          {forceExpanded && (
            <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {isCollapsed && !forceExpanded && (
            <button onClick={() => setCollapsed(false)} className="w-full flex justify-center p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {NAV.map(({ icon, label, path }) => (
            <Link
              key={path}
              to={path}
              title={isCollapsed ? label : ''}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive(path)
                  ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className="text-base flex-shrink-0">{icon}</span>
              {!isCollapsed && label}
            </Link>
          ))}

          {/* Trip-level nav when inside a trip */}
          {tripId && !isCollapsed && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">This Trip</p>
              {TRIP_NAV(tripId).map(({ icon, label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive(path)
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          )}

          {tripId && isCollapsed && (
            <div className="mt-2 space-y-1">
              {TRIP_NAV(tripId).map(({ icon, label, path }) => (
                <Link key={path} to={path} title={label}
                  className={`flex justify-center p-2.5 rounded-xl transition-all ${isActive(path) ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <span className="text-base">{icon}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-3 mb-2 px-1">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 relative overflow-hidden group cursor-pointer"
                  title="Change avatar"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                  {!uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>

                {showConfirm && (
                  <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50">
                    <p className="text-sm font-medium text-gray-800 mb-0.5">Sign out?</p>
                    <p className="text-xs text-gray-400 mb-3">You'll be returned to the login screen.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogout}
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
            <div className="flex flex-col items-center gap-2">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-full flex items-center justify-center relative overflow-hidden group cursor-pointer"
                title="Change avatar"
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xs">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
                {!uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                title="Sign Out"
                className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors text-xs"
              >
                ↩
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Hidden file input for avatar upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 z-30 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white text-sm">✈</span>
          </div>
          <span className="font-display font-bold text-base text-gray-800">
            Trip<span className="text-primary-600">Nest</span>
          </span>
        </Link>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white flex flex-col shadow-2xl z-50 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex ${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-100 flex-col fixed h-full shadow-sm transition-all duration-300 z-20`}>
        {sidebarContent(false)}
      </aside>

      {/* Main */}
      <main className={`flex-1 pt-14 lg:pt-0 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 min-h-screen`}>
        {children}
      </main>
    </div>
  );
}