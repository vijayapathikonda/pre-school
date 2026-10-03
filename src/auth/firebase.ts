import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getTeacherProfile, TeacherProfile } from './teacherWhitelist';
import { fetchTeacherProfileFromTurso } from '../db/tursoClient';

const env = (import.meta as any).env || {};

export const GOOGLE_CLIENT_ID = "862077392244-65gpbqt97e1kc4arc75h8q3pg2bkkn6c.apps.googleusercontent.com";

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBFtsqhCq4Cy4ZnAFFUSkJ9X8RWttxUv64",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "pragati-preschool.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "pragati-preschool",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "pragati-preschool.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "862077392244",
  appId: env.VITE_FIREBASE_APP_ID || "1:862077392244:web:ff5aa313e7ef0533df4821",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize GoogleAuth on native platforms safely
if (Capacitor.isNativePlatform()) {
  try {
    GoogleAuth.initialize({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  } catch (err) {
    console.warn('Native GoogleAuth initial setup notice:', err);
  }
}

export interface AuthState {
  user: User | null;
  teacher: TeacherProfile | null;
  loading: boolean;
  error: string | null;
}

export async function loginWithGoogle(): Promise<{ user: User; teacher: TeacherProfile }> {
  let user: User;

  if (Capacitor.isNativePlatform()) {
    // 1. Native Android Google Sign-In using Google Play Services bottom sheet
    // Bypasses sessionStorage/WebView popups completely to prevent "missing initial state" errors
    try {
      try {
        await GoogleAuth.initialize({
          clientId: GOOGLE_CLIENT_ID,
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      } catch (initErr) {
        console.warn('Native GoogleAuth.initialize runtime notice:', initErr);
      }

      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken;
      if (!idToken) {
        throw new Error('No Google ID token returned from device Google Play Services.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      user = result.user;
    } catch (nativeErr: any) {
      console.error('Native Google Sign-In error on Android:', nativeErr);

      const rawMsg =
        typeof nativeErr === 'string'
          ? nativeErr
          : nativeErr?.message || nativeErr?.error || nativeErr?.code || (nativeErr ? JSON.stringify(nativeErr) : 'Unknown native error');

      const isCancelled =
        String(rawMsg).includes('12501') ||
        String(rawMsg).toLowerCase().includes('cancel') ||
        nativeErr?.code === 12501;

      if (isCancelled) {
        throw new Error('Google Sign-in was cancelled. Please try again.');
      }

      const isDeveloperError =
        String(rawMsg).includes('10') ||
        String(nativeErr?.code).includes('10') ||
        String(rawMsg).toUpperCase().includes('DEVELOPER_ERROR');

      if (isDeveloperError) {
        throw new Error(
          `Android Google Sign-In Setup Required (Error Code 10: DEVELOPER_ERROR)\n\nGoogle Play Services rejected sign-in because your app is not registered in Firebase.\n\nRequired Setup Steps:\n1. Go to Firebase Console (pragati-preschool).\n2. Register Android App with Package Name: com.preschool.childobs\n3. Add your Android SHA-1 Certificate Fingerprint under App Settings.\n4. Download google-services.json and save to android/app/\n5. Rebuild your Android APK.`
        );
      }

      throw new Error(
        `Native Google Sign-In Failed on Mobile Device:\n${rawMsg}\n\nPlease check Android SHA-1 fingerprint configuration in Firebase Console for package com.preschool.childobs.`
      );
    }
  } else {
    // 2. Standard Web Sign-In using Browser Popup
    const result = await signInWithPopup(auth, googleProvider);
    user = result.user;
  }

  // 1. Dynamic Turso cloud database lookup (enables zero-code teacher onboarding)
  let teacher: TeacherProfile | null = null;
  try {
    teacher = await fetchTeacherProfileFromTurso(user.email);
  } catch (err) {
    console.warn('Turso staff lookup failed, attempting local whitelist fallback:', err);
  }

  // 2. Fallback to static whitelist for offline or pre-configured staff
  if (!teacher) {
    teacher = getTeacherProfile(user.email);
  }

  if (!teacher) {
    await logoutUser();
    throw new Error(
      `Access Denied: The account "${user.email}" is not registered in the Pragathi Vidyalaya teacher list. Please contact the administrator.`
    );
  }

  return { user, teacher };
}

export async function logoutUser(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await GoogleAuth.signOut();
    } catch (e) {
      console.warn('Native GoogleAuth.signOut error:', e);
    }
  }
  await fbSignOut(auth);
}
