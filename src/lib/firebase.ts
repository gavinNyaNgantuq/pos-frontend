import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";

// Firebase Web SDK untuk Google Login.
// Kredensial 100% dari environment (Vite), tidak di-hardcode.
// Jika env belum diisi, getFirebaseAuth() mengembalikan null
// dan Login menampilkan pesan konfigurasi yang jelas.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(
      initializeApp(firebaseConfig)
    );
  }

  return cachedAuth;
}
