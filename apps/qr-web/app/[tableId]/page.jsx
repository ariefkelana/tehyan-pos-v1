// File: apps/qr-web/app/[tableId]/page.jsx
// This is a Server Component that fetches products and table info,
// then renders a Client-side interactive menu page.

import { notFound } from 'next/navigation';
import TableMenuClient from './TableMenuClient.jsx';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL) || 'http://localhost:5000';

async function getTable(tableId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tables/${tableId}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const table = await getTable(params.tableId);
  if (!table) return { title: 'Meja tidak ditemukan' };
  return {
    title: `Meja ${table.number} — Kedai TehYan`,
    description: `Pesan dari Meja ${table.number} dengan mudah.`,
  };
}

export default async function TablePage({ params }) {
  const { tableId } = params;

  // Validate tableId is a number
  if (!/^\d+$/.test(tableId)) notFound();

  const [table, products, categories] = await Promise.all([
    getTable(tableId),
    getProducts(),
    getCategories(),
  ]);

  if (!table) notFound();

  return (
    <TableMenuClient
      table={table}
      products={products}
      categories={categories}
    />
  );
}
