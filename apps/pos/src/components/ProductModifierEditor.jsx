import React from 'react';
import clsx from 'clsx';

export default function ProductModifierEditor({ modifiers, onChange }) {
  const addModifier = () => {
    onChange([
      ...modifiers,
      {
        name: '',
        isRequired: false,
        multiple: false,
        options: [{ name: '', additionalPrice: '0' }],
      },
    ]);
  };

  const removeModifier = (index) => {
    const newMods = [...modifiers];
    newMods.splice(index, 1);
    onChange(newMods);
  };

  const updateModifier = (index, field, value) => {
    const newMods = [...modifiers];
    newMods[index] = { ...newMods[index], [field]: value };
    onChange(newMods);
  };

  const addOption = (modIndex) => {
    const newMods = [...modifiers];
    newMods[modIndex].options.push({ name: '', additionalPrice: '0' });
    onChange(newMods);
  };

  const removeOption = (modIndex, optIndex) => {
    const newMods = [...modifiers];
    newMods[modIndex].options.splice(optIndex, 1);
    onChange(newMods);
  };

  const updateOption = (modIndex, optIndex, field, value) => {
    const newMods = [...modifiers];
    newMods[modIndex].options[optIndex] = {
      ...newMods[modIndex].options[optIndex],
      [field]: value,
    };
    onChange(newMods);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Kustomisasi (Opsional)
        </label>
        <button
          type="button"
          onClick={addModifier}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700"
        >
          + Tambah Grup
        </button>
      </div>

      {modifiers.length === 0 && (
        <p className="text-xs text-gray-400 italic">Tidak ada pilihan kustomisasi (cth: Level Es).</p>
      )}

      {modifiers.map((mod, modIdx) => (
        <div key={modIdx} className="rounded-xl border border-gray-200 bg-gray-50 p-4 relative">
          <button
            type="button"
            onClick={() => removeModifier(modIdx)}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold"
          >
            Hapus
          </button>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Nama Grup (cth: Level Es)</label>
              <input
                type="text"
                value={mod.name}
                onChange={(e) => updateModifier(modIdx, 'name', e.target.value)}
                required
                placeholder="Nama Grup"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={mod.isRequired}
                  onChange={(e) => updateModifier(modIdx, 'isRequired', e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                Wajib Pilih
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={mod.multiple}
                  onChange={(e) => updateModifier(modIdx, 'multiple', e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                Bisa Pilih Banyak
              </label>
            </div>

            {/* Options */}
            <div className="pt-2 border-t border-gray-200">
              <label className="block text-[10px] uppercase text-gray-500 mb-2">Pilihan & Harga Tambahan</label>
              {mod.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => updateOption(modIdx, optIdx, 'name', e.target.value)}
                    required
                    placeholder="Nama Pilihan (cth: Sedikit)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-gray-500">+Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={opt.additionalPrice}
                    onChange={(e) => updateOption(modIdx, optIdx, 'additionalPrice', e.target.value)}
                    required
                    className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
                  />
                  {mod.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(modIdx, optIdx)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(modIdx)}
                className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 mt-1"
              >
                + Tambah Pilihan
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
