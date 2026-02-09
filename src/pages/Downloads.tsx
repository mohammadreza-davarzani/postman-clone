import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { detectOS, platformLabels, type Platform } from '../utils/detectOS';

const DOWNLOAD_BASE = import.meta.env.VITE_DOWNLOAD_PAGE;
const HAS_RELEASES = !!DOWNLOAD_BASE;

const platforms: { key: NonNullable<Platform>; icon: string; desc: string }[] = [
  { key: 'win', icon: '🪟', desc: 'Windows' },
  { key: 'mac', icon: '🍎', desc: 'macOS (Intel & Apple Silicon)' },
  { key: 'linux', icon: '🐧', desc: 'Linux (AppImage)' },
];

export default function Downloads() {
  const userOS = detectOS();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">دانلود اپ دسکتاپ</h1>
          <p className="mt-4 text-lg text-gray-600">
            Postman Clone را روی سیستم خود نصب کنید و تجربه بهتری داشته باشید.
          </p>
        </div>

        {!HAS_RELEASES && (
          <div className="mt-8 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-6 text-center">
            <p className="font-medium text-orange-800">ریلیز هنوز انتشار نیافته</p>
            <p className="mt-2 text-sm text-orange-700">
              برای بیلد و انتشار، فایل <code className="rounded bg-orange-100 px-1">RELEASE_GUIDE.md</code> را در پروژه بخوانید.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              بعد از انتشار، <code className="rounded bg-gray-100 px-1">VITE_DOWNLOAD_PAGE</code> را در env تنظیم کنید.
            </p>
          </div>
        )}

        <div className="mt-12 space-y-4">
          {platforms.map(({ key, icon, desc }) => {
            const isUserPlatform = userOS === key;
            return (
              <a
                key={key}
                href={DOWNLOAD_BASE || '#'}
                target={HAS_RELEASES ? '_blank' : undefined}
                rel={HAS_RELEASES ? 'noopener noreferrer' : undefined}
                className={`flex items-center justify-between rounded-xl border-2 p-6 transition-all ${
                  HAS_RELEASES
                    ? `hover:border-orange-500 hover:bg-orange-50 ${isUserPlatform ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`
                    : 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                }`}
                style={!HAS_RELEASES ? { pointerEvents: 'none' } : undefined}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{platformLabels[key]}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isUserPlatform && HAS_RELEASES && (
                    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white">
                      سیستم شما
                    </span>
                  )}
                  <span className="text-orange-500">{HAS_RELEASES ? 'دانلود →' : '—'}</span>
                </div>
              </a>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          نسخه وب را ترجیح می‌دهید؟{' '}
          <Link to="/" className="font-medium text-orange-500 hover:text-orange-600">
            بازگشت به صفحه اصلی
          </Link>
        </p>
      </main>
    </div>
  );
}
