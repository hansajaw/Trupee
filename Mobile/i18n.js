// i18n.js (at project root)
import { I18n } from "i18n-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./app/locals/en.json";
import si from "./app/locals/si.json";

const i18n = new I18n({ en, si });
i18n.defaultLocale = "en";
i18n.locale = "en";
i18n.enableFallback = true;

const LANG_KEY = "APP_LANG";

// simple event system so UI can re-render on language change
const listeners = new Set();
export const onLangChange = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
const notify = (lang) => listeners.forEach(fn => { try { fn(lang); } catch {} });

export const initLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved) i18n.locale = saved;
  } catch {}
  return i18n.locale;
};

export const setAppLanguage = async (lang) => {
  i18n.locale = lang;
  try { await AsyncStorage.setItem(LANG_KEY, lang); } catch {}
  notify(lang);
};

export default i18n;
