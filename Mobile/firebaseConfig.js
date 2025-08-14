import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAP9pz6FvsGQuWiqlXOc-BmiJMDFZvcqu8",
  authDomain: "trupee-aec2a.firebaseapp.com",
  projectId: "trupee-aec2a",
  storageBucket: "trupee-aec2a.firebasestorage.app",
  messagingSenderId: "302052913141",
  appId: "1:302052913141:web:f0f75bce6658608965babc",
  measurementId: "G-LQT9Y0YGQL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
