import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { itineraryAPI, tripsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const TYPES = [
  { value: 'activity', label: '🎯 Activity', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'food', label: '🍔 Food', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'transport', label: '🚗 Transport', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'stay', label: '🏨 Stay', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'rest', label: '😴 Rest', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'other', label: '📌 Other', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
];

const getType = (val) => TYPES.find(t => t.value === val) || TYPES[TYPES.length - 1];

function ItemForm({ initial, maxDay, onSave, onClose }) {
  const [form, setForm] = useState({
    dayNumber: initial?.dayNumber || 1,
    time: initial?.time || '',
    title: initial?.title || '',
    description: initial?.description || '',
    location: initial?.location || '',
    type: initial?.type || 'activity',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {  
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
          <select value={form.dayNumber} onChange={e => setForm(p => ({ ...p, dayNumber: Number(e.target.value) }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all">
            {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time (optional)</label>
          <input type="time" value={form.time}
            onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input type="text" value={form.title} placeholder="Visit Dudhsagar Waterfall"
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all
            ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'}`}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type: t.value }))}
              className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center
                ${form.type === t.value ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
        <input type="text" value={form.location} placeholder="Goa, India"
          onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea value={form.description} rows={2} placeholder="Any notes or reminders..."
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {initial ? 'Save Changes' : 'Add to Itinerary'}
        </button>
      </div>
    </form>
  );
}

export default function Itinerary() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState({ days: [], totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeDay, setActiveDay] = useState(1);

  const load = async () => {
    try {
      const [t, it] = await Promise.all([tripsAPI.getOne(tripId), itineraryAPI.getAll(tripId)]);
      setTrip(t);
      
      const days = Array.isArray(it) ? it : [];
      const start = t?.startDate ? new Date(t.startDate) : null;
      const end = t?.endDate ? new Date(t.endDate) : null;
      const calculatedDuration = (start && end) ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 1;
      const duration = t?.durationDays || calculatedDuration || 1;
      const populatedDays = [];
      
      for (let d = 1; d <= duration; d++) {
        const existing = days.find(day => day.dayNumber === d);
        const tripStart = t?.startDate ? new Date(t.startDate) : null;
        let dayDate = null;
        if (tripStart) {
          dayDate = new Date(tripStart);
          dayDate.setDate(tripStart.getDate() + (d - 1));
        }
        populatedDays.push({
          _id: existing?._id || null,
          dayNumber: d,
          date: existing?.date || dayDate,
          items: (existing?.activities || []).map(act => ({
            _id: act._id,
            time: act.time || '',
            title: act.title || '',
            description: act.description || '',
            location: act.location || '',
            type: act.type || 'activity',
            done: act.done || false
          }))
        });
      }
      
      const totalItems = populatedDays.reduce((sum, d) => sum + d.items.length, 0);
      setItinerary({ days: populatedDays, totalItems });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tripId]);

  const handleCreate = async (data) => {
    const day = itinerary.days.find(d => d.dayNumber === data.dayNumber);
    if (!day) return;
    
    const newActivity = {
      time: data.time,
      title: data.title,
      description: data.description,
      location: data.location,
      type: data.type,
      done: false
    };
    
    const activities = [...day.items, newActivity].map(item => ({
      time: item.time,
      title: item.title,
      description: item.description,
      location: item.location,
      type: item.type,
      done: item.done
    }));
    
    try {
      await itineraryAPI.save(tripId, {
        dayNumber: data.dayNumber,
        date: day.date,
        activities
      });
      toast.success(`Activity "${data.title}" added to Day ${data.dayNumber}! 🎯`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add activity.');
    }
    
    setModalOpen(false);
    load();
  };

  const handleEdit = async (data) => {
    const originalDay = itinerary.days.find(d => d.items.some(i => i._id === editItem._id));
    if (!originalDay) return;
    
    try {
      if (originalDay.dayNumber === data.dayNumber) {
        const activities = originalDay.items.map(item => {
          if (item._id === editItem._id) {
            return {
              time: data.time,
              title: data.title,
              description: data.description,
              location: data.location,
              type: data.type,
              done: item.done
            };
          }
          return {
            time: item.time,
            title: item.title,
            description: item.description,
            location: item.location,
            type: item.type,
            done: item.done
          };
        });
        
        await itineraryAPI.save(tripId, {
          dayNumber: data.dayNumber,
          date: originalDay.date,
          activities
        });
      } else {
        const originalActivities = originalDay.items
          .filter(item => item._id !== editItem._id)
          .map(item => ({
            time: item.time,
            title: item.title,
            description: item.description,
            location: item.location,
            type: item.type,
            done: item.done
          }));
        
        const targetDay = itinerary.days.find(d => d.dayNumber === data.dayNumber);
        if (!targetDay) return;
        
        const newActivity = {
          time: data.time,
          title: data.title,
          description: data.description,
          location: data.location,
          type: data.type,
          done: editItem.done
        };
        
        const targetActivities = [...targetDay.items, newActivity].map(item => ({
          time: item.time,
          title: item.title,
          description: item.description,
          location: item.location,
          type: item.type,
          done: item.done
        }));
        
        await Promise.all([
          itineraryAPI.save(tripId, {
            dayNumber: originalDay.dayNumber,
            date: originalDay.date,
            activities: originalActivities
          }),
          itineraryAPI.save(tripId, {
            dayNumber: data.dayNumber,
            date: targetDay.date,
            activities: targetActivities
          })
        ]);
      }
      toast.success(`Activity "${data.title}" updated! ✏️`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update activity.');
    }
    
    setEditItem(null);
    load();
  };

  const handleDelete = async () => {
    const day = itinerary.days.find(d => d.items.some(i => i._id === deleteConfirm._id));
    if (!day) return;
    
    const activities = day.items
      .filter(item => item._id !== deleteConfirm._id)
      .map(item => ({
        time: item.time,
        title: item.title,
        description: item.description,
        location: item.location,
        type: item.type,
        done: item.done
      }));
      
    try {
      await itineraryAPI.save(tripId, {
        dayNumber: day.dayNumber,
        date: day.date,
        activities
      });
      toast.success(`Activity "${deleteConfirm.title}" deleted. 🗑️`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete activity.');
    }
    
    setDeleteConfirm(null);
    load();
  };

  const toggleDone = async (item) => {
    const day = itinerary.days.find(d => d.items.some(i => i._id === item._id));
    if (!day) return;
    
    const activities = day.items.map(i => ({
      time: i.time,
      title: i.title,
      description: i.description,
      location: i.location,
      type: i.type,
      done: i._id === item._id ? !i.done : i.done
    }));

    const isDone = !item.done;
    try {
      await itineraryAPI.save(tripId, {
        dayNumber: day.dayNumber,
        date: day.date,
        activities
      });
      if (isDone) {
        toast.success(`Activity "${item.title}" marked as done! 🎉`);
      } else {
        toast.info(`Activity "${item.title}" marked as incomplete.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
    
    load();
  };

  const maxDay = trip?.durationDays || 1;
  const activeDayData = itinerary.days.find(d => d.dayNumber === activeDay);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link to={`/trips/${tripId}`} className="text-sm text-gray-400 hover:text-primary-600 transition-colors mb-4 inline-flex items-center gap-1">
        ← {trip?.name || 'Trip'}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Itinerary</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{itinerary.totalItems} activities across {maxDay} days</p>
        </div>
        <button onClick={() => { setModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
          + Add Activity
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Day tabs - left (horizontal scroll on mobile/tablet, vertical stack on desktop) */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {itinerary.days.map(day => {
              const done = day.items.filter(i => i.done).length;
              return (
                <button key={day.dayNumber} onClick={() => setActiveDay(day.dayNumber)}
                  className={`text-left p-3.5 rounded-2xl transition-all border flex-shrink-0 w-40 lg:w-full ${
                    activeDay === day.dayNumber
                      ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white border-transparent shadow-lg shadow-primary-500/25'
                      : 'bg-white text-gray-600 border-gray-100 hover:border-primary-200 hover:text-primary-600'
                  }`}>
                  <p className="font-bold text-sm">Day {day.dayNumber}</p>
                  {day.date && (
                    <p className={`text-xs mt-0.5 ${activeDay === day.dayNumber ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${activeDay === day.dayNumber ? 'text-white/70' : 'text-gray-400'}`}>
                    {day.items.length} {day.items.length === 1 ? 'activity' : 'activities'}
                    {day.items.length > 0 && ` · ${done}/${day.items.length} done`}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Day items - right */}
          <div className="lg:col-span-3">
            {!activeDayData || activeDayData.items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 sm:p-14 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="font-display font-bold text-gray-700 mb-1">Nothing planned for Day {activeDay}</p>
                <p className="text-gray-400 text-sm mb-5">Add activities, meals, or transport for this day</p>
                <button onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg">
                  + Add Activity
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {activeDayData.items.map((item) => {
                  const typeInfo = getType(item.type);
                  return (
                   <div key={item._id}
                      className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-all group ${item.done ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
                      <div className="flex items-start gap-3 w-full">     
                        {/* Done toggle */}
                        <button onClick={() => toggleDone(item)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                            ${item.done ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>
                          {item.done && <span className="text-white text-[10px]">✓</span>}
                        </button>

                        <div className="flex-1 min-w-0">  {/* this already works correctly with flex-1 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.time && <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">{item.time}</span>}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeInfo.color}`}>{typeInfo.label}</span>
                          </div>
                          <p className={`font-semibold text-gray-800 mt-1 ${item.done ? 'line-through text-gray-400' : ''}`}>{item.title}</p>
                          {item.location && <p className="text-xs text-gray-400 mt-0.5">📍 {item.location}</p>}
                          {item.description && <p className="text-xs text-gray-500 mt-1 italic">"{item.description}"</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
   
                          <button onClick={() => setEditItem({ ...item, dayNumber: activeDay })}
                            className="px-2.5 py-1 text-xs border border-gray-200 text-gray-400 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(item)}
                            className="px-2.5 py-1 text-xs border border-gray-200 text-gray-400 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => setModalOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all font-medium">
                  + Add to Day {activeDay}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add to Itinerary">
        <ItemForm maxDay={maxDay} onSave={handleCreate} onClose={() => setModalOpen(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Activity">
        {editItem && <ItemForm initial={editItem} maxDay={maxDay} onSave={handleEdit} onClose={() => setEditItem(null)} />}
      </Modal>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Activity" size="sm">
        {deleteConfirm && (
          <div className="text-center">
            <p className="text-5xl mb-4">🗑️</p>
            <p className="text-gray-700 font-medium mb-1">Delete "{deleteConfirm.title}"?</p>
            <p className="text-gray-400 text-sm mb-6">This activity will be removed from your itinerary.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}