import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { expensesAPI, membersAPI, tripsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { value: 'food', label: '🍔 Food', color: 'bg-orange-100 text-orange-700' },
  { value: 'stay', label: '🏨 Stay', color: 'bg-blue-100 text-blue-700' },
  { value: 'transport', label: '🚗 Transport', color: 'bg-purple-100 text-purple-700' },
  { value: 'activity', label: '🎯 Activity', color: 'bg-green-100 text-green-700' },
  { value: 'shopping', label: '🛍️ Shopping', color: 'bg-pink-100 text-pink-700' },
  { value: 'other', label: '📦 Other', color: 'bg-gray-100 text-gray-600' },
];

function ExpenseForm({ initial, members, onSave, onClose }) {
  const [dateMode, setDateMode] = useState(
    initial?.dateTo ? 'range' : 'single'
  );
  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial?.amount || '',
    category: initial?.category || 'other',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    dateTo: initial?.dateTo ? initial.dateTo.split('T')[0] : '',
    paidBy: initial?.paidBy?._id || initial?.paidBy || (members[0]?._id || ''),
    splitAmong: initial?.splitAmong?.map(m => m._id || m) || members.map(m => m._id),
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (dateMode === 'range' && form.dateTo && form.dateTo < form.date) e.dateTo = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleSplit = (id) => {
    setForm(p => ({
      ...p,
      splitAmong: p.splitAmong.includes(id)
        ? p.splitAmong.filter(x => x !== id)
        : [...p.splitAmong, id],
    }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      amount: Number(form.amount),
      dateTo: dateMode === 'range' ? form.dateTo : undefined,
    };
    try { await onSave(payload); }
    finally { setSaving(false); }
  };

  // Calculate days in range for display
  const dayCount = dateMode === 'range' && form.date && form.dateTo
    ? Math.max(1, Math.round((new Date(form.dateTo) - new Date(form.date)) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  return (
   <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What was it for? *</label>
        <input type="text" value={form.title} placeholder="Dinner at Spice Garden"
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all
            ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'}`}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
        <input type="number" value={form.amount} placeholder="1200" min="0"
          onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all
            ${errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'}`}
        />
        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
      </div>

      {/* Date section */}
      <div>
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 w-fit">
            <button type="button"
              onClick={() => { setDateMode('single'); setForm(p => ({ ...p, dateTo: '' })); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                ${dateMode === 'single' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              Single Day
            </button>
            <button type="button"
              onClick={() => setDateMode('range')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                ${dateMode === 'range' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              Date Range
            </button>
          </div>
        </div>

        {dateMode === 'single' ? (
          <input type="date" value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To</label>
                <input type="date" value={form.dateTo} min={form.date}
                  onChange={e => setForm(p => ({ ...p, dateTo: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all
                    ${errors.dateTo ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'}`}
                />
                {errors.dateTo && <p className="text-xs text-red-500 mt-1">{errors.dateTo}</p>}
              </div>
            </div>
            {/* Range summary pill */}
            {form.date && form.dateTo && (
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-2 px-3 py-2 bg-primary-50 border border-primary-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📅</span>
                  <span className="text-xs text-primary-700 font-medium">
                    {dayCount} day{dayCount > 1 ? 's' : ''} selected
                  </span>
                </div>
                <span className="text-xs text-primary-400 xs:ml-auto">
                  {new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' → '}
                  {new Date(form.dateTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Split per person */}
      {form.amount && form.splitAmong.length > 0 && (
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧮</span>
            <span className="text-sm font-medium text-primary-700">
              Each person pays
              <span className="text-xs text-primary-400 font-normal ml-1">
                (₹{form.amount} ÷ {form.splitAmong.length})
              </span>
            </span>
          </div>
          <span className="text-xl font-bold text-primary-600">
            ₹{(parseFloat(form.amount) / form.splitAmong.length).toFixed(2)}
          </span>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
          {CATEGORIES.map(c => (
            <button key={c.value} type="button" onClick={() => setForm(p => ({ ...p, category: c.value }))}
              className={`py-2 px-3 rounded-xl text-xs font-medium transition-all
                ${form.category === c.value ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Paid by */}
      {members.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Paid by</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button key={m._id} type="button" onClick={() => setForm(p => ({ ...p, paidBy: m._id }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                  ${form.paidBy === m._id ? 'ring-2 ring-primary-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={form.paidBy === m._id ? { backgroundColor: m.color } : {}}>
                <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                  style={{ backgroundColor: m.color }}>{m.name[0]}</span>
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split among */}
      {members.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Split among</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const selected = form.splitAmong.includes(m._id);
              return (
                <button key={m._id} type="button" onClick={() => toggleSplit(m._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                    ${selected ? 'ring-2 ring-primary-400 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  style={selected ? { backgroundColor: m.color } : {}}>
                  <span>{selected ? '✓' : '○'}</span>
                  {m.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <input type="text" value={form.notes} placeholder="Any additional notes..."
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {initial ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}

export default function Budget() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [data, setData] = useState({ expenses: [], totalSpent: 0, memberSpend: [] });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

const load = async () => {
  try {
    const [t, exp, mem] = await Promise.all([
      tripsAPI.getOne(tripId),
      expensesAPI.getAll(tripId),
      membersAPI.getAll(tripId),
    ]);
    setTrip(t);
    setData({
      expenses: exp?.expenses || [],
      totalSpent: exp?.totalSpent || 0,
      memberSpend: exp?.memberSpend || [],
    });

    const normalized = (Array.isArray(mem) ? mem : []).map(m => ({
  _id: m.user?._id || m._id,  
  memberId: m._id,             
  name: m.user?.name || m.name || 'Unknown',
  color: m.color || '#6366f1',
}));
setMembers(normalized);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => { load(); }, [tripId]);

  const handleCreate = async (form) => {
    try {
      await expensesAPI.create(tripId, form);
      toast.success(`Expense "${form.title}" added! 💸`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add expense.');
    }
    setModalOpen(false);
    load();
  };

  const handleEdit = async (form) => {
    try {
      await expensesAPI.update(tripId, editExpense._id, form);
      toast.success(`Expense "${form.title}" updated! ✏️`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update expense.');
    }
    setEditExpense(null);
    load();
  };

  const handleDelete = async () => {
    try {
      await expensesAPI.delete(tripId, deleteConfirm._id);
      toast.success(`Expense "${deleteConfirm.title}" deleted. 🗑️`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete expense.');
    }
    setDeleteConfirm(null);
    load();
  };

  const getCatInfo = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[CATEGORIES.length - 1];

  // Group by category
  const byCategory = (data.expenses || []).reduce((acc, e) => {
  acc[e.category] = (acc[e.category] || 0) + e.amount;
  return acc;
}, {});

  return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link to={`/trips/${tripId}`} className="text-sm text-gray-400 hover:text-primary-600 transition-colors mb-4 inline-flex items-center gap-1">
          ← {trip?.name || 'Trip'}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Budget & Expenses</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">{data.expenses.length} expenses · ₹{data.totalSpent.toLocaleString()} total</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
            + Add Expense
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left: expenses list */}
            <div className="lg:col-span-2 space-y-3">
              {data.expenses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 sm:p-16 text-center">
                  <p className="text-5xl mb-4">💸</p>
                  <h3 className="font-display font-bold text-xl text-gray-700 mb-2">No expenses yet</h3>
                  <p className="text-gray-400 text-sm mb-6">Start logging what you spend on this trip</p>
                  <button onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg">
                    + Add First Expense
                  </button>
                </div>
              ) : (
                data.expenses.map(exp => {
                  const cat = getCatInfo(exp.category);
                  const perPerson = exp.splitAmong?.length > 0 ? Math.round(exp.amount / exp.splitAmong.length) : exp.amount;
                  return (
                    <div key={exp._id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group">
                      <div className="flex items-start gap-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex-shrink-0 ${cat.color}`}>{cat.label}</span>
                        <div className="flex-1 min-w-0"> 
                          <p className="font-semibold text-gray-800 text-sm">{exp.title}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                           {exp.paidBy && (exp.paidBy.user || exp.paidBy.name ) && ( // ← FIXED
                              <span className="text-xs text-gray-600">
                                Paid by{' '}
                                <span className="font-medium" style={{ color: exp.paidBy.color }}>
                                  {exp.paidBy.user?.name || exp.paidBy.name || 'Unknown'}
                                </span>
                              </span>
                            )}
                            {exp.splitAmong?.length > 1 && (
                              <span className="text-xs text-gray-500">split {exp.splitAmong.length} ways · ₹{perPerson}/person</span>
                            )}
                          </div>
                          {exp.notes && <p className="text-xs text-gray-400 mt-1 italic">"{exp.notes}"</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-800">₹{exp.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditExpense(exp)}
                          className="flex-1 py-1.5 text-xs font-medium border border-gray-200 text-gray-500 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(exp)}
                          className="flex-1 py-1.5 text-xs font-medium border border-gray-200 text-gray-500 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: summary */}
            <div className="space-y-4">
              {/* Total */}
              <div className="bg-gradient-to-br from-primary-600 to-emerald-500 rounded-2xl p-5 text-white">
                <p className="text-white/70 text-sm">Total Spent</p>
                <p className="font-display font-bold text-3xl mt-1">₹{data.totalSpent.toLocaleString()}</p>
                {members.length > 0 && (
                  <p className="text-white/70 text-sm mt-1">≈ ₹{Math.round(data.totalSpent / members.length).toLocaleString()}/person</p>
                )}
              </div>

              {/* By category */}
              {Object.keys(byCategory).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-700 text-sm mb-3">By Category</p>
                  <div className="space-y-2">
                    {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                      const c = getCatInfo(cat);
                      const pct = data.totalSpent > 0 ? Math.round((amt / data.totalSpent) * 100) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={`font-medium px-2 py-0.5 rounded-full ${c.color}`}>{c.label}</span>
                            <span className="text-gray-700 font-semibold">₹{amt.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-1.5">
                            <div className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per member */}
              {data.memberSpend?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-700 text-sm mb-3">Member Split</p>
                  
                  <div className="space-y-3">
                    {data.memberSpend.map(({ member, paid, owes }) => {
                      const net = paid - owes;
                      return (
                        <div key={member._id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: member.color }}>
                            {member.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{member.name}</p>
                            <p className="text-xs text-gray-400">Paid ₹{paid.toLocaleString()}</p>
                          </div>
                          <span className={`text-xs font-bold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {net > 0 ? '+' : ''}{Math.round(net).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Expense" size="lg">
  {members.length >= 0 && !loading && (
    <ExpenseForm members={members} onSave={handleCreate} onClose={() => setModalOpen(false)} />
  )}
</Modal>
        <Modal isOpen={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense" size="lg">
          {editExpense && <ExpenseForm initial={editExpense} members={members} onSave={handleEdit} onClose={() => setEditExpense(null)} />}
        </Modal>
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Expense" size="sm">
          {deleteConfirm && (
            <div className="text-center">
              <p className="text-5xl mb-4">🗑️</p>
              <p className="text-gray-700 font-medium mb-1">Delete "{deleteConfirm.title}"?</p>
              <p className="text-gray-400 text-sm mb-6">₹{deleteConfirm.amount.toLocaleString()} will be removed from totals.</p>
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