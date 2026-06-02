import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'

// Values come from web/.env (see web/.env.example). Vite only exposes
// variables prefixed with VITE_ to the browser.
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// The app boots even before keys are added — auth simply stays disabled
// until VITE_FIREBASE_API_KEY is present, so you can see the UI immediately.
export const firebaseEnabled = Boolean(cfg.apiKey)

let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

if (firebaseEnabled) {
  app = initializeApp(cfg)
  authInstance = getAuth(app)
  // Auto-detect long-polling so real-time listeners keep working on networks
  // that block Firestore's default streaming channel (the "have to refresh to
  // see new messages" symptom).
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  })
}

export const auth = authInstance
export const db = dbInstance
export const googleProvider = new GoogleAuthProvider()
export { app }
