import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { app, db } from './firebase'

// Public web config needed by the messaging service worker. These are client
// identifiers (not secrets) and are already embedded in the built bundle.
const SW_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export type PushResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'unsupported' | 'no-vapid' | 'denied' | 'error'; detail?: string }

export async function pushSupported(): Promise<boolean> {
  try {
    return 'Notification' in window && 'serviceWorker' in navigator && (await isSupported())
  } catch {
    return false
  }
}

// Registers the messaging service worker, asks for permission, fetches the FCM
// token, and stores it on the user's own profile doc (one user can have several
// devices, hence arrayUnion). The partner's Cloud Function reads these tokens.
export async function enablePush(uid: string): Promise<PushResult> {
  if (!app || !db) return { ok: false, reason: 'error', detail: 'Firebase not ready' }
  if (!(await pushSupported())) return { ok: false, reason: 'unsupported' }
  if (!VAPID_KEY) return { ok: false, reason: 'no-vapid' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  try {
    const swUrl = `/firebase-messaging-sw.js?fcfg=${encodeURIComponent(JSON.stringify(SW_CONFIG))}`
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/firebase-cloud-messaging-push-scope',
    })
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (!token) return { ok: false, reason: 'error', detail: 'No token returned' }

    await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) })
    return { ok: true, token }
  } catch (e) {
    return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : String(e) }
  }
}

// Remove this device's token (e.g. when the user turns notifications off).
export async function disablePush(uid: string, token: string): Promise<void> {
  if (!db) return
  await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) })
}

// Foreground messages don't auto-display a notification — show one ourselves
// when the app is open and permission is granted.
export function listenForegroundPush(): () => void {
  if (!app) return () => {}
  let unsub = () => {}
  isSupported()
    .then((ok) => {
      if (!ok) return
      const messaging = getMessaging(app)
      unsub = onMessage(messaging, (payload) => {
        const n = payload.notification
        if (n && Notification.permission === 'granted') {
          new Notification(n.title || 'Near 💗', { body: n.body || '', icon: '/icon-192.png' })
        }
      })
    })
    .catch(() => {})
  return () => unsub()
}
