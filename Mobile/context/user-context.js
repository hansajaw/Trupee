import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserCtx = createContext(null);

const TOKEN_KEY = "authToken";
const USER_KEY  = "authUser";

export function UserProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save helpers
  const setAuth = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(TOKEN_KEY, nextToken || "");
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser || {}));
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  };

  const updateUser = async (patch) => {
    const merged = { ...(user || {}), ...(patch || {}) };
    setUser(merged);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged));
    return merged;
  };

  const value = useMemo(() => ({
    token, user, loading,
    setAuth, updateUser, signOut,
  }), [token, user, loading]);

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export const useUser = () => useContext(UserCtx);
