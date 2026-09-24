import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));

export default function ProductModifierModal({ product, onClose, onAddToCart }) {
  // State: { [modifierName]: [selectedOptionName1, selectedOptionName2, ...] }
  const [selected, setSelected] = useState({});

  const handleToggle = (modifier, option) => {
    setSelected((prev) => {
      const currentSelected = prev[modifier.name] || [];
      const isSelected = currentSelected.includes(option.name);

      if (modifier.multiple) {
        // Toggle checkbox
        if (isSelected) {
          return { ...prev, [modifier.name]: currentSelected.filter((n) => n !== option.name) };
        } else {
          return { ...prev, [modifier.name]: [...currentSelected, option.name] };
        }
      } else {
        // Radio behavior
        if (isSelected) {
          // If not required, we can unselect radio. If required, we can't unselect unless we pick another.
          return modifier.isRequired
            ? prev
            : { ...prev, [modifier.name]: [] };
        } else {
          return { ...prev, [modifier.name]: [option.name] };
        }
      }
    });
  };

  const calculateTotal = () => {
    let total = Number(product.price);
    product.modifiers.forEach((mod) => {
      const sel = selected[mod.name] || [];
      sel.forEach((optName) => {
        const opt = mod.options.find((o) => o.name === optName);
        if (opt) total += Number(opt.additionalPrice || 0);
      });
    });
    return total;
  };

  const isFormValid = () => {
    for (const mod of product.modifiers) {
      if (mod.isRequired) {
        const sel = selected[mod.name] || [];
        if (sel.length === 0) return false;
      }
    }
    return true;
  };

  const handleAdd = () => {
    if (!isFormValid()) return;

    const modsToAdd = [];
    product.modifiers.forEach((mod) => {
      const sel = selected[mod.name] || [];
      sel.forEach((optName) => {
        const opt = mod.options.find((o) => o.name === optName);
        if (opt) {
          modsToAdd.push({
            name: mod.name,
            optionName: opt.name,
            additionalPrice: Number(opt.additionalPrice || 0),
          });
        }
      });
    });

    onAddToCart(product, modsToAdd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-3xl flex flex-col max-h-[90vh]">
        {/* Header & Image */}
        <div className="relative shrink-0 border-b border-gray-100 pb-5 pt-6 px-6">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
          
          <div className="flex gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-slate-100">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl">🍵</div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-xl font-black text-zinc-900 leading-tight">{product.name}</h2>
              <p className="font-bold text-emerald-600 mt-1">{formatRupiah(product.price)}</p>
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {product.modifiers.map((mod, modIdx) => (
            <div key={modIdx} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 uppercase tracking-wide text-xs">{mod.name}</h3>
                {mod.isRequired ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600 tracking-wider">WAJIB</span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Opsi</span>
                )}
              </div>
              <div className="space-y-2.5">
                {mod.options.map((opt, optIdx) => {
                  const isSelected = (selected[mod.name] || []).includes(opt.name);
                  const isCheckbox = mod.multiple;

                  return (
                    <label
                      key={optIdx}
                      className={clsx(
                        'flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all',
                        isSelected ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'flex h-5 w-5 items-center justify-center border',
                            isCheckbox ? 'rounded-md' : 'rounded-full',
                            isSelected ? 'border-white bg-white text-zinc-900' : 'border-gray-300'
                          )}
                        >
                          {isSelected && (isCheckbox ? <span className="text-xs font-bold">✓</span> : <div className="h-2 w-2 rounded-full bg-zinc-900" />)}
                        </div>
                        <span className={clsx('text-sm font-bold', isSelected ? 'text-white' : 'text-zinc-900')}>
                          {opt.name}
                        </span>
                      </div>
                      {Number(opt.additionalPrice) > 0 && (
                        <span className={clsx("text-xs font-black", isSelected ? 'text-emerald-400' : 'text-emerald-600')}>
                          +{formatRupiah(opt.additionalPrice)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-5">
          <button
            onClick={handleAdd}
            disabled={!isFormValid()}
            className={clsx(
              'flex w-full items-center justify-between rounded-2xl px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-transform active:scale-95',
              isFormValid() ? 'bg-zinc-900 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            )}
          >
            <span className="font-bold tracking-wide">Tambahkan</span>
            <span className="font-black text-emerald-400">{formatRupiah(calculateTotal())}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
