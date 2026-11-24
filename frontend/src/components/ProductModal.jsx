import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, Boxes, Tag, AlertCircle, IndianRupee, Layers } from 'lucide-react';

export default function ProductModal({ 
  isOpen, 
  onClose, 
  productToEdit, 
  onSuccess,
  defaultOrgThreshold = 5
}) {
  const isEdit = Boolean(productToEdit);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setDescription(productToEdit.description || '');
      setQuantity(productToEdit.quantity ?? 0);
      setCostPrice(productToEdit.cost_price !== null && productToEdit.cost_price !== undefined ? productToEdit.cost_price : '');
      setSellingPrice(productToEdit.selling_price !== null && productToEdit.selling_price !== undefined ? productToEdit.selling_price : '');
      setLowStockThreshold(productToEdit.low_stock_threshold !== null && productToEdit.low_stock_threshold !== undefined ? productToEdit.low_stock_threshold : '');
    } else {
      setName('');
      setSku('');
      setDescription('');
      setQuantity(0);
      setCostPrice('');
      setSellingPrice('');
      setLowStockThreshold('');
    }
    setError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Real-time Margin Calculation
  const cost = parseFloat(costPrice) || 0;
  const price = parseFloat(sellingPrice) || 0;
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('Product SKU is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      description: description.trim() || null,
      quantity: parseInt(quantity, 10) || 0,
      cost_price: costPrice !== '' ? parseFloat(costPrice) : null,
      selling_price: sellingPrice !== '' ? parseFloat(sellingPrice) : null,
      low_stock_threshold: lowStockThreshold !== '' ? parseInt(lowStockThreshold, 10) : null,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.products.update(productToEdit.id, payload);
      } else {
        await api.products.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit ? `Editing ${productToEdit.sku}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Product / Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Heavy Duty Steel Ball Bearing (25mm)"
              className="w-full text-xs rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* SKU and Initial Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SKU (Unique Identifier) *
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. BRG-25MM-HD"
                  className="w-full text-xs font-mono font-medium rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quantity on Hand *
              </label>
              <div className="relative">
                <Layers className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-xs font-mono font-medium rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cost Price and Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Unit Cost Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs font-mono rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Selling Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs font-mono rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Margin calculation helper pill */}
          {margin !== null && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <span className="text-gray-500">Margin:</span>
              <span className={`font-mono font-bold ${parseFloat(margin) >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {margin}%
              </span>
            </div>
          )}

          {/* Low Stock Threshold */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Low Stock Alert Threshold
              </label>
              <span className="text-[11px] text-gray-400">
                Default: {defaultOrgThreshold} units
              </span>
            </div>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder={`Leave blank to use org default (${defaultOrgThreshold})`}
              className="w-full text-xs font-mono rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              If stock drops to or below this number, the product flags as Low Stock.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Stored in Warehouse Bay 4, Shelf B-12"
              className="w-full text-xs rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
