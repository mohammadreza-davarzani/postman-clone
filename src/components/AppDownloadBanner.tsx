import { useEffect, useState } from "react";
import { detectOS, platformLabels, type Platform } from "../utils/detectOS";

const DISMISS_KEY = "postman-clone-download-dismissed";

const RELEASE_TAG = import.meta.env.VITE_RELEASE_TAG || "v0.1.0";
const VERSION = RELEASE_TAG.replace(/^v/, "");
const RELEASE_BASE = `https://github.com/mohammadreza-davarzani/postman-clone/releases/download/${RELEASE_TAG}`;

const DOWNLOAD_URLS = {
  mac:
    import.meta.env.VITE_DOWNLOAD_URL_MAC ||
    `${RELEASE_BASE}/Postman.Clone-${VERSION}-arm64.dmg`,
  win:
    import.meta.env.VITE_DOWNLOAD_URL_WIN ||
    `${RELEASE_BASE}/Postman.Clone.Setup.${VERSION}.exe`,
  linux:
    import.meta.env.VITE_DOWNLOAD_URL_LINUX ||
    `${RELEASE_BASE}/Postman.Clone-${VERSION}.AppImage`,
};

export default function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "electronAPI" in window &&
      (window as Window & { electronAPI?: unknown }).electronAPI
    )
      return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const os = detectOS();
    setPlatform(os);
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsVisible(false);
  };

  const handleDownload = (key: "mac" | "win" | "linux") => {
    const url = DOWNLOAD_URLS[key];
    if (url) {
      window.location.href = url;
    }
    setShowModal(false);
  };

  if (!isVisible || !platform) return null;

  const label = platformLabels[platform];
  const hasAnyDownload =
    DOWNLOAD_URLS.mac || DOWNLOAD_URLS.win || DOWNLOAD_URLS.linux;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-orange-600 px-4 py-3 text-white shadow-lg sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden shrink-0 sm:flex">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold">Get the desktop app</p>
            <p className="text-sm text-orange-100">
              Better experience on {label}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50"
          >
            Download
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-2 text-orange-200 transition-colors hover:bg-orange-500 hover:text-white"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {showModal && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[61] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Which version?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose your platform to download
            </p>
            <div className="mt-4 space-y-2">
              {(["mac", "win", "linux"] as const).map((key) => {
                const url = DOWNLOAD_URLS[key];
                const available = !!url;
                return (
                  <button
                    key={key}
                    onClick={() => handleDownload(key)}
                    disabled={!available}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      available
                        ? "border-gray-200 hover:border-orange-500 hover:bg-orange-50"
                        : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                    }`}
                  >
                    <span className="text-2xl">
                      {key === "mac" ? "🍎" : key === "win" ? "🪟" : "🐧"}
                    </span>
                    <span className="font-medium text-gray-900">
                      {platformLabels[key]}
                    </span>
                    {available ? (
                      <span className="ml-auto text-sm text-orange-500">
                        Download
                      </span>
                    ) : (
                      <span className="ml-auto text-sm text-gray-400">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {!hasAnyDownload && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Releases coming soon
              </p>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}
