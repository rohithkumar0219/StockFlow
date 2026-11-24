import React, { useState, useEffect } from 'react';
import { api, tokenStorage, userStorage } from './api';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import SettingsView from './components/SettingsView';
import ProductModal from './components/ProductModal';
import AdjustStockModal from './components/AdjustStockModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function App() {
  const [user, setUser] = useState(() => userStorage.get());
  const [token, setToken] = useState(() => tokenStorage.get());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'settings'
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Verify session on mount
  useEffect(() => {
    if (token) {
      api.auth.me()
        .then((userData) => {
          setUser(userData);
          userStorage.set(userData);
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  const handleAuthSuccess = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setActiveTab('dashboard');
    triggerRefresh();
  };

  const handleLogout = () => {
    tokenStorage.clear();
    userStorage.clear();
    setUser(null);
    setToken(null);
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Modal Handlers
  const openAddProductModal = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const openAdjustStockModal = (product) => {
    setProductToAdjust(product);
    setIsAdjustModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    try {
      await api.products.delete(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      triggerRefresh();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // If unauthenticated, show Auth screen
  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col text-gray-900">
      
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAddModal={openAddProductModal}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            onNavigateProducts={() => setActiveTab('products')}
            onOpenAddModal={openAddProductModal}
            onOpenAdjustModal={openAdjustStockModal}
            refreshTrigger={refreshKey}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            user={user}
            onOpenAddModal={openAddProductModal}
            onOpenEditModal={openEditProductModal}
            onOpenAdjustModal={openAdjustStockModal}
            onOpenDeleteModal={openDeleteModal}
            refreshTrigger={refreshKey}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            onOrgUpdated={(updatedOrg) => {
              setUser((prev) => ({ ...prev, organization: updatedOrg }));
              triggerRefresh();
            }}
          />
        )}
      </main>

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        defaultOrgThreshold={user?.organization?.default_low_stock_threshold ?? 5}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      {/* Inline Quick Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        product={productToAdjust}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      {/* Confirm Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        product={productToDelete}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

    </div>
  );
}
