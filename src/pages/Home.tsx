import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Where the world builds APIs
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Unify API design, testing, documentation, and monitoring on one platform
              that integrates with the rest of your stack.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/auth"
                className="rounded-md bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/try"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-orange-500 transition-colors"
              >
                Try API Call <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-orange-500">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Complete API platform
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Design, test, document, and monitor APIs all in one place.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-500">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Design APIs
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Define APIs collaboratively with built-in support for standards like OpenAPI and GraphQL.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-500">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  Test & Automate
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Automate functional, integration, and regression testing across your API ecosystem.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-500">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Monitor & Observe
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Track every endpoint and validate performance across your API ecosystem.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-orange-500">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-orange-50">
              Start building and testing APIs today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/auth"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-orange-500 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Get started for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/downloads" className="hover:text-orange-500 transition-colors">Download App</Link></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>© 2026 Postman Clone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
