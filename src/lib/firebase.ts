import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore for better control over settings in sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Often helps with firewall/proxy issues in sandboxed frames
}, (firebaseConfig as any).firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

// Enable persistence for better offline experience and resilience
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}

async function testConnection() {
  try {
    // Attempt to read a doc in a public collection to test connection
    await getDocFromServer(doc(db, 'items', 'ping'));
    console.log("Firestore connected successfully.");
  } catch (error: any) {
    // We only care if it's a connectivity error, not a permission error on the dummy doc
    if (error.code === 'permission-denied') {
      console.log("Firestore reachability confirmed (Auth required for specific path).");
      return;
    }
    
    console.error("Firestore connection attempt failed:", error.message);
    if (error.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.warn("Firestore is currently unavailable. This may be a transient network issue or the database is still provisioning.");
    }
  }
}

testConnection();
