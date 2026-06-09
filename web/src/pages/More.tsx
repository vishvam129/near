import { CheckList } from '../components/CheckList'
import { EntryList } from '../components/EntryList'
import { DateIdeas } from '../components/DateIdeas'
import { OpenWhen } from '../components/OpenWhen'
import { ReasonsJar } from '../components/ReasonsJar'
import { ScheduleMessage } from '../components/ScheduleMessage'
import { MemoryTimeline } from '../components/MemoryTimeline'
import { SavingsGoal } from '../components/SavingsGoal'
import { Expenses } from '../components/Expenses'
import { TimeCapsule } from '../components/TimeCapsule'
import { CookTogether } from '../components/CookTogether'
import { Calendar } from '../components/Calendar'
import { HabitTracker } from '../components/HabitTracker'
import { CoopGoals } from '../components/CoopGoals'
import { AmbientScenes } from '../components/AmbientScenes'
import { LoveLanguageQuiz } from '../components/LoveLanguageQuiz'
import { FitnessPact } from '../components/FitnessPact'
import { RepairFlow } from '../components/RepairFlow'
import { ActiveListening } from '../components/ActiveListening'
import { CycleAwareness } from '../components/CycleAwareness'
import { CoupleAvatars } from '../components/CoupleAvatars'
import { GuidedCourses } from '../components/GuidedCourses'
import { ConversationDecks } from '../components/ConversationDecks'
import { DateNightPlanner } from '../components/DateNightPlanner'
import { PhotoAlbum } from '../components/PhotoAlbum'
import { SecretVault } from '../components/SecretVault'
import { IdeaSuggestions } from '../components/IdeaSuggestions'
import { SecretChat } from '../components/SecretChat'
import { LanguageSettings } from '../components/LanguageSettings'

export default function More() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> More
        </div>

        <PhotoAlbum />
        <SecretVault />
        <SecretChat />
        <Calendar />
        <HabitTracker />
        <CoopGoals />
        <AmbientScenes />
        <LoveLanguageQuiz />
        <FitnessPact />
        <RepairFlow />
        <ActiveListening />
        <CycleAwareness />
        <CoupleAvatars />
        <GuidedCourses />
        <ConversationDecks />
        <DateNightPlanner />
        <IdeaSuggestions />
        {/* NotificationsToggle is built but hidden until a push *sender* exists
            (Cloud Function needs the Blaze plan). Re-add this line to enable. */}
        <LanguageSettings />
        <CookTogether />
        <SavingsGoal />
        <Expenses />
        <MemoryTimeline />
        <TimeCapsule />
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
