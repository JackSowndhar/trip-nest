import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tripsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const EMOJIS = ['✈️', '🌴', '🏔️', '🏖️', '🗼', '🏯', '🗽', '🏜️', '🌉', '🏙️', '🏕️', '🏟️', '🎡'];
const GRADIENTS = [
  { label: 'Sunset Red', value: 'from-red-400 to-orange-500' },
  { label: 'Emerald Green', value: 'from-teal-400 to-emerald-500' },
  { label: 'Ocean Blue', value: 'from-blue-400 to-indigo-500' },
  { label: 'Orchid Purple', value: 'from-purple-400 to-pink-500' },
  { label: 'Golden Amber', value: 'from-amber-400 to-orange-500' },
];

// Derive status string from progress number
function getStatus(progress) {
  if (progress === 100) return 'completed';
  if (progress > 0) return 'active';
  return 'planning';
}

// Map status → progress value to send to API
function statusToProgress(status) {
  if (status === 'completed') return 100;
  if (status === 'active') return 50;
  return 0;
}

const STATUS_META = {
  planning: {
    label: 'Planning',
    pillClass: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    headerClass: 'bg-yellow-50 border-yellow-100',
    titleClass: 'text-yellow-700',
    dot: 'bg-yellow-400',
    icon: '🗓️',
  },
  active: {
    label: 'Active',
     pillClass: 'bg-blue-50 text-blue-700 border border-blue-100',
    headerClass: 'bg-blue-50 border-blue-100',
    titleClass: 'text-blue-700',
    dot: 'bg-blue-400',
    icon: '✈️',
  },
  completed: {
    label: 'Completed',
     pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    headerClass: 'bg-emerald-50 border-emerald-100',
    titleClass: 'text-emerald-700',
    dot: 'bg-emerald-400',
    icon: '✅',
  },
};

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ status, trips, onDrop, onCardClick, draggingId }) {
  const meta = STATUS_META[status];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const tripId = e.dataTransfer.getData('tripId');
    if (tripId) onDrop(tripId, status);
  };

  return (
    <div className="flex flex-col min-w-[240px] sm:min-w-[280px] flex-1">
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border mb-3 ${meta.headerClass}`}>
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <span className={`text-xs sm:text-sm font-semibold ${meta.titleClass}`}>{meta.label}</span>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-white rounded-full px-2 py-0.5 border border-gray-100">
          {trips.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-3 flex-1 min-h-[200px] rounded-2xl p-2 transition-all duration-150
          ${isDragOver
            ? 'bg-primary-50/60 border-2 border-dashed border-primary-300'
            : 'border-2 border-dashed border-transparent'
          }`}
      >
        {trips.length === 0 && !isDragOver && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300 gap-1 select-none">
            <span className="text-2xl">📭</span>
            <span className="text-xs">Drop trips here</span>
          </div>
        )}

        {trips.map((trip) => (
          <KanbanCard
            key={trip._id}
            trip={trip}
            onClick={() => onCardClick(trip._id)}
            isDragging={draggingId === trip._id}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({ trip, onClick, isDragging }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('tripId', trip._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 select-none
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
    >
      {/* Color banner */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${trip.gradient || 'from-primary-500 to-emerald-500'}`} />

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${trip.gradient || 'from-primary-500 to-emerald-500'} flex items-center justify-center text-base sm:text-lg flex-shrink-0`}>
            {trip.emoji || '✈️'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">{trip.name}</p>
            <p className="text-xs text-gray-400 truncate">📍 {trip.destination}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
          <span>📅 {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span>₹{trip.budget?.toLocaleString()}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1 rounded-full transition-all"
            style={{ width: `${trip.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ progress }) {
  const status = getStatus(progress);
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${meta.pillClass}`}>
      <span>{meta.icon}</span> {meta.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyTrips() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trips, setTrips] = useState([]);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    emoji: '✈️',
    gradient: 'from-teal-400 to-emerald-500',
  });
  const [modalError, setModalError] = useState('');
  const [creating, setCreating] = useState(false);

  // View: 'all' | 'kanban'
  const [view, setView] = useState('all');

  // Filter for All Trips tab
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dragging state for kanban
  const [draggingId, setDraggingId] = useState(null);

  const fetchTrips = async () => {
    try {
      const data = await tripsAPI.getAll();
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setIsModalOpen(true);
      navigate('/trips', { replace: true });
    }
  }, [location.search, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setModalError('');
    const { name, destination, startDate, endDate, budget } = formData;
    if (!name || !destination || !startDate || !endDate) {
      setModalError('Please fill in all required fields.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setModalError('Start date cannot be after the end date.');
      return;
    }
    setCreating(true);
    try {
      await tripsAPI.create({ ...formData, budget: Number(budget) || 0 });
      setIsModalOpen(false);
      setFormData({ name: '', destination: '', startDate: '', endDate: '', budget: '', emoji: '✈️', gradient: 'from-teal-400 to-emerald-500' });
      toast.success(`Trip "${name}" created successfully! 🗺️`);
      fetchTrips();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to create trip. Please try again.';
      setModalError(errMsg);
      toast.error(errMsg);
    } finally {
      setCreating(false);
    }
  };

  // ── Kanban drop handler ──
  const handleKanbanDrop = async (tripId, newStatus) => {
    const trip = trips.find((t) => t._id === tripId);
    if (!trip || getStatus(trip.progress) === newStatus) return;

    const newProgress = statusToProgress(newStatus);

    // Optimistic update
    setTrips((prev) =>
      prev.map((t) => (t._id === tripId ? { ...t, progress: newProgress } : t))
    );

    try {
      await tripsAPI.update(tripId, { progress: newProgress });
      toast.success(`Trip "${trip.name}" moved to ${newStatus}!`);
    } catch (err) {
      console.error(err);
      // Revert on failure
      setTrips((prev) =>
        prev.map((t) => (t._id === tripId ? { ...t, progress: trip.progress } : t))
      );
      toast.error('Only owner can move this trip to new status');
    }

    setDraggingId(null);
  };

  // ── Filtered trips for All view ──
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return getStatus(trip.progress) === statusFilter;
  });

  // ── Grouped trips for Kanban ──
  const kanbanGroups = {
    planning: trips.filter((t) => getStatus(t.progress) === 'planning'),
    active: trips.filter((t) => getStatus(t.progress) === 'active'),
    completed: trips.filter((t) => getStatus(t.progress) === 'completed'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage and plan all your travel adventures.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
        >
          <span>+</span> Plan a New Trip
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      {/* ── View Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit mb-6 overflow-x-auto">
        {[
          { value: 'all', label: '☰  All Trips' },
          { value: 'kanban', label: '⊞  Kanban' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setView(tab.value)}
            className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none
              ${view === tab.value
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          ALL TRIPS VIEW
      ════════════════════════════════════════════ */}
      {view === 'all' && (
        <>
          {/* Search + Status filter chips */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search trips or destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm transition-all"
              />
            </div>

            {/* Status filter chips */}
            <div className="flex gap-2 flex-wrap overflow-x-auto">
              {[
                { value: 'all', label: 'All' },
                { value: 'planning', label: '🗓️ Planning' },
                { value: 'active', label: '✈️ Active' },
                { value: 'completed', label: '✅ Completed' },
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setStatusFilter(chip.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap
                    ${statusFilter === chip.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trips Grid */}
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white border border-gray-100 rounded-3xl shadow-sm px-4">
              <p className="text-4xl mb-3">🧭</p>
              <h3 className="font-display font-bold text-lg text-gray-800 mb-1">No trips found</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Try adjusting your filters, or start planning a brand new adventure today.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTrips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => navigate(`/trips/${trip._id}`)}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header Banner */}
                    <div className={`h-20 sm:h-24 bg-gradient-to-br ${trip.gradient || 'from-primary-500 to-emerald-500'} p-4 relative flex items-end`}>
                      {/* Status pill on card */}
                      <div className="absolute top-4 right-4">
                        <StatusPill progress={trip.progress} />
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-xl sm:text-2xl translate-y-5 sm:translate-y-6">
                        {trip.emoji || '✈️'}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 pt-6 sm:pt-8">
                      <h3 className="font-display font-bold text-lg sm:text-xl text-gray-800 line-clamp-1">{trip.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <span>📍</span> {trip.destination}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 font-medium">
                        📅 {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>

                      <div className="mt-5">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-medium text-gray-400">
                          <span>Trip Progress</span>
                          <span>{trip.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${trip.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div><span className="text-gray-400">Budget:</span> <strong className="text-gray-700">₹{trip.budget?.toLocaleString()}</strong></div>
                    <div><span className="text-gray-400">Crew:</span> <strong className="text-gray-700">{trip.memberCount || 1}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════
          KANBAN VIEW
      ════════════════════════════════════════════ */}
      {view === 'kanban' && (
  <div>
    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
      <span>💡</span> Drag a card to a different column to update its status.
    </p>
    <div
      className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
      onDragStart={(e) => setDraggingId(e.target.closest('[draggable]')?.dataset?.id)}
      onDragEnd={() => setDraggingId(null)}
    >
      {['planning', 'active', 'completed'].map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          trips={kanbanGroups[status]}
          onDrop={handleKanbanDrop}
          onCardClick={(id) => navigate(`/trips/${id}`)}
          draggingId={draggingId}
        />
      ))}
    </div>
  </div>
)}

      {/* ── Creation Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-scale-up max-h-[92vh] overflow-y-auto">
            <div className="h-2 w-full bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-400" />
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-gray-800">Plan a New Adventure</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">✕</button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-1">
                  <span>⚠️</span> {modalError}
                </div>
              )}

              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Trip Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Summer Beach Party, Winter Trek"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Destination *</label>
                  <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} placeholder="e.g. Goa, Ladakh, Tokyo"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Budget (INR)</label>
                  <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} placeholder="e.g. 25000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Choose Cover Emoji</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 bg-gray-50 border border-gray-100 rounded-xl">
                    {EMOJIS.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setFormData((prev) => ({ ...prev, emoji }))}
                        className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center hover:bg-gray-150 transition-colors
                          ${formData.emoji === emoji ? 'bg-primary-100 border border-primary-300' : 'bg-white border border-gray-200'}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Choose Theme Gradient</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GRADIENTS.map((grad) => (
                      <button key={grad.value} type="button" onClick={() => setFormData((prev) => ({ ...prev, gradient: grad.value }))}
                        className={`px-3 py-2 text-[10px] font-semibold rounded-lg text-white text-center bg-gradient-to-br ${grad.value}
                          ${formData.gradient === grad.value ? 'ring-4 ring-primary-500/30 border-2 border-white' : 'border border-transparent'}`}>
                        {grad.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all order-2 sm:order-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-emerald-500 text-white font-semibold text-sm rounded-xl
                      hover:from-primary-700 hover:to-emerald-600 shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 order-1 sm:order-2">
                    {creating ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                    ) : 'Create Trip'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}