import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Search, 
  Plus, 
  Filter, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Layers, 
  RefreshCw,
  SlidersHorizontal,
  Database
} from 'lucide-react';

export default function ProductsView({ 
  user, 
  onOpenAddModal, 
  onOpenEditModal, 
  onOpenAdjustModal, 
  onOpenDeleteModal,
  refreshTrigger 
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'low_stock' | 'healthy'
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list({ q: searchTerm || undefined });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, refreshTrigger]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await api.demo.seed();
      setFeedback(res.message);
      await loadProducts();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  // Filter products client-side for immediate responsive UX
  const filteredProducts = products.filter((p) => {
    if (filterMode === 'low_stock') return p.is_low_stock;
    if (filterMode === 'healthy') return !p.is_low_stock;
    return true;
  });

  const lowStockCount = products.filter((p) => p.is_low_stock).length;
  const healthyCount = products.length - lowStockCount;

  return (
    <div className="space-y-6">
      
      {/* Header and Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
            <span className="uppercase tracking-wider">Products</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">{user?.organization?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Products & Stock Inventory
          </h1>
          <p className="text-xs text-gray-500">
            Manage your product catalog and stock levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {products.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>{seeding ? 'Adding...' : 'Add Sample Data'}</span>
            </button>
          )}

          <button
            onClick={loadProducts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium shadow-2xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU or Product name..."
            className="w-full text-xs rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-white text-gray-900 font-semibold shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('low_stock')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filterMode === 'low_stock'
                ? 'bg-red-50 text-red-700 font-semibold shadow-2xs border border-red-200'
                : 'text-gray-600 hover:text-red-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('healthy')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filterMode === 'healthy'
                ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border border-emerald-200'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Healthy ({healthyCount})</span>
          </button>
        </div>

      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {searchTerm ? 'No products match your search query' : 'No products in your catalog yet'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? `Try adjusting your search terms or clearing the filter.` 
                : `Add your first product to get started.`}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={onOpenAddModal}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                + Add Product
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase font-mono text-[11px] tracking-wider">
                  <th className="py-3 px-5">Product Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const cost = p.cost_price || 0;
                  const price = p.selling_price || 0;
                  const marginPct = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : null;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      
                      {/* Name & Description */}
                      <td className="py-3.5 px-5 max-w-xs">
                        <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{p.description}</div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 text-[11px] font-medium">
                          {p.sku}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-gray-900 text-xs">
                          {p.quantity} units
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono">
                          thresh: {p.effective_low_stock_threshold}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {p.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-mono text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Healthy</span>
                          </span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-600">
                        {p.cost_price !== null && p.cost_price !== undefined ? `₹${Number(p.cost_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-900 font-semibold">
                        {p.selling_price !== null && p.selling_price !== undefined ? `₹${Number(p.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* Margin */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {marginPct !== null ? (
                          <span className={`font-semibold ${parseFloat(marginPct) >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {marginPct}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenAdjustModal(p)}
                            className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Adjust Stock (+/-)"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDeleteModal(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
