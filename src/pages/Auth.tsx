import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          navigate('/client');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const result = await register(email, password, name);
        if (result.success) {
          navigate('/client');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Postman Clone</h1>
          <p className="text-gray-600">API Testing Tool</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                  className="text-orange-600 font-medium hover:text-orange-700"
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className="text-orange-600 font-medium hover:text-orange-700"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Built with React + .NET
        </p>
      </div>
    </div>
  );
}
