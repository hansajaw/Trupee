import { Platform } from "react-native";

const DEV_BASE =
  Platform.OS === "android" ? "http://172.20.10.6:3000" : "http://localhost:3000";


export const BASE_URL = __DEV__ ? DEV_BASE : "https://trupee-production.up.railway.app";
