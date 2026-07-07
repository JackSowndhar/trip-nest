import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tripsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TripOverview() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    tripsAPI.getOne(tripId).then(setTrip).finally(() => setLoading(false));
  }, [tripId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tripsAPI.delete(tripId);
      navigate('/trips');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  if (!trip) return (
    <div className="p-8 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-gray-500">Trip not found</p>
      <Link to="/trips" className="mt-4 inline-block text-primary-600 text-sm font-medium">← Back to trips</Link>
    </div>
  );

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const today = new Date();
  const daysUntil = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  const daysAgo = Math.ceil((today - end) / (1000 * 60 * 60 * 24));
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const quickLinks = [
    { label: 'Itinerary', icon: '📅', desc: 'Day-by-day plan', to: `/trips/${tripId}/itinerary`, color: 'from-blue-400 to-indigo-500' },
    { label: 'Budget', icon: '💸', desc: `₹${(trip.totalSpent || 0).toLocaleString()} spent`, to: `/trips/${tripId}/budget`, color: 'from-amber-400 to-orange-500' },
    { label: 'Members', icon: '👥', desc: `${trip.memberCount || 0} people`, to: `/trips/${tripId}/members`, color: 'from-purple-400 to-pink-500' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link to="/trips" className="text-sm text-gray-400 hover:text-primary-600 transition-colors mb-4 inline-flex items-center gap-1">
        ← All Trips
      </Link>

      {/* Trip Hero */}
      <div className={`rounded-3xl bg-gradient-to-br ${trip.gradient || 'from-primary-500 to-emerald-500'} p-5 sm:p-8 mb-6 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <span className="text-4xl sm:text-5xl mb-3 block">{trip.emoji}</span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">{trip.name}</h1>
            <p className="text-white/80 text-base sm:text-lg">📍 {trip.destination}</p>
            {trip.description && <p className="text-white/70 text-sm mt-2 max-w-md">{trip.description}</p>}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
            <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
              trip.status === 'active' ? 'bg-white text-primary-600' : 'bg-white/20 text-white'
            }`}>
              {trip.status}
            </span>
            <p className="text-white/80 text-sm">
              {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
              {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-white font-semibold">{durationDays} days</p>
            {daysUntil > 0 && <p className="text-white/70 text-xs">in {daysUntil} days</p>}
            {daysAgo > 0 && <p className="text-white/70 text-xs">{daysAgo} days ago</p>}

            {/* Delete Button */}
            {trip.role === 'owner' && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                  bg-white/15 border border-white/30 text-white
                  hover:bg-red-300/15 hover:border-red-400/20 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete trip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {quickLinks.map(ql => (
          <Link key={ql.label} to={ql.to}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ql.color} flex items-center justify-center text-xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
              {ql.icon}
            </div>
            <p className="font-semibold text-gray-800 text-sm">{ql.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ql.desc}</p>
          </Link>
        ))}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">📆 Trip Dates</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Start</span>
              <span className="font-medium text-gray-700">{start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">End</span>
              <span className="font-medium text-gray-700">{end.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duration</span>
              <span className="font-semibold text-primary-600">{durationDays} days</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">💰 Spending Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Spent</span>
              <span className="font-bold text-gray-800">₹{(trip.totalSpent || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Members</span>
              <span className="font-medium text-gray-700">{trip.memberCount || 0} people</span>
            </div>
            {trip.memberCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Per Person</span>
                <span className="font-semibold text-primary-600">
                  ₹{Math.round((trip.totalSpent || 0) / trip.memberCount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-fade-in">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h2 className="text-base font-semibold text-gray-900 mb-1">Delete this trip?</h2>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              <span className="font-medium text-gray-700">{trip.name}</span> and all its data — itinerary, budget, and members — will be permanently removed.
            </p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
              ⚠️ This can't be undone.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}