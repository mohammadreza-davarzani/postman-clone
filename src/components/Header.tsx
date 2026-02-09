import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500">
            <span className="text-lg font-bold text-white">P</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Postman Clone</span>
        </Link>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                to="/try"
                className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
              >
                Try API Call
              </Link>
              <Link
                to="/auth"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
              >
                Get Started
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
