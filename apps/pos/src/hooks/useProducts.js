// File: apps/pos/src/hooks/useProducts.js
/**
 * Custom hook — CRUD operations for the product/menu management page.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch {
      toast.error('Gagal memuat data menu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createProduct = async (payload) => {
    const { data: res } = await api.post('/products', payload);
    if (res.success) {
      setProducts((prev) => [res.data, ...prev]);
      toast.success(`Produk "${res.data.name}" berhasil ditambahkan.`);
      return res.data;
    }
  };

  const updateProduct = async (id, payload) => {
    const { data: res } = await api.patch(`/products/${id}`, payload);
    if (res.success) {
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      toast.success(`Produk "${res.data.name}" berhasil diperbarui.`);
      return res.data;
    }
  };

  const toggleAvailability = async (product) => {
    const { data: res } = await api.patch(`/products/${product.id}`, {
      isAvailable: !product.isAvailable,
    });
    if (res.success) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? res.data : p)));
      toast.success(
        res.data.isAvailable
          ? `"${res.data.name}" kini tersedia.`
          : `"${res.data.name}" dinonaktifkan.`
      );
    }
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Produk dihapus.');
  };

  return {
    products,
    categories,
    isLoading,
    fetchAll,
    createProduct,
    updateProduct,
    toggleAvailability,
    deleteProduct,
  };
}
