import { CheckList } from '../components/CheckList'
import { EntryList } from '../components/EntryList'
import { DateIdeas } from '../components/DateIdeas'
import { OpenWhen } from '../components/OpenWhen'
import { ReasonsJar } from '../components/ReasonsJar'
import { ScheduleMessage } from '../components/ScheduleMessage'
import { MemoryTimeline } from '../components/MemoryTimeline'
import { SavingsGoal } from '../components/SavingsGoal'
import { Expenses } from '../components/Expenses'

export default function More() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> More
        </div>

        <SavingsGoal />
        <Expenses />
        <MemoryTimeline />
        <DateIdeas />
        <ReasonsJar />
        <OpenWhen />
        <ScheduleMessage />

        <CheckList
          name="bucket"
          title="Bucket list"
          placeholder="Something to do together…"
          emptyText="No dreams yet — add something you want to do together."
        />
        <CheckList
          name="todos"
          title="Shared to-do"
          placeholder="A task for the two of you…"
          emptyText="Nothing on the list yet."
        />

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
