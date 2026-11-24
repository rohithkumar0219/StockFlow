import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Boxes, 
  Layers, 
  AlertTriangle, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Database
} from 'lucide-react';

export default function DashboardView({ 
  user, 
  onNavigateProducts, 
  onOpenAddModal, 
  onOpenAdjustModal,
  refreshTrigger 
}) {
  const [stats, setStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, lowStockData] = await Promise.all([
        api.dashboard.stats(),
        api.dashboard.lowStock()
      ]);
      setStats(statsData);
      setLowStockItems(lowStockData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const res = await api.demo.seed();
      setFeedbackMsg(res.message || 'Sample products seeded successfully!');
      await loadDashboardData();
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
            <span className="uppercase tracking-wider">Overview</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">{user?.organization?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Inventory Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Overview of your current inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats?.total_products === 0 && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>{seeding ? 'Adding...' : 'Add Sample Data'}</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium shadow-2xs transition-colors"
            title="Refresh"
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

      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total SKUs */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Products</span>
            <Boxes className="w-4 h-4 text-gray-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-gray-900">
              {stats ? stats.total_products : '—'}
            </span>
            <span className="text-xs text-gray-500">products</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span className="text-emerald-600 font-medium">{stats?.healthy_stock_count || 0} healthy</span>
            <button 
              onClick={onNavigateProducts}
              className="text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Total Units On Hand */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Units On Hand</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-gray-900">
              {stats ? stats.total_units.toLocaleString() : '—'}
            </span>
            <span className="text-xs text-gray-500">total units</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>All products</span>
            <span className="font-mono text-gray-400"></span>
          </div>
        </div>

        {/* KPI 3: Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Inventory Value</span>
            <IndianRupee className="w-4 h-4 text-gray-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-gray-900">
              ₹{stats ? stats.total_retail_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-xs text-gray-500">retail</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>Cost Basis:</span>
            <span className="font-mono font-semibold text-gray-700">
              ₹{stats ? stats.total_cost_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>

        {/* KPI 4: Low Stock Alerts */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-colors ${
          (stats?.low_stock_count || 0) > 0
            ? 'bg-red-50/60 border-red-200 text-red-950'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-medium uppercase tracking-wider ${
              (stats?.low_stock_count || 0) > 0 ? 'text-red-700 font-semibold' : 'text-gray-500'
            }`}>
              Low Stock Alerts
            </span>
            <AlertTriangle className={`w-4 h-4 ${
              (stats?.low_stock_count || 0) > 0 ? 'text-red-600 animate-bounce' : 'text-gray-400'
            }`} />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono tracking-tight ${
              (stats?.low_stock_count || 0) > 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {stats ? stats.low_stock_count : '—'}
            </span>
            <span className="text-xs text-gray-500">items below threshold</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            {(stats?.low_stock_count || 0) > 0 ? (
              <span className="text-red-600 font-semibold">Needs attention</span>
            ) : (
              <span className="text-emerald-600 font-medium">All good</span>
            )}
            <span className="font-mono text-gray-400 text-[11px]">
              Default Thresh: {user?.organization?.default_low_stock_threshold ?? 5}
            </span>
          </div>
        </div>

      </div>

      {/* Critical Stock Alert Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <h2 className="text-base font-semibold text-gray-900">
                Low Stock Items
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-100 text-red-700">
                {lowStockItems.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Products running low on stock.
            </p>
          </div>

          <button
            onClick={onNavigateProducts}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>View all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No Low-Stock Alerts</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              All products are above their low stock thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase font-mono text-[11px] tracking-wider">
                  <th className="py-3 px-5">Product Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Threshold</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                    
                    {/* Name */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-400">ID: #{item.id}</div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 text-[11px] font-medium">
                        {item.sku}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-mono font-bold text-xs">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>{item.quantity} units</span>
                      </span>
                    </td>

                    {/* Threshold */}
                    <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                      ≤ {item.low_stock_threshold}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4 text-right font-mono text-gray-900 font-medium">
                      {item.selling_price ? `₹${Number(item.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>

                    {/* Quick Restock Action */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onOpenAdjustModal(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
