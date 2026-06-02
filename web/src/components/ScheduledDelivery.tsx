import { useEffect, useRef } from 'react'
import {
  collection,
  onSnapshot,
  runTransaction,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'

type Pending = { id: string; text: string; from: string; deliverAt: number | null }

// Watches scheduled messages and, once their time passes, atomically converts
// each into a real chat message. Runs on whichever partner has the app open.
export function ScheduledDelivery() {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const pendingRef = useRef<Pending[]>([])
  const deliveringRef = useRef<Set<string>>(new Set())

  async function deliver(item: Pending) {
    if (!db || !coupleId || deliveringRef.current.has(item.id)) return
    deliveringRef.current.add(item.id)
    try {
      const schedRef = doc(db, 'couples', coupleId, 'scheduled', item.id)
      const msgRef = doc(collection(db, 'couples', coupleId, 'messages'))
      await runTransaction(db, async (tx) => {
        const s = await tx.get(schedRef)
        if (!s.exists() || s.data().delivered) return
        tx.update(schedRef, { delivered: true })
        tx.set(msgRef, {
          from: item.from,
          text: item.text,
          type: 'text',
          replyTo: null,
          sentAt: serverTimestamp(),
        })
      })
    } catch {
      /* retry on next tick */
    } finally {
      deliveringRef.current.delete(item.id)
    }
  }

  function checkDue() {
    const now = Date.now()
    for (const item of pendingRef.current) {
      if (item.deliverAt != null && item.deliverAt <= now) void deliver(item)
    }
  }

  useEffect(() => {
    if (!db || !coupleId) return
    const unsub = onSnapshot(collection(db, 'couples', coupleId, 'scheduled'), (snap) => {
      pendingRef.current = snap.docs
        .map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          from: d.data().from ?? '',
          deliverAt: d.data().deliverAt?.toMillis?.() ?? null,
          delivered: Boolean(d.data().delivered),
        }))
        .filter((s) => !s.delivered)
      checkDue()
    })
    const id = window.setInterval(checkDue, 20_000)
    return () => {
      unsub()
      window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId])

  return null
}
