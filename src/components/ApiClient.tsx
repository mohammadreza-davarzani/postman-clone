import { useEffect, useState } from "react";
import Modal, { ModalType } from "./Modal";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type TokenType = "none" | "bearer" | "apiKey" | "basic" | "oauth2";
type ApiKeyAddTo = "header" | "query";

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
}

interface EnvironmentOption {
  id: string;
  name: string;
  variables: Array<{ key: string; value: string }>;
}

export interface RequestTabData {
  id: string;
  name: string;
  collectionName?: string;
  method: HttpMethod;
  url: string;
  params: Array<{ key: string; value: string }>;
  headers: Array<{ key: string; value: string }>;
  body: string;
  response: ApiResponse | null;
}

interface ApiClientProps {
  selectedRequest?: {
    method: string;
    url: string;
    headers: Array<{ key: string; value: string }>;
    body: string;
  };
  selectedRequestName?: string;
  selectedCollectionName?: string;
  environmentVariables?: Record<string, string>;
  environments?: EnvironmentOption[];
  selectedEnvironmentId?: string | null;
  onSelectEnvironment?: (id: string | null) => void;
}

const PROXY_URL =
  (typeof window !== "undefined" &&
    (window as unknown as { __PROXY_URL?: string }).__PROXY_URL) ??
  (typeof import.meta.env?.VITE_PROXY_URL === "string"
    ? import.meta.env.VITE_PROXY_URL
    : "https://postwomanbackend.liara.run");

