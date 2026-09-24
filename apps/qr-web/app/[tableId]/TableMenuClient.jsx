// File: apps/qr-web/app/[tableId]/TableMenuClient.jsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import CheckoutModal from '../../components/CheckoutModal.jsx';
import OrderStatusBanner from '../../components/OrderStatusBanner.jsx';
import ProductModifierModal from '../../components/ProductModifierModal.jsx';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));

export default function TableMenuClient({ table, products, categories }) {
  const [cart, setCart] = useState({}); // { productId: { product, quantity } }
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [latestOrderNumber, setLatestOrderNumber] = useState(null);
  const [activeProductForMods, setActiveProductForMods] = useState(null);

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId('all');
    }
  }, [categories, activeCategoryId]);

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const generateCartKey = (productId, selectedMods = []) => {
    if (selectedMods.length === 0) return String(productId);
    const modString = selectedMods
      .map((m) => `${m.name}:${m.optionName}`)
      .sort()
      .join('|');
    return `${productId}-${modString}`;
  };

  const getProductQuantity = (productId) => {
    return Object.values(cart)
      .filter((i) => i.product.id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const addToCart = (product, selectedMods = []) => {
    const key = generateCartKey(product.id, selectedMods);
    setCart((prev) => {
      const current = prev[key];
      // Calculate unit price including modifiers
      const basePrice = Number(product.price);
      const modsPrice = selectedMods.reduce((sum, m) => sum + Number(m.additionalPrice || 0), 0);
      const finalUnitPrice = basePrice + modsPrice;

      return {
        ...prev,
        [key]: {
          product,
          selectedMods,
          unitPrice: finalUnitPrice,
          quantity: (current?.quantity ?? 0) + 1,
        },
      };
    });
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => {
      const current = prev[cartKey];
      if (!current || current.quantity <= 0) return prev;
      if (current.quantity === 1) {
        const next = { ...prev };
        delete next[cartKey];
        return next;
      }
      return { ...prev, [cartKey]: { ...current, quantity: current.quantity - 1 } };
    });
  };

  const cartItems = Object.entries(cart).map(([key, value]) => ({ cartKey: key, ...value }));
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, i) => acc + i.unitPrice * i.quantity,
    0
  );

  // ── Filtered products ─────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        activeCategoryId === 'all' || p.categoryId === activeCategoryId;
      const matchSearch =
        search === '' || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, activeCategoryId, search]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (activeCategoryId !== 'all') {
      return { [activeCategoryId]: filteredProducts };
    }
    return filteredProducts.reduce((acc, p) => {
      const catId = p.categoryId;
      if (!acc[catId]) acc[catId] = [];
      acc[catId].push(p);
      return acc;
    }, {});
  }, [filteredProducts, activeCategoryId]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative w-full h-44 bg-zinc-900 rounded-b-[2.5rem] overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <div className="absolute inset-0 flex items-center justify-center opacity-30 text-9xl">🍵</div>
        
        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest text-emerald-400 uppercase mb-1">
              Kedai TehYan
            </p>
            <h1 className="text-3xl font-black text-white tracking-tighter">Meja {table.number}</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg">
            <span className="text-lg font-black">#{table.number}</span>
          </div>
        </div>
      </div>

      {/* ── Order Status Banner ───────────────────────────────────────────── */}
      <OrderStatusBanner
        tableId={table.id}
        latestOrderNumber={latestOrderNumber}
      />

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mau minum apa hari ini?"
            className="w-full rounded-2xl bg-white px-5 py-3.5 pl-12 text-sm shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-zinc-900 transition-all border border-transparent focus:border-transparent"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
        </div>
      </div>

      {/* ── Category Tabs ─────────────────────────────────────────────────── */}
      <div className="sticky top-[5.5rem] z-30 overflow-x-auto px-5 py-2 no-scrollbar bg-slate-50/90 backdrop-blur-md">
        <div className="flex gap-2">
          <CategoryChip
            label="Semua"
            isActive={activeCategoryId === 'all'}
            onClick={() => setActiveCategoryId('all')}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              isActive={activeCategoryId === cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Product List ──────────────────────────────────────────────────── */}
      <div className="px-5 py-6 space-y-8">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <span className="text-5xl">🔍</span>
            <p className="text-sm font-bold">Menu tidak ditemukan</p>
          </div>
        ) : (
          Object.entries(grouped).map(([catId, catProducts]) => (
            <div key={catId} className="space-y-4">
              {activeCategoryId === 'all' && (
                <h2 className="text-lg font-black tracking-tight text-zinc-900 border-b-2 border-zinc-900 pb-2 inline-block">
                  {categoryMap[catId] ?? 'Lainnya'}
                </h2>
              )}
              <div className="flex flex-col gap-4">
                {catProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={getProductQuantity(product.id)}
                    onAdd={() => {
                      if (product.modifiers?.length > 0) {
                        setActiveProductForMods(product);
                      } else {
                        addToCart(product);
                      }
                    }}
                    onRemove={() => {
                      const lastItem = [...cartItems].reverse().find(i => i.product.id === product.id);
                      if (lastItem) removeFromCart(lastItem.cartKey);
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Floating Cart Button ──────────────────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-5">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="flex w-full items-center justify-between rounded-full bg-zinc-900 px-6 py-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-transform active:scale-95"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-sm">
                {cartCount}
              </span>
              <span className="font-bold tracking-wide">Lihat Keranjang</span>
            </span>
            <span className="font-black text-emerald-400">{formatRupiah(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Checkout Modal ─────────────────────────────────────────────────── */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          table={table}
          cartTotal={cartTotal}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={(orderNum) => {
            setLatestOrderNumber(orderNum ?? null);
            setCart({});
            setIsCheckoutOpen(false);
          }}
          onRemoveItem={removeFromCart}
          onAddItem={(prod, existingMods) => {
            if (existingMods && existingMods.length > 0) {
              // If we are clicking + from inside the cart on a customized item, just add the same customization
              addToCart(prod, existingMods);
            } else if (prod.modifiers?.length > 0) {
              // If it's a new add or from an uncustomized base, open the modal
              setActiveProductForMods(prod);
            } else {
              addToCart(prod);
            }
          }}
        />
      )}

      {/* ── Modifiers Modal ────────────────────────────────────────────────── */}
      {activeProductForMods && (
        <ProductModifierModal
          product={activeProductForMods}
          onClose={() => setActiveProductForMods(null)}
          onAddToCart={(prod, mods) => {
            addToCart(prod, mods);
            setActiveProductForMods(null);
          }}
        />
      )}
    </div>
  );
}

// ── Category Chip ──────────────────────────────────────────────────────────
function CategoryChip({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex-shrink-0 rounded-full px-5 py-2 text-xs font-bold transition-all border',
        isActive
          ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
      )}
    >
      {label}
    </button>
  );
}

// ── Product Card (Horizontal Sleek List) ──────────────────────────────────
function ProductCard({ product, quantity, onAdd, onRemove }) {
  return (
    <div className="relative flex overflow-hidden rounded-[1.5rem] bg-white p-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/50">
      {/* Image */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 512px) 50vw, 112px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🍵</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between pl-4 pr-1 py-1">
        <div>
          <p className="text-sm font-bold leading-snug text-zinc-900 line-clamp-2">
            {product.name}
          </p>
          {product.description && (
            <p className="mt-1 text-[11px] text-gray-400 line-clamp-2 leading-tight font-medium">
              {product.description}
            </p>
          )}
        </div>
        
        <div className="mt-2 flex items-end justify-between">
          <span className="text-sm font-black text-emerald-600 tracking-tight">
            {formatRupiah(product.price)}
          </span>

          {product.isStockTracked && product.stock <= 0 ? (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md tracking-widest uppercase">Habis</span>
          ) : (
            <div className="flex items-center gap-2">
              {quantity > 0 && (
                <div className="flex items-center bg-gray-50 rounded-full border border-gray-100 p-0.5 shadow-sm">
                  <button
                    onClick={onRemove}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 active:scale-90 hover:bg-white transition-all"
                  >
                    <span className="text-sm font-black">−</span>
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-zinc-900">{quantity}</span>
                  <button
                    onClick={onAdd}
                    disabled={product.isStockTracked && quantity >= product.stock}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 active:scale-90 hover:bg-white transition-all"
                  >
                    <span className="text-sm font-black">+</span>
                  </button>
                </div>
              )}
              {quantity === 0 && (
                <button
                  onClick={onAdd}
                  className="flex h-8 px-4 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md active:scale-95 transition-transform"
                >
                  <span className="text-xs font-bold">Tambah</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
