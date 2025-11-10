// Mobile/config.js
import { Platform } from "react-native";

const DEV_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

// ✅ Automatically switch between local dev and production backend
export const BASE_URL = __DEV__
  ? DEV_BASE
  : "https://trupee.vercel.app";
