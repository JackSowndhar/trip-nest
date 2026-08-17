import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { tripsAPI, invitationsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInvDropdown, setShowInvDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invDropdownRef = useRef(null);
  const toast = useToast();

  const fetchTrips = async () => {
    try {
      const data = await tripsAPI.getAll();
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    }
  };

  const fetchInvitations = async () => {
    try {
      const data = await invitationsAPI.getAll();
      setInvitations(data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTrips(), fetchInvitations()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (invDropdownRef.current && !invDropdownRef.current.contains(e.target)) {
        setShowInvDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAcceptInvite = async (inviteId) => {
    try {
      const res = await invitationsAPI.accept(inviteId);
      toast.success(res.message || 'Invitation accepted! 🎉');
      await Promise.all([fetchInvitations(), fetchTrips()]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to accept invitation.');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      const res = await invitationsAPI.reject(inviteId);
      toast.info(res.message || 'Invitation declined.');
      await fetchInvitations();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to decline invitation.');
    }
  };

  // Calculate dynamic stats
  const totalTrips = trips.length;
  const activeTripsCount = trips.filter(t => t.progress > 0 && t.progress < 100).length;
  const planningTripsCount = trips.filter(t => t.progress === 0).length;
  
  const uniqueDestinations = new Set(trips.map(t => t.destination.toLowerCase().trim())).size;
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  
  const totalTravelDays = trips.reduce((sum, t) => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return sum + (isNaN(diff) || diff < 0 ? 0 : diff);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            You have {activeTripsCount} active {activeTripsCount === 1 ? 'trip' : 'trips'} and {planningTripsCount} in planning
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Invitation Button and Dropdown */}
          <div className="relative" ref={invDropdownRef}>
            <button
              onClick={() => setShowInvDropdown((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm hover:shadow transition-all relative"
            >
              <span>✉️</span> Invitations
              {invitations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse">
                  {invitations.length}
                </span>
              )}
            </button>

            {showInvDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-3 animate-slide-down overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-gray-800">Trip Invitations</h3>
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                    {invitations.length} pending
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {invitations.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400">
                      <p className="text-sm">No pending invitations 🏖️</p>
                    </div>
                  ) : (
                    invitations.map((invite) => (
                      <div key={invite._id} className="p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${invite.trip?.gradient || 'from-primary-400 to-emerald-500'} rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                            {invite.trip?.emoji || '✈️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-xs truncate">
                              {invite.trip?.name || 'Unnamed Trip'}
                            </h4>
                            <p className="text-[11px] text-gray-500 truncate">
                              📍 {invite.trip?.destination || 'No Destination'}
                            </p>
                            <div className="mt-1.5 space-y-0.5 text-[10px] text-gray-400">
                              <p>
                                Invited by: <span className="font-medium text-gray-700">{invite.inviter?.name}</span> ({invite.inviter?.email})
                              </p>
                              <p>
                                Crew size: <span className="font-medium text-gray-700">{invite.memberCount} {invite.memberCount === 1 ? 'member' : 'members'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAcceptInvite(invite._id)}
                            className="flex-1 py-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white text-xs font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-600 shadow-md shadow-primary-500/10 hover:shadow-lg transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectInvite(invite._id)}
                            className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl border border-gray-150 transition-all"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/trips?create=true"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <span>+</span> New Trip
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Trips', value: totalTrips, icon: '🗺️', color: 'from-primary-500 to-emerald-500' },
          { label: 'Destinations', value: uniqueDestinations, icon: '🌍', color: 'from-blue-500 to-indigo-500' },
          { label: 'Total Budget', value: `₹${totalBudget.toLocaleString()}`, icon: '💰', color: 'from-amber-500 to-orange-500' },
          { label: 'Travel Days', value: totalTravelDays, icon: '📅', color: 'from-purple-500 to-pink-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl mb-3 shadow-md`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800 font-display">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between ">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-800">My Trips</h2>
              <Link to="/trips" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All →</Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
              {trips.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-base mb-2">No trips planned yet 🏜️</p>
                  <p className="text-xs">Plan your next destination to get started!</p>
                </div>
              ) : (
                trips.slice(0, 5).map((trip) => (
                  <div
                    key={trip._id}
                    onClick={() => navigate(`/trips/${trip._id}`)}
                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors "
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${trip.gradient || 'from-primary-400 to-emerald-500'} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md`}>
                      {trip.emoji || '✈️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-800 text-sm truncate">{trip.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          trip.progress > 0 && trip.progress < 100
                            ? 'bg-blue-50 text-blue-600'
                            : trip.progress === 100
                              ? 'bg-primary-50 text-primary-600'
                              : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {trip.progress > 0 && trip.progress < 100
                            ? 'Active'
                            : trip.progress === 100
                              ? 'Completed'
                              : 'Planning'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {trip.destination} · {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${trip.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{trip.progress}%</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-800 text-sm">₹{trip.budget?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{trip.memberCount || 1} {trip.memberCount === 1 ? 'member' : 'members'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <Link
              to="/trips?create=true"
              className="block w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all font-medium"
            >
              + Plan a New Trip
            </Link>
          </div>
        </div>

        {/* Quick Tips / Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display font-bold text-lg text-gray-800 mb-4">Quick Start Guide 💡</h2>
            <div className="space-y-4">
              {[
                { icon: '✏️', title: 'Plan trips together', desc: 'Create a trip and add your friends by email to collaborate on details.' },
                { icon: '📅', title: 'Schedule itineraries', desc: 'Add day-by-day sightseeing, flights, and meals so everyone stays synced.' },
                { icon: '💰', title: 'Track and split spending', desc: 'Enter expenses in real-time. We automatically calculate who owes what.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700">{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20">
            <span className="text-3xl">✈️</span>
            <h3 className="font-display font-bold text-lg mt-3">Where to next?</h3>
            <p className="text-xs text-primary-100 mt-1 mb-4">Keep tracking all your travel memories in one secure notebook.</p>
            <Link
              to="/trips?create=true"
              className="inline-block bg-white text-primary-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-50 transition-colors"
            >
              Start Planning →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
