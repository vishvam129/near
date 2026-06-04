import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../lib/i18n'

type Expense = { id: string; label: string; amount: number; paidBy: string }

export function Expenses() {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const { money } = useI18n()
  const [items, setItems] = useState<Expense[]>([])
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'expenses'), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          label: d.data().label ?? '',
          amount: Number(d.data().amount) || 0,
          paidBy: d.data().paidBy ?? '',
        })),
      )
    })
  }, [coupleId])

  const total = items.reduce((s, e) => s + e.amount, 0)
  const myUid = user?.uid
  const mySum = items.filter((e) => e.paidBy === myUid).reduce((s, e) => s + e.amount, 0)
  const theirSum = total - mySum
  const fairShare = total / 2
  const balance = mySum - fairShare // > 0 → partner owes you
  const partnerName = partner?.name || 'your partner'

  async function add(e: FormEvent) {
    e.preventDefault()
    const a = Number(amount)
    if (!label.trim() || !a || a <= 0 || !db || !coupleId || !user) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'expenses'), {
        label: label.trim(),
        amount: a,
        paidBy: user.uid,
        createdAt: serverTimestamp(),
      })
      setLabel('')
      setAmount('')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'expenses', id))
  }

  const who = (a: string) => (a === myUid ? 'You' : partner?.name || 'Partner')

  return (
    <div className="card expenses">
      <h3 className="card-h muted-h">Shared expenses</h3>

      <form className="form entry-form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder="What for?"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="input expense-amount"
          type="number"
          inputMode="numeric"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !label.trim() || !Number(amount)}>
          Add
        </button>
      </form>

      {items.length > 0 && (
        <>
          <div className="split-summary">
            <div>
              Total spent: <strong>{money(total)}</strong>
            </div>
            <div className="split-detail">
              You paid {money(mySum)} · {partnerName} paid {money(theirSum)}
            </div>
            <div className="split-balance">
              {Math.abs(balance) < 0.01
                ? 'All square 🤝'
                : balance > 0
                  ? `${partnerName} owes you ${money(balance)}`
                  : `You owe ${partnerName} ${money(Math.abs(balance))}`}
            </div>
          </div>

          <div className="entry-list expense-list">
            {items.map((e) => (
              <div key={e.id} className="entry">
                <div className="entry-body">
                  <span className="entry-who">
                    {who(e.paidBy)} · {money(e.amount)}
                  </span>
                  <span className="entry-text">{e.label}</span>
                </div>
                <button
                  type="button"
                  className="entry-del"
                  aria-label="Remove"
                  onClick={() => void remove(e.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
