// File: apps/pos/src/components/CategoryManager.jsx
/**
 * CategoryManager — inline CRUD panel for product categories.
 * Intended to be embedded inside MenuManager as a side panel or tab.
 */
import React, { useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

export default function CategoryManager({ categories, onRefresh }) {
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/categories', { name: newName.trim() });
      toast.success(`Kategori "${newName.trim()}" ditambahkan.`);
      setNewName('');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Gagal menambah kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/categories/${id}`, { name: editName.trim() });
      toast.success('Kategori diperbarui.');
      setEditId(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Kategori dihapus.');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kategori.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Kelola Kategori</h3>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          {categories.length} kategori
        </span>
      </div>

      {/* Add new */}
      <form onSubmit={handleCreate} className="flex items-center gap-2 border-b px-4 py-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama kategori baru…"
          maxLength={50}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
        >
          <span>+</span> Tambah
        </button>
      </form>

      {/* List */}
      <ul className="divide-y max-h-72 overflow-y-auto">
        {categories.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">Belum ada kategori</li>
        )}
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center gap-2 px-4 py-3">
            {editId === cat.id ? (
              /* Edit mode */
              <>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(cat.id);
                    if (e.key === 'Escape') setEditId(null);
                  }}
                  className="flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                />
                <button
                  onClick={() => handleUpdate(cat.id)}
                  disabled={submitting}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  ✕
                </button>
              </>
            ) : (
              /* View mode */
              <>
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                  <span className="truncate text-sm font-medium text-gray-800">{cat.name}</span>
                  <span className="text-xs text-gray-400">
                    ({cat._count?.products ?? 0} produk)
                  </span>
                </div>
                <button
                  onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id || (cat._count?.products ?? 0) > 0}
                  className={clsx(
                    'rounded-lg p-1.5 transition-colors',
                    (cat._count?.products ?? 0) > 0
                      ? 'cursor-not-allowed text-gray-200'
                      : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                  )}
                  title={
                    (cat._count?.products ?? 0) > 0
                      ? 'Hapus semua produk dulu'
                      : 'Hapus kategori'
                  }
                >
                  {deletingId === cat.id ? '⏳' : '🗑️'}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
