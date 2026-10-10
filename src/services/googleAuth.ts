import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with Google Sheets Scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// In-memory access token cache (MANDATORY: NEVER save access token to localStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: FirebaseUser | null = null;
let isSigningIn = false;

// Listen to auth changes
export const initGoogleAuth = (
  onAuthChange?: (user: FirebaseUser | null, token: string | null) => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    cachedGoogleUser = user;
    if (!user) {
      cachedAccessToken = null;
    }
    if (onAuthChange) {
      onAuthChange(user, cachedAccessToken);
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out from Google
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

// Access token getter
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleUser = (): FirebaseUser | null => {
  return cachedGoogleUser;
};
