import { useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import { Picker } from 'emoji-mart'

type EmojiPickerCtor = new (options: Record<string, unknown>) => HTMLElement

/** Full searchable emoji picker (emoji-mart core) in a dismissable overlay. */
export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Keep the latest onPick without rebuilding the picker on every parent render
  // (an incoming message / typing update would otherwise reset search state).
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const picker = new (Picker as EmojiPickerCtor)({
      data,
      theme: 'dark',
      previewPosition: 'none',
      skinTonePosition: 'none',
      onEmojiSelect: (e: { native: string }) => onPickRef.current(e.native),
    })
    host.appendChild(picker)
    return () => {
      host.innerHTML = ''
    }
  }, [])

  return (
    <div className="emoji-overlay" onClick={onClose}>
      <div className="emoji-pop" ref={ref} onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
