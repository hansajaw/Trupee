// context/auth-context.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔄 Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("authToken");
        const u = await AsyncStorage.getItem("authUser");
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u));
      } catch (e) {
        console.error("Failed to restore session:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // 🟢 Sign In
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      if (!data.user?.isVerified) {
        throw new Error("Please verify your email before logging in.");
      }

      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("authUser", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Sign Up
  const signUp = async (userName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signup failed");

      // ✅ Registration sends a verification email — user cannot log in until verified
      return {
        ok: true,
        message:
          data?.message || "Account created. Please verify your email before logging in.",
      };
    } catch (e) {
      setError(e.message);
      return { ok: false, message: e.message };
    } finally {
      setLoading(false);
    }
  };

  // 🟡 Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      await AsyncStorage.multiRemove(["authToken", "authUser"]);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error("Signout failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Context value
  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      loading,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [token, user, ready, loading, error]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// 🔹 Custom Hook
export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
