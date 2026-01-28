import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500">
            <span className="text-lg font-bold text-white">P</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Postman Clone</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
            Product
          </a>
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
            Explore
          </a>
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
            Solutions
          </a>
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
            Resources
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-gray-700 hover:text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-4 space-y-3">
            <a href="#" className="block text-sm font-medium text-gray-700 hover:text-orange-500">
              Product
            </a>
            <a href="#" className="block text-sm font-medium text-gray-700 hover:text-orange-500">
              Explore
            </a>
            <a href="#" className="block text-sm font-medium text-gray-700 hover:text-orange-500">
              Solutions
            </a>
            <a href="#" className="block text-sm font-medium text-gray-700 hover:text-orange-500">
              Resources
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
