import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { membersAPI, tripsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Members() {
  const { tripId } = useParams();
  const { user: currentUser } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  // Add Member form state
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState({ type: '', text: '' });

  // Dropdown / user list state
  const [allUsers, setAllUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchData = async () => {
    try {
      const [tripData, membersData] = await Promise.all([
        tripsAPI.getOne(tripId),
        membersAPI.getAll(tripId),
      ]);
      setTrip(tripData);
      setMembers(membersData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch crew details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await usersAPI.getAll();
      setAllUsers(usersData);
    } catch (err) {
      console.error('Failed to load users list', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [tripId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setAddMessage({ type: '', text: '' });

    if (!emailInput.trim()) return;

    setAdding(true);
    try {
      const newMember = await membersAPI.add(tripId, emailInput);
      setMembers((prev) => [...prev, newMember]);
      setEmailInput('');
      setShowDropdown(false);
      toast.success('Member added to your travel crew! 🎉');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to add member.';
      const toastMsg = msg.includes('not found')
        ? 'This email is not registered with TripNest. Ask your friend to register first!'
        : msg;
      setAddMessage({
        type: 'error',
        text: toastMsg,
      });
      toast.error(toastMsg);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    const confirmed = await toast.confirm('Remove this member from the trip?', 'Remove');
    if (!confirmed) return;

    try {
      await membersAPI.remove(tripId, userId);
      setMembers((prev) => prev.filter((m) => m.user?._id !== userId));
      toast.success('Member removed from crew.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove member.');
    }
  };

  const handleMakeOwner = async (userId, userName) => {
    const confirmed = await toast.confirm(
      `Make ${userName} an owner of this trip?`,
      'Make Owner 👑'
    );
    if (!confirmed) return;

    try {
      const currentOwners = (trip.owners || (trip.owner ? [trip.owner] : []))
        .map(id => id?._id?.toString() || id?.toString());
      const newOwners = [...new Set([...currentOwners, userId.toString()])];
      await tripsAPI.update(tripId, { owners: newOwners });
      toast.success(`${userName} is now an owner! 👑`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update ownership.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="p-4 sm:p-8 text-center max-w-md mx-auto min-h-[50vh] flex flex-col justify-center items-center">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="font-display font-bold text-xl text-gray-800 mb-2">Error</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Could not load crew list.'}</p>
        <Link to="/trips" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
          Back to My Trips
        </Link>
      </div>
    );
  }

  const ownerIds = (trip.owners || (trip.owner ? [trip.owner] : [])).map(id => id?._id?.toString() || id?.toString());
  const isOwner = ownerIds.includes(currentUser.id?.toString());

  // Users not already on this trip, available to pick from the dropdown
  const existingMemberIds = new Set(members.map((m) => m.user?._id?.toString()));
  const availableUsers = allUsers.filter((u) => !existingMemberIds.has(u._id?.toString()));

  const handleSelectUser = (u) => {
    setEmailInput(u.email);
    setShowDropdown(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <Link to={`/trips/${tripId}`} className="text-sm text-gray-400 hover:text-primary-600 transition-colors mb-4 inline-flex items-center gap-1">
        ← {trip?.name || 'Trip'}
      </Link>
      <div className="mb-6 sm:mb-8">
        <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Crew Manager</span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mt-1">
          {trip.emoji} {trip.name} Crew
        </h1>
        <p className="text-gray-500 text-sm mt-1">📍 {trip.destination} · Manage travel partners and splitting privileges.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Crew list */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="font-display font-bold text-base sm:text-lg text-gray-800">Travel Crew ({members.length})</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[430px] overflow-y-auto">
            {members.map((member) => {
              const u = member.user || {};
              const isPayerOwner = ownerIds.includes(u._id?.toString());
              return (
                <div key={member._id} className="p-4 sm:p-5 flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-white font-bold text-sm">{u.name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{u.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                     ${isPayerOwner ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                      {isPayerOwner ? 'Owner' : 'Editor'}
                    </span>

                    {isOwner && !isPayerOwner && (
                      <>
                        <button
                          onClick={() => handleMakeOwner(u._id, u.name)}
                          className="text-primary-500 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                          title="Make Owner"
                        >
                          👑 Make Owner
                        </button>
                        <button
                          onClick={() => handleRemoveMember(u._id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                          title="Remove Member"
                        >
                          🗑️ Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 self-start space-y-4">
          <h3 className="font-display font-bold text-base sm:text-lg text-gray-800">Add Crew Member</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Invite friends to join this trip. Once added, they will be able to view details, plan itineraries, and log expenses.
          </p>

          {isOwner ? (
            <form onSubmit={handleAddMemberSubmit} className="space-y-3">
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="friend@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDropdown((prev) => !prev)}
                    className="flex-shrink-0 w-10 h-[42px] flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    title="Select from crew"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {availableUsers.length > 0 ? (
                      availableUsers.map((u) => (
                        <button
                          type="button"
                          key={u._id}
                          onClick={() => handleSelectUser(u)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-primary-50 text-left transition-colors"
                        >
                          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">
                              {u.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{u.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-gray-400">No users available</p>
                    )}
                  </div>
                )}
              </div>

              {addMessage.text && (
                <p className={`text-xs ${addMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {addMessage.type === 'success' ? '✅' : '⚠️'} {addMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-emerald-500 text-white font-semibold text-sm rounded-xl
                  hover:from-primary-700 hover:to-emerald-600 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {adding ? 'Inviting...' : 'Invite Friend'}
              </button>
            </form>
          ) : (
            <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-500 leading-relaxed">
              🔒 Only the trip owner (<strong>{members.find((m) => m.user?._id === trip.owner)?.user?.name || 'Creator'}</strong>) can add or remove crew members.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}