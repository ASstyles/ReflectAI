import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import type { UserInteraction } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with custom database ID if specified
export const db: Firestore = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Auth Sign-In Error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Firebase Auth Sign-Out Error:', error);
    throw error;
  }
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (data !== null && typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

// Firestore Database Operations (User-Isolated under /users/{userId}/interactions/{interactionId})
export async function saveInteraction(userId: string, interaction: UserInteraction): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save an interaction.');
  }
  if (!interaction.id) {
    throw new Error('Interaction ID is required.');
  }

  const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
  const payloadToSave = sanitizeForFirestore({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(interactionRef, payloadToSave, { merge: true });
}

export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) {
    throw new Error('User ID and Interaction ID are required for deletion.');
  }
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(interactionRef);
}

export function subscribeUserInteractions(
  userId: string,
  onData: (interactions: UserInteraction[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  // Order by updatedAt or createdAt descending
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserInteraction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as UserInteraction);
      });
      onData(items);
    },
    (err) => {
      console.error('Error fetching interactions from Firestore:', err);
      onError(err);
    }
  );
}
