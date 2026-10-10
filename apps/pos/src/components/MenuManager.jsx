// File: apps/pos/src/components/MenuManager.jsx
/**
 * MenuManager — full CRUD interface for managing products/menu items.
 * Uses the useProducts hook for state management.
 */
import React, { useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useProducts } from '../hooks/useProducts.js';
import CategoryManager from './CategoryManager.jsx';
import ProductModifierEditor from './ProductModifierEditor.jsx';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(v));

const EMPTY_FORM = {
  name: '',
  price: '',
  categoryId: '',
  description: '',
  imageUrl: '',
  stock: '',
  isStockTracked: false,
  modifiers: [],
};

export default function MenuManager() {
  const {
    products,
    categories,
    isLoading,
    createProduct,
    updateProduct,
    toggleAvailability,
    deleteProduct,
    fetchAll,
  } = useProducts();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // product id to confirm delete
  const [showCategories, setShowCategories] = useState(false);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchCat = filterCat === 'all' || p.categoryId === Number(filterCat);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Open modal ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      categoryId: String(product.categoryId),
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      isAvailable: product.isAvailable,
      stock: product.stock !== undefined ? String(product.stock) : '0',
      isStockTracked: Boolean(product.isStockTracked),
      modifiers: (product.modifiers || []).map((m) => ({
        name: m.name,
        isRequired: m.isRequired,
        multiple: m.multiple,
        options: m.options.map((o) => ({
          name: o.name,
          additionalPrice: String(o.additionalPrice || 0),
        })),
      })),
    });
    setModalOpen(true);
  };

  // ── Submit form ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error('Nama, harga, dan kategori wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price) || 0,
        categoryId: parseInt(form.categoryId, 10),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        isAvailable: form.isAvailable,
        isStockTracked: form.isStockTracked,
        stock: form.isStockTracked ? parseInt(form.stock, 10) || 0 : 0,
        modifiers: form.modifiers.map(m => ({
          name: m.name,
          isRequired: m.isRequired,
          multiple: m.multiple,
          options: m.options.map(o => ({
            name: o.name,
            additionalPrice: parseFloat(o.additionalPrice) || 0,
          }))
        }))
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan produk.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setDeleteConfirm(null);
    } catch {
      toast.error('Gagal menghapus produk.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          {/* Search */}
          <input
            type="search"
            placeholder="Cari produk…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 w-52"
          />
          {/* Category filter */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 active:scale-95 transition-all"
        >
          <span className="text-lg">+</span> Tambah Produk
        </button>
        <button
          onClick={() => setShowCategories((v) => !v)}
          className={clsx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all border',
            showCategories
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600'
          )}
        >
          🏷️ {showCategories ? 'Tutup Kategori' : 'Kelola Kategori'}
        </button>
      </div>

      {/* Category Manager panel — collapsible */}
      {showCategories && (
        <CategoryManager categories={categories} onRefresh={fetchAll} />
      )}

      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { label: 'Total Produk', value: products.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Tersedia', value: products.filter(p => p.isAvailable).length, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Nonaktif', value: products.filter(p => !p.isAvailable).length, color: 'bg-red-50 text-red-700 border-red-100' },
          { label: 'Kategori', value: categories.length, color: 'bg-purple-50 text-purple-700 border-purple-100' },
        ].map((stat) => (
          <div key={stat.label} className={`flex-shrink-0 rounded-xl border px-4 py-2 text-sm ${stat.color}`}>
            <span className="font-bold text-lg">{stat.value}</span>
            <span className="ml-2 opacity-70">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Produk</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-center">Stok</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">Memuat data…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Tidak ada produk ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : '🍵'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                      {product.category?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.isStockTracked ? (
                      <span className={clsx('font-bold', product.stock > 0 ? 'text-gray-800' : 'text-red-600')}>
                        {product.stock}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">∞</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {formatRupiah(product.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleAvailability(product)}
                      className={clsx(
                        'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                        product.isAvailable
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      )}
                    >
                      {product.isAvailable ? '✓ Tersedia' : '✕ Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Product Form Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-bold text-gray-800">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="contoh: Teh Tarik"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Harga (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    placeholder="8000"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    required
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="">Pilih…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat produk…"
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL Gambar</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* Stock Management */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <div
                    className={clsx(
                      'relative h-6 w-11 rounded-full transition-colors',
                      form.isStockTracked ? 'bg-amber-500' : 'bg-gray-300'
                    )}
                    onClick={() => setForm({ ...form, isStockTracked: !form.isStockTracked })}
                  >
                    <div
                      className={clsx(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        form.isStockTracked ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Lacak Stok Produk Ini</span>
                </label>

                {form.isStockTracked && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Stok</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required={form.isStockTracked}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                )}
              </div>

              {/* Availability */}
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  className={clsx(
                    'relative h-6 w-11 rounded-full transition-colors',
                    form.isAvailable ? 'bg-amber-500' : 'bg-gray-300'
                  )}
                  onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                >
                  <div
                    className={clsx(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      form.isAvailable ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </div>
                <span className="text-sm text-gray-700">
                  {form.isAvailable ? 'Produk tersedia' : 'Produk dinonaktifkan'}
                </span>
              </label>

              {/* Product Modifiers UI */}
              <div className="pt-2 border-t border-gray-100">
                <ProductModifierEditor 
                  modifiers={form.modifiers} 
                  onChange={(mods) => setForm({ ...form, modifiers: mods })} 
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
                >
                  {submitting ? 'Menyimpan…' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <span className="text-5xl">⚠️</span>
            <h3 className="mt-3 text-lg font-bold text-gray-800">Hapus Produk?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 active:scale-95 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
