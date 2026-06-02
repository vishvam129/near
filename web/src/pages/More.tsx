import { BucketList } from '../components/BucketList'
import { EntryList } from '../components/EntryList'

export default function More() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> More
        </div>

        <BucketList />

        <EntryList
          name="journal"
          title="Journal & love letters"
          placeholder="Write something for us…"
          emptyText="No entries yet — write your first."
          multiline
        />

        <EntryList
          name="gratitude"
          title="Gratitude notes"
          placeholder="I’m grateful for…"
          emptyText="No notes yet — share what you’re grateful for."
        />
      </div>
    </div>
  )
}
