import React, { useState } from 'react';
import { api, tokenStorage, userStorage } from '../api';
import { Boxes, Lock, Mail, Building2, User, ArrowRight } from 'lucide-react';

export default function AuthView({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');

  const fillDemoCredentials = () => {
    setIsLogin(true);
    setEmail('alex@apexhardware.com');
    setPassword('demo12345');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.auth.login({ email, password });
      } else {
        if (!orgName.trim()) {
          throw new Error('Organization name is required.');
        }
        res = await api.auth.signup({
          email,
          password,
          org_name: orgName.trim(),
          full_name: fullName.trim() || undefined,
        });
      }

      tokenStorage.set(res.access_token);
      userStorage.set(res.user);
      onAuthSuccess(res.user, res.access_token);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Logo and Brand Header */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">StockFlow</span>
            <span className="text-xs uppercase font-mono tracking-widest text-blue-600 font-semibold">Inventory</span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-gray-900">
          {isLogin ? 'Sign in to your organization' : 'Create your inventory workspace'}
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          Manage your inventory in one place
        </p>

        {/* Demo Preset Card */}
        <div className="mt-4 bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-600 text-white">
              Demo
            </span>
            <span className="text-xs font-medium text-blue-950 truncate max-w-[200px]">
              Apex Hardware Inc.
            </span>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-blue-100/60 text-blue-700 text-xs font-semibold shadow-2xs border border-blue-200 transition-colors shrink-0"
          >
            <span>Fill Demo</span>
          </button>
        </div>

      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-2xl sm:px-10">

          {/* Tab Selector */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Organization Name (Signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Organization / Store Name *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Hardware Co."
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Full Name (Signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Your Full Name
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Work Email *
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@apexhardware.com"
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!isLogin && (
                <span className="text-[10px] text-gray-500 mt-1 block">Minimum 6 characters</span>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>



        </div>
      </div>
    </div>
  );
}
