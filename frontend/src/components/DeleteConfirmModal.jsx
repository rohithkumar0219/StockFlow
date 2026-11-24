import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  loading = false,
}) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-gray-900 text-center">
            Delete Product?
          </h3>

          <p className="text-xs text-gray-500 text-center mt-2">
            Are you sure you want to permanently delete <span className="font-semibold text-gray-800 font-mono">{product.sku}</span> ({product.name})?
            This action cannot be undone.
          </p>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            <div className="flex justify-between">
              <span>Quantity on Hand:</span>
              <span className="font-mono font-bold">{product.quantity} units</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
