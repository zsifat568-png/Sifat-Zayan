import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase, ref, set, update, remove, onValue, get, child } from 'firebase/database';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';

// Active User Provided Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAYWqwDWP4O-3-AR8rmCqZPE0-WDvamC6g",
  authDomain: "bazar-com-2f14f.firebaseapp.com",
  databaseURL: "https://bazar-com-2f14f-default-rtdb.firebaseio.com",
  projectId: "bazar-com-2f14f",
  storageBucket: "bazar-com-2f14f.firebasestorage.app",
  messagingSenderId: "526863759989",
  appId: "1:526863759989:web:214de7c02b4f0d5dce163c",
  measurementId: "G-E6SNPFK8NW"
};

const configModules = import.meta.glob<{ default: typeof firebaseConfig }>('/firebase-applet-config.json', { eager: true });
const configKey = Object.keys(configModules)[0];
const loadedConfig = configKey && configModules[configKey]?.default ? configModules[configKey].default : null;

const activeConfig = loadedConfig || firebaseConfig;

export const app = !getApps().length ? initializeApp(activeConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export { 
  ref, 
  set, 
  update, 
  remove, 
  onValue, 
  get, 
  child,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
};
export type { FirebaseUser };

// Analytics safely initialized in browser context
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      try {
        logEvent(analytics, 'app_initialized', {
          projectId: firebaseConfig.projectId,
          appId: firebaseConfig.appId,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.debug('Initial analytics log notice:', err);
      }
    }
  }).catch(() => {
    // Analytics not supported in preview sandbox environment
  });
}

export function logAnalyticsEvent(eventName: string, params?: Record<string, unknown>) {
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
    } catch (err) {
      console.debug('Analytics log event notice:', err);
    }
  }
}

export const isFirebaseConfigured = () => true;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is currently offline or unconfigured.");
    }
    return false;
  }
}
