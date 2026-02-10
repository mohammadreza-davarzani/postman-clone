import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  email: string;
  name: string;
  userId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROXY_URL =
  (typeof window !== "undefined" &&
    (window as { __PROXY_URL?: string }).__PROXY_URL) ??
  (typeof import.meta.env?.VITE_PROXY_URL === "string"
    ? import.meta.env.VITE_PROXY_URL
    : "https://postwomanbackend.liara.run");

const AUTH_TOKEN_KEY = "auth-token";
const AUTH_REFRESH_KEY = "auth-refresh-token";

function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_KEY);
}

function saveAuthTokens(token: string, refreshToken: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
}

export async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${PROXY_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    saveAuthTokens(data.token, data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
}

export { clearAuthStorage, saveAuthTokens, AUTH_TOKEN_KEY, AUTH_REFRESH_KEY };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedRefresh = localStorage.getItem(AUTH_REFRESH_KEY);

    if (!savedToken && !savedRefresh) {
      setIsLoading(false);
      return;
    }

    if (savedToken) {
      setToken(savedToken);
      restoreSession(savedToken);
    } else if (savedRefresh) {
      tryRefreshAndRestore();
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const onAuthLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth-logout", onAuthLogout);
    return () => window.removeEventListener("auth-logout", onAuthLogout);
  }, []);

  const restoreSession = async (authToken: string) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setToken(authToken);
        setIsLoading(false);
        return;
      }

      if (response.status === 401) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          setToken(newToken);
          const meRes = await fetch(`${PROXY_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          if (meRes.ok) {
            const data = await meRes.json();
            setUser(data);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error restoring session:", error);
    }

    clearAuthStorage();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const tryRefreshAndRestore = async () => {
    const newToken = await refreshAuthToken();
    if (newToken) {
      setToken(newToken);
      try {
        const meRes = await fetch(`${PROXY_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data);
        }
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      }
    } else {
      clearAuthStorage();
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser({
          email: data.email,
          name: data.name,
          userId: data.userId || "",
        });
        if (data.refreshToken) {
          saveAuthTokens(data.token, data.refreshToken);
        } else {
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }
        return { success: true };
      } else {
        const error = await response
          .json()
          .catch(() => ({ error: "Login failed" }));
        return {
          success: false,
          error: error.error || "Invalid email or password",
        };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser({
          email: data.email,
          name: data.name,
          userId: data.userId || "",
        });
        if (data.refreshToken) {
          saveAuthTokens(data.token, data.refreshToken);
        } else {
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }
        return { success: true };
      } else {
        const error = await response
          .json()
          .catch(() => ({ error: "Registration failed" }));
        return { success: false, error: error.error || "Registration failed" };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
