import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Building2, 
  Sliders, 
  Check, 
  AlertCircle
} from 'lucide-react';

export default function SettingsView({ user, onOrgUpdated }) {
  const [defaultThreshold, setDefaultThreshold] = useState(5);
  const [orgName, setOrgName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.organization) {
      setDefaultThreshold(user.organization.default_low_stock_threshold ?? 5);
      setOrgName(user.organization.name || '');
      setCurrency(user.organization.currency || 'INR');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSavedSuccess(false);

    const thresh = parseInt(defaultThreshold, 10);
    if (isNaN(thresh) || thresh < 0) {
      setError('Threshold must be a non-negative integer.');
      return;
    }

    setLoading(true);
    try {
      const updatedOrg = await api.settings.update({
        name: orgName.trim() || undefined,
        default_low_stock_threshold: thresh,
        currency: currency.trim() || undefined,
      });
      setSavedSuccess(true);
      if (onOrgUpdated) {
        onOrgUpdated(updatedOrg);
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
          <span className="uppercase tracking-wider">Settings</span>
          <span>/</span>
          <span className="text-blue-600 font-semibold">{user?.organization?.slug}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Organization Settings
        </h1>
        <p className="text-xs text-gray-500">
          Manage your organization settings.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Inventory Defaults (FR-7) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">Low Stock Threshold</h2>
              <p className="text-xs text-gray-500">Default threshold for low stock alerts</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Default Low Stock Threshold (Units) *
            </label>
            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                required
                value={defaultThreshold}
                onChange={(e) => setDefaultThreshold(e.target.value)}
                className="w-full text-xs font-mono font-medium rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Products without a custom threshold will use this default ({defaultThreshold} units).
            </p>
          </div>
        </div>

        {/* Card 2: Organization Profile */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">Organization Profile</h2>
              <p className="text-xs text-gray-500">Your organization details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organization Display Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Currency Code
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full text-xs font-mono rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-mono">Org ID</span>
              <span className="font-mono font-semibold text-gray-800">#{user?.organization?.id}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-mono">Slug</span>
              <span className="font-mono font-semibold text-gray-800">{user?.organization?.slug}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-mono">Owner Email</span>
              <span className="text-gray-800 truncate block font-mono">{user?.email}</span>
            </div>

          </div>
        </div>



        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>

      </form>

    </div>
  );
}
