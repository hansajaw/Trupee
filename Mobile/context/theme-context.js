import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "PREFERS_DARK";

const base = {
  brand: "green",
  primary: "#16A34A",      
  primary500: "#22C55E",    
  primary600: "#16A34A",     
  primary700: "#15803D",     
  primary800: "#166534",    

  primaryLight: "rgba(34,197,94,0.28)", 
  primarySoft:  "rgba(34,197,94,0.12)",

  success: "#22C55E",
  error:   "#EF4444",
  warning: "#F59E0B",
  info:    "#2DD4BF",

  gradientPrimary: ["#34D399", "#10B981", "#059669"],
};

const light = {
  background: "#F6F8FB",
  backgroundSecondary: "#EEF2F7",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  textDark: "#0F172A",
  textSecondary: "#6B7280",
  placeholderText: "rgba(15,23,42,0.45)",
  border: "rgba(15,23,42,0.08)",

  overlay: "rgba(0,0,0,0.35)",
  shadow: "rgba(0,0,0,0.15)",

  inputBackground: "#F3F6FA",
};

const dark = {
  background: "#0A0F1A",
  backgroundSecondary: "#0F172A",
  surface: "#121827",
  surfaceElevated: "#1A2337",

  textDark: "#E5E7EB",
  textSecondary: "#94A3B8",
  placeholderText: "rgba(229,231,235,0.5)",
  border: "rgba(148,163,184,0.18)",

  overlay: "rgba(0,0,0,0.6)",
  shadow: "rgba(0,0,0,0.6)",

  inputBackground: "#0F172A",
};

const ThemeContext = createContext({
  isDark: false,
  setIsDark: (_v) => {},
  theme: { ...base, ...light, white: "#FFFFFF" },
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          setIsDark(saved === "1");
        } else {
          setIsDark(Appearance.getColorScheme() === "dark");
        }
      } catch {}
    })();
  }, []);

  const setIsDarkAndPersist = async (val) => {
    setIsDark(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, val ? "1" : "0");
    } catch {}
  };

  const theme = useMemo(() => {
    const palette = isDark ? dark : light;
    return {
      ...base,
      ...palette,

      white: palette.surface,
    };
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark: setIsDarkAndPersist, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
