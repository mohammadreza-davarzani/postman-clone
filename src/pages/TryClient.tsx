import { Link } from 'react-router-dom';
import ApiClient from '../components/ApiClient';

export default function TryClientPage() {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Minimal header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">Try API Call</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            No login required
          </span>
        </div>
        <Link
          to="/auth"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          Get Started
        </Link>
      </header>

      {/* ApiClient - request builder only, no collections */}
      <div className="flex-1 overflow-hidden">
        <ApiClient
          environmentVariables={{}}
          environments={[]}
          selectedEnvironmentId={null}
          onSelectEnvironment={() => {}}
        />
      </div>
    </div>
  );
}
