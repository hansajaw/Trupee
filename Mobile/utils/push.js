import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

export async function getExpoPushTokenSafely() {
  try {
    if (!Device.isDevice) return null;

    const inExpoGoAndroid =
      Platform.OS === "android" && Constants.appOwnership === "expo";
    if (inExpoGoAndroid) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token?.data ?? null;
  } catch (e) {
    console.log("[push] getExpoPushTokenAsync failed:", e?.message);
    return null;
  }
}