function replaceEnvVars(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function generateCurlCommand(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string,
): string {
  let curl = `curl --location --request ${method} '${url}'`;

  Object.entries(headers).forEach(([key, value]) => {
    if (key && value) {
      curl += ` \\\n  --header '${key}: ${value}'`;
    }
  });

  if (body && method !== "GET") {
    const escapedBody = body.replace(/'/g, "'\\''");
    curl += ` \\\n  --data-raw '${escapedBody}'`;
  }

  return curl;
}

const defaultHeaders: Array<{ key: string; value: string }> = [
  { key: "Content-Type", value: "application/json" },
];

function createNewTab(
  name: string,
  overrides?: Partial<RequestTabData>,
): RequestTabData {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    params: [],
    headers: [...defaultHeaders.map((h) => ({ ...h }))],
    body: "",
    response: null,
    ...overrides,
  };
}

export default function ApiClient({
  selectedRequest,
  selectedRequestName,
  selectedCollectionName,
  environmentVariables = {},
  environments = [],
  selectedEnvironmentId = null,
  onSelectEnvironment,
}: ApiClientProps) {
  const [tabs, setTabs] = useState<RequestTabData[]>(() => [
    createNewTab("New Request"),
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [requestSectionTab, setRequestSectionTab] = useState<
    "params" | "headers" | "body" | "token"
  >("headers");
  const [responseSectionTab, setResponseSectionTab] = useState<
    "response" | "code"
  >("response");
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message?: string;
    variant?: "danger" | "primary" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    onConfirm: () => {},
  });

  const showAlert = (
    title: string,
    message: string,
    variant: "danger" | "primary" | "warning" = "primary",
  ) => {
    setModalState({
      isOpen: true,
      type: "alert",
      title,
      message,
      variant,
      onConfirm: () => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const [tokenType, setTokenType] = useState<TokenType>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [apiKeyName, setApiKeyName] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyAddTo, setApiKeyAddTo] = useState<ApiKeyAddTo>("header");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [oauth2AccessToken, setOauth2AccessToken] = useState("");
  const [oauth2TokenUrl, setOauth2TokenUrl] = useState("");
  const [oauth2ClientId, setOauth2ClientId] = useState("");
  const [oauth2ClientSecret, setOauth2ClientSecret] = useState("");
  const [oauth2Loading, setOauth2Loading] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const method = activeTab?.method ?? "GET";
  const url = activeTab?.url ?? "";
  const params = activeTab?.params ?? [];
  const headers = activeTab?.headers ?? defaultHeaders;
  const body = activeTab?.body ?? "";
  const response = activeTab?.response ?? null;

  const setMethod = (m: HttpMethod) => updateActiveTab({ method: m });
  const setUrl = (u: string) => updateActiveTab({ url: u });
  const setParams = (p: Array<{ key: string; value: string }>) =>
    updateActiveTab({ params: p });
  const setHeaders = (h: Array<{ key: string; value: string }>) =>
    updateActiveTab({ headers: h });
  const setBody = (b: string) => updateActiveTab({ body: b });
  const setResponse = (r: ApiResponse | null) =>
    updateActiveTab({ response: r });

  function updateActiveTab(partial: Partial<RequestTabData>) {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...partial } : t)),
    );
  }

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  useEffect(() => {
    if (!selectedRequest) return;
    const name = selectedRequestName || "New Request";
    const existing = tabs.find(
      (t) => t.name === name && t.url === selectedRequest.url,
    );
    if (existing) {
      setActiveTabId(existing.id);
      if (selectedRequest.body && selectedRequest.method !== "GET")
        setRequestSectionTab("body");
      else setRequestSectionTab("headers");
      return;
    }
    const newTab = createNewTab(name, {
      collectionName: selectedCollectionName,
      method: selectedRequest.method as HttpMethod,
      url: selectedRequest.url,
      params: [],
      headers:
        selectedRequest.headers.length > 0
          ? selectedRequest.headers
          : defaultHeaders.map((h) => ({ ...h })),
      body: selectedRequest.body,
    });
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    if (selectedRequest.body && selectedRequest.method !== "GET")
      setRequestSectionTab("body");
    else setRequestSectionTab("headers");
  }, [selectedRequest, selectedRequestName, selectedCollectionName]);

  const addRequestTab = () => {
    const newTab = createNewTab("New Request");
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setRequestSectionTab("headers");
  };

  const closeRequestTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1 || tabs.length <= 1) return;
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      const newIdx = idx >= nextTabs.length ? nextTabs.length - 1 : idx;
      setActiveTabId(nextTabs[newIdx]?.id ?? nextTabs[0].id);
    } else if (tabs.findIndex((t) => t.id === activeTabId) > idx) {
    } else {
      setActiveTabId(activeTabId);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const addParam = () => {
    setParams([...params, { key: "", value: "" }]);
  };

  const updateParam = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const next = [...params];
    next[index] = { ...next[index], [field]: value };
    setParams(next);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const fetchOAuth2Token = async () => {
    if (!oauth2TokenUrl || !oauth2ClientId || !oauth2ClientSecret) {
      showAlert(
        "Missing Information",
        "Please fill in Token URL, Client ID and Client Secret.",
        "warning",
      );
      return;
    }
    setOauth2Loading(true);
    try {
      const form = new URLSearchParams();
      form.set("grant_type", "client_credentials");
      form.set("client_id", oauth2ClientId);
      form.set("client_secret", oauth2ClientSecret);
      const res = await fetch(oauth2TokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = await res.json().catch(() => ({}));
      const token = data.access_token;
      if (token) {
        setOauth2AccessToken(token);
      } else {
        showAlert(
          "Token Error",
          "Token not received. Response: " + JSON.stringify(data),
          "danger",
        );
      }
    } catch (e) {
      showAlert(
        "Error",
        "Error fetching token: " + (e instanceof Error ? e.message : String(e)),
        "danger",
      );
    } finally {
      setOauth2Loading(false);
    }
  };

  const buildRequestUrl = (): string => {
    const requestUrl = replaceEnvVars(url, environmentVariables);
    const [base, existingQuery] = requestUrl.split("?");
    const searchParams = new URLSearchParams(existingQuery ?? "");

    params
      .filter((p) => p.key.trim() !== "")
      .forEach((p) => searchParams.set(p.key.trim(), p.value));

    if (
      tokenType === "apiKey" &&
      apiKeyAddTo === "query" &&
      apiKeyName &&
      apiKeyValue
    ) {
      searchParams.set(apiKeyName, apiKeyValue);
    }
    const queryString = searchParams.toString();
    return queryString ? `${base}?${queryString}` : base;
  };

  const buildRequestHeaders = (): Record<string, string> => {
    const headersObj: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key && h.value) {
        headersObj[h.key] = replaceEnvVars(h.value, environmentVariables);
      }
    });

    if (tokenType === "bearer" && bearerToken) {
      headersObj["Authorization"] = `Bearer ${bearerToken}`;
    } else if (
      tokenType === "apiKey" &&
      apiKeyAddTo === "header" &&
      apiKeyName &&
      apiKeyValue
    ) {
      headersObj[apiKeyName] = apiKeyValue;
    } else if (tokenType === "basic" && (basicUsername || basicPassword)) {
      const encoded = btoa(
        unescape(encodeURIComponent(`${basicUsername}:${basicPassword}`)),
      );
      headersObj["Authorization"] = `Basic ${encoded}`;
    } else if (tokenType === "oauth2" && oauth2AccessToken) {
      headersObj["Authorization"] = `Bearer ${oauth2AccessToken}`;
    }

    return headersObj;
  };

  const buildRequestBody = (): string | undefined => {
    if (method === "GET" || !body) return undefined;

    const substitutedBody = replaceEnvVars(body, environmentVariables);
    const headersObj = buildRequestHeaders();
    const contentType =
      headersObj["Content-Type"] || headersObj["content-type"] || "";
    const isJsonContentType = contentType
      .toLowerCase()
      .includes("application/json");

    if (isJsonContentType) {
      try {
        return JSON.stringify(JSON.parse(substitutedBody));
      } catch {
        return substitutedBody;
      }
    }
    return substitutedBody;
  };

  const getCurrentCurl = (): string => {
    const requestUrl = buildRequestUrl();
    const headersObj = buildRequestHeaders();
    const requestBody = buildRequestBody();
    return generateCurlCommand(method, requestUrl, headersObj, requestBody);
  };

  const copyCurlToClipboard = () => {
    const curlCommand = getCurrentCurl();
    navigator.clipboard.writeText(curlCommand).then(() => {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    });
  };

  const sendRequest = async () => {
    setLoading(true);
    setResponseSectionTab("response");
    const startTime = Date.now();

    try {
      const headersObj = buildRequestHeaders();
      const requestUrl = buildRequestUrl();
      const requestBody = buildRequestBody();

      const proxyRes = await fetch(`${PROXY_URL}/api/proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          url: requestUrl,
          headers: headersObj,
          body: requestBody ?? null,
        }),
      });

      const proxyData = await proxyRes.json().catch(async () => ({
        status: 0,
        statusText: "Error",
        headers: {} as Record<string, string>,
        data: {
          error:
            "Proxy response was not JSON. Is the proxy server running at " +
            PROXY_URL +
            "?",
        },
      }));

      const status = proxyData.status ?? proxyRes.status;
      const statusText = proxyData.statusText ?? proxyRes.statusText;
      const responseHeaders: Record<string, string> = proxyData.headers ?? {};
      const data = proxyData.data;

      setResponse({
        status,
        statusText,
        headers: responseHeaders,
        data,
        time: Date.now() - startTime,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setResponse({
        status: 0,
        statusText: "Error",
        headers: {},
        data: { error: errorMessage },
        time: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50/50">
      <div className="border-b border-gray-200/80 bg-white px-4 py-2.5 flex items-center gap-2 min-h-[44px]">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => e.key === "Enter" && setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 shrink-0 transition-all ${
                activeTabId === tab.id
                  ? "border-orange-500 bg-orange-50/80 text-orange-700 font-medium"
                  : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <svg
                className="h-4 w-4 text-gray-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm truncate max-w-[140px]">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => closeRequestTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200/80 text-gray-500 hover:text-red-600 transition-all"
                  title="Close tab"
                  aria-label="Close tab"
                >
                  <svg
                    className="h-3.5 w-3.5"
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
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRequestTab}
            className="p-2 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors shrink-0"
            title="New request tab"
            aria-label="New request tab"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        {onSelectEnvironment && environments.length > 0 && (
          <select
            value={selectedEnvironmentId ?? ""}
            onChange={(e) =>
              onSelectEnvironment(e.target.value ? e.target.value : null)
            }
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all min-w-[140px] shrink-0"
            title="Environment"
          >
            <option value="">No environment</option>
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {(activeTab?.collectionName || activeTab?.name) && (
        <div className="px-6 py-2 border-b border-gray-200/80 bg-white">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-400">›</span>
            {activeTab.collectionName && (
              <>
                <span className="text-gray-800 font-medium">
                  {activeTab.collectionName}
                </span>
                <span className="text-gray-400">›</span>
              </>
            )}
            <span className="text-gray-800 font-medium">{activeTab.name}</span>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200/80 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white transition-all placeholder:text-gray-400"
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium shadow-sm hover:bg-orange-600 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200/80 bg-white px-6 py-4 shadow-sm">
        <div className="flex gap-1 border-b border-gray-200 -mb-4">
          {[
            "params",
            "headers",
            "token",
            ...(method !== "GET" ? ["body"] : []),
          ].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setRequestSectionTab(tab as typeof requestSectionTab)
              }
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                requestSectionTab === tab
                  ? "text-orange-500 bg-orange-50/80 border-b-2 border-orange-500 -mb-px"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {requestSectionTab === "headers" && (
            <div className="space-y-3 mt-5">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) =>
                      updateHeader(index, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
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
              ))}
              <button
                onClick={addHeader}
                className="mt-2 px-3 py-2 text-sm text-orange-500 hover:text-orange-600 hover:bg-orange-50 font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span className="text-base">+</span> Add Header
              </button>
            </div>
          )}

          {requestSectionTab === "body" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full h-40 px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white resize-none"
            />
          )}

          {requestSectionTab === "params" && (
            <div className="space-y-5 mt-6">
              <p className="text-xs text-gray-500 mb-1">
                Query parameters are appended to the request URL.
              </p>
              {params.map((param, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateParam(index, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) =>
                      updateParam(index, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeParam(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove parameter"
                  >
                    <svg
                      className="h-4 w-4"
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
              ))}
              <button
                type="button"
                onClick={addParam}
                className="mt-2 px-3 py-2 text-sm text-orange-500 hover:text-orange-600 hover:bg-orange-50 font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span className="text-base">+</span> Add Parameter
              </button>
            </div>
          )}

          {requestSectionTab === "token" && (
            <div className="space-y-4 mt-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token / Auth Type
                </label>
                <select
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value as TokenType)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apiKey">API Key</option>
                  <option value="basic">Basic Auth</option>
                  <option value="oauth2">OAuth 2.0</option>
                </select>
              </div>

              {tokenType === "bearer" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Token
                  </label>
                  <input
                    type="password"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="Enter your token"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Sent as Authorization: Bearer &lt;token&gt; in header
                  </p>
                </div>
              )}

              {tokenType === "apiKey" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key name
                    </label>
                    <input
                      type="text"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      placeholder="e.g. X-API-Key"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="password"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      placeholder="API Key value"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add to
                    </label>
                    <select
                      value={apiKeyAddTo}
                      onChange={(e) =>
                        setApiKeyAddTo(e.target.value as ApiKeyAddTo)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Parameter</option>
                    </select>
                  </div>
                </div>
              )}

              {tokenType === "basic" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={basicUsername}
                      onChange={(e) => setBasicUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={basicPassword}
                      onChange={(e) => setBasicPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Sent as Base64 in Authorization header
                  </p>
                </div>
              )}

              {tokenType === "oauth2" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={oauth2AccessToken}
                      onChange={(e) => setOauth2AccessToken(e.target.value)}
                      placeholder="Access token"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sent as Bearer in Authorization header
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Get token (Client Credentials)
                    </p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={oauth2TokenUrl}
                        onChange={(e) => setOauth2TokenUrl(e.target.value)}
                        placeholder="Token URL"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                      />
                      <input
                        type="text"
                        value={oauth2ClientId}
                        onChange={(e) => setOauth2ClientId(e.target.value)}
                        placeholder="Client ID"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                      />
                      <input
                        type="password"
                        value={oauth2ClientSecret}
                        onChange={(e) => setOauth2ClientSecret(e.target.value)}
                        placeholder="Client Secret"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                      />
                      <button
                        type="button"
                        onClick={fetchOAuth2Token}
                        disabled={
                          oauth2Loading ||
                          !oauth2TokenUrl ||
                          !oauth2ClientId ||
                          !oauth2ClientSecret
                        }
                        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {oauth2Loading ? "Fetching..." : "Get token"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100/50">
        <div className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex gap-1">
            <button
              onClick={() => setResponseSectionTab("response")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                responseSectionTab === "response"
                  ? "text-orange-500 bg-orange-50/80 border-b-2 border-orange-500 -mb-px"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              Response
            </button>
            <button
              onClick={() => setResponseSectionTab("code")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                responseSectionTab === "code"
                  ? "text-orange-500 bg-orange-50/80 border-b-2 border-orange-500 -mb-px"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              Code
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {responseSectionTab === "response" ? (
            response ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${
                      response.status >= 200 && response.status < 300
                        ? "bg-green-100 text-green-700"
                        : response.status >= 400
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    {response.time}ms
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Headers
                  </h3>
                  <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                    <pre className="text-xs text-gray-700 overflow-x-auto font-mono">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Body
                  </h3>
                  <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                    <pre className="text-xs text-gray-700 overflow-x-auto font-mono">
                      {typeof response.data === "object" &&
                      response.data !== null
                        ? JSON.stringify(response.data, null, 2)
                        : typeof response.data === "string"
                          ? response.data
                          : String(response.data ?? "")}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center px-6 py-10 bg-white/60 rounded-2xl border border-dashed border-gray-200 max-w-sm">
                  <svg
                    className="mx-auto h-14 w-14 mb-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">
                    Send a request to see the response here
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  cURL Command
                </h3>
                <button
                  onClick={copyCurlToClipboard}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  {copiedCurl ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
                <pre className="text-sm text-green-400 overflow-x-auto font-mono whitespace-pre-wrap break-all">
                  {getCurrentCurl()}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This command can be run in a terminal to make the same request.
                Make sure curl is installed on your system.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        onConfirm={modalState.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}
