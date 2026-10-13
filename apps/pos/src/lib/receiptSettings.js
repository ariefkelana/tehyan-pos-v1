// File: apps/pos/src/lib/receiptSettings.js

export const DEFAULT_RECEIPT_SETTINGS = {
  paperSize: '80mm', // '80mm' | '58mm'
  storeName: 'KEDAI TEHYAN',
  storeSlogan: 'Spesialis Teh Tarik & Minuman Segar',
  storeAddress: 'Jl. Margonda Raya, Depok',
  storePhone: '0812-3456-7890',
  showPhone: true,
  showOrderNumber: true,
  showTableNumber: true,
  showCustomerName: true,
  showCashierName: true,
  showDateTime: true,
  showModifiers: true,
  showItemNotes: true,
  showPaymentMethod: true,
  showCashChange: true,
  footerThanks: 'Terima kasih atas kunjungan Anda! 🙏',
  footerNote: 'Simpan struk ini sebagai bukti pembayaran.',
  footerCredit: 'Kedai TehYan POS • Cloud System',
};

const STORAGE_KEY = 'tehyan_receipt_settings';

export const getReceiptSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RECEIPT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('[ReceiptSettings] Gagal membaca dari localStorage:', err);
  }
  return DEFAULT_RECEIPT_SETTINGS;
};

export const saveReceiptSettings = (newSettings) => {
  if (typeof window === 'undefined') return;
  const merged = { ...DEFAULT_RECEIPT_SETTINGS, ...newSettings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('[ReceiptSettings] Gagal menyimpan ke localStorage:', err);
  }
  return merged;
};
