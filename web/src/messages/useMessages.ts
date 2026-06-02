import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'
import { useAuth } from '../auth/AuthProvider'

export type ReplyRef = { id: string; text: string; from: string }

export type Message = {
  id: string
  from: string
  text: string
  imageUrl: string | null
  reactions: Record<string, string>
  replyTo: ReplyRef | null
  sentAt: Date | null
  pending: boolean
}

const PAGE = 200

export function useMessages() {
  const { couple } = useCouple()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'couples', coupleId, 'messages'),
      orderBy('sentAt', 'asc'),
      limit(PAGE),
    )
    return onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((doc) => {
            const d = doc.data()
            return {
              id: doc.id,
              from: d.from,
              text: d.text ?? '',
              imageUrl: d.imageUrl ?? null,
              reactions: d.reactions ?? {},
              replyTo: d.replyTo ?? null,
              // serverTimestamp is null locally until the server resolves it
              sentAt: d.sentAt?.toDate?.() ?? null,
              pending: snap.metadata.hasPendingWrites && d.sentAt == null,
            }
          }),
        )
        setLoading(false)
      },
      (err) => {
        console.error('Failed to load messages:', err)
        setLoading(false)
      },
    )
  }, [coupleId])

  async function send(text: string, replyTo: ReplyRef | null = null) {
    const t = text.trim()
    if (!t || !db || !coupleId || !user) return
    await addDoc(collection(db, 'couples', coupleId, 'messages'), {
      from: user.uid,
      text: t,
      type: 'text',
      replyTo: replyTo ?? null,
      sentAt: serverTimestamp(),
    })
  }

  async function sendImage(imageUrl: string, caption = '', replyTo: ReplyRef | null = null) {
    if (!imageUrl || !db || !coupleId || !user) return
    await addDoc(collection(db, 'couples', coupleId, 'messages'), {
      from: user.uid,
      text: caption.trim(),
      imageUrl,
      type: 'image',
      replyTo: replyTo ?? null,
      sentAt: serverTimestamp(),
    })
  }

  async function setReaction(messageId: string, emoji: string | null) {
    if (!db || !coupleId || !user) return
    const ref = doc(db, 'couples', coupleId, 'messages', messageId)
    await updateDoc(ref, { [`reactions.${user.uid}`]: emoji ?? deleteField() })
  }

  async function deleteMessage(messageId: string) {
    if (!db || !coupleId) return
    await deleteDoc(doc(db, 'couples', coupleId, 'messages', messageId))
  }

  return {
    messages,
    loading,
    send,
    sendImage,
    setReaction,
    deleteMessage,
    myUid: user?.uid ?? null,
  }
}
