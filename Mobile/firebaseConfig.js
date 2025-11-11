import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Your Firebase config (keep as-is)
const firebaseConfig = {
  apiKey: "AIzaSyAP9pz6FvsGQuWiqlXOc-BmiJMDFZvcqu8",
  authDomain: "trupee-aec2a.firebaseapp.com",
  projectId: "trupee-aec2a",
  storageBucket: "trupee-aec2a.firebasestorage.app",
  messagingSenderId: "302052913141",
  appId: "1:302052913141:web:f0f75bce6658608965babc",
  measurementId: "G-LQT9Y0YGQL",
};

// ✅ Initialize the Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistence (for React Native)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { app, auth };
