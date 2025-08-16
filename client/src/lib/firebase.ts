import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, getDocs, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging (only if supported)
let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log("Firebase messaging not available in this environment");
}

// Helper function to get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) return null;
  
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Helper function to setup reCAPTCHA verifier
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
  });
};

// Phone authentication helpers
export const sendPhoneOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

export const verifyOTP = async (verificationId: string, verificationCode: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const result = await signInWithCredential(auth, credential);
    return result;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

// Firestore helpers
export const createUserDocument = async (uid: string, userData: any) => {
  try {
    await setDoc(doc(db, "users", uid), {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

export const getUserDocument = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user document:", error);
    return null;
  }
};

export const updateUserDocument = async (uid: string, updates: any) => {
  try {
    await updateDoc(doc(db, "users", uid), updates);
  } catch (error) {
    console.error("Error updating user document:", error);
    throw error;
  }
};

// Trip helpers
export const createTrip = async (tripData: any) => {
  try {
    const tripRef = await addDoc(collection(db, "trips"), {
      ...tripData,
      startedAt: serverTimestamp(),
    });
    return tripRef.id;
  } catch (error) {
    console.error("Error creating trip:", error);
    throw error;
  }
};

export const updateTripLocation = async (tripId: string, lat: number, lng: number) => {
  try {
    await updateDoc(doc(db, "trips", tripId), {
      lastLat: lat,
      lastLng: lng,
      lastUpdateAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating trip location:", error);
    throw error;
  }
};

// Incident helpers
export const createIncident = async (incidentData: any) => {
  try {
    const incidentRef = await addDoc(collection(db, "incidents"), {
      ...incidentData,
      createdAt: serverTimestamp(),
    });
    return incidentRef.id;
  } catch (error) {
    console.error("Error creating incident:", error);
    throw error;
  }
};

// Report helpers
export const createReport = async (reportData: any) => {
  try {
    const reportRef = await addDoc(collection(db, "reports"), {
      ...reportData,
      createdAt: serverTimestamp(),
    });
    return reportRef.id;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

export const getReports = async () => {
  try {
    const reportsQuery = query(collection(db, "reports"));
    const querySnapshot = await getDocs(reportsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting reports:", error);
    return [];
  }
};

// Real-time listeners
export const subscribeToTrip = (tripId: string, callback: (data: any) => void) => {
  return onSnapshot(doc(db, "trips", tripId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const subscribeToIncident = (incidentId: string, callback: (data: any) => void) => {
  return onSnapshot(doc(db, "incidents", incidentId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// FCM message handling
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

// Export Firebase Firestore functions that are being imported elsewhere
export { doc, updateDoc } from "firebase/firestore";
