import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Set to device language for SMS

export const googleProvider = new GoogleAuthProvider();

// Error handling helper
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
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

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Auth Error:", error);
    throw error;
  }
};

export const setupRecaptcha = (containerId: string) => {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = ''; // Physically clear the DOM element
  }

  // Always clear old instance if exists to prevent "internal error" on stale reCAPTCHA
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Recaptcha clear error", e);
    }
  }
  (window as any).recaptchaVerifier = null;
  
  (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
    'callback': (response: any) => {
      console.log("reCAPTCHA solved:", response);
    },
    'expired-callback': () => {
      console.log("reCAPTCHA expired, resetting...");
      setupRecaptcha(containerId);
    }
  });

  return (window as any).recaptchaVerifier;
};

export const sendEmailOtp = async (email: string) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60000); // 10 minutes
  
  try {
    // 1. Save to Firestore for verification
    await setDoc(doc(db, 'verification_codes', email), {
      email,
      code,
      expires: expires.toISOString()
    });
    
    // 2. Call our server API to send the actual email via Resend
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const result = await response.json();
    
    if (result.status === 'simulated') {
      console.log(`[SIMULATION] Check console for code: ${code}`);
    } else if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return true;
  } catch (error) {
    console.error("Email OTP Error:", error);
    throw error;
  }
};

export const verifyEmailOtp = async (email: string, code: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'verification_codes', email));
    if (!docSnap.exists()) return false;
    
    const data = docSnap.data();
    const now = new Date();
    const expires = new Date(data.expires);
    
    if (now > expires) return false;
    return data.code === code;
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return false;
  }
};

export const saveUserProfile = async (uid: string, data: { name: string, email: string, location: string, controlType: string }) => {
  const path = `users/${uid}`;
  console.log("Saving user profile to:", path, "Data:", data);
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Firestore Save Error for path:", path, error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (uid: string) => {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};
