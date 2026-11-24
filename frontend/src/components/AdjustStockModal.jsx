import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, Layers, Plus, Minus, ArrowRight, AlertCircle, Check } from 'lucide-react';

export default function AdjustStockModal({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess 
}) {
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDelta('');
    setNote('');
    setError('');
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentQty = product.quantity ?? 0;
  const parsedDelta = parseInt(delta, 10) || 0;
  const resultingQty = currentQty + parsedDelta;

  const handlePreset = (amount) => {
    setDelta(String(amount));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parsedDelta === 0) {
      setError('Please specify a positive or negative adjustment value.');
      return;
    }

    if (resultingQty < 0) {
      setError(`Cannot reduce by ${Math.abs(parsedDelta)}. Maximum reduction is ${currentQty}.`);
      return;
    }

    setLoading(true);
    try {
      await api.products.adjustStock(product.id, parsedDelta, note);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Adjust Stock Level</h3>
              <p className="text-xs text-gray-500 font-mono">
                {product.sku} • {product.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs Projected Stock Preview */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">Current Stock</span>
              <div className="text-xl font-bold font-mono text-gray-900">{currentQty}</div>
            </div>

            <div className="flex flex-col items-center">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                parsedDelta > 0 ? 'bg-emerald-100 text-emerald-800' : parsedDelta < 0 ? 'bg-amber-100 text-amber-800' : 'text-gray-400'
              }`}>
                {parsedDelta > 0 ? `+${parsedDelta}` : parsedDelta}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 my-0.5" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">After</span>
              <div className={`text-xl font-bold font-mono ${
                resultingQty < 0 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {resultingQty}
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Quick adjust
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '+5', val: 5 },
                { label: '+10', val: 10 },
                { label: '+50', val: 50 },
                { label: '-1', val: -1 },
                { label: '-5', val: -5 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p.val)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    parsedDelta === p.val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Delta Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              required
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. +12 or -4"
              className="w-full text-xs font-mono rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Use positive to add, negative to remove.
            </span>
          </div>

          {/* Adjustment Reason / Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Restocked batch PO-4910 or damaged unit discard"
              className="w-full text-xs rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Action buttons */}
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
              disabled={loading || parsedDelta === 0 || resultingQty < 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Confirm Adjustment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
