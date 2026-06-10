import { type ReactNode } from 'react'
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
import { ARSurprise } from '../components/ARSurprise'
import { LanguageSettings } from '../components/LanguageSettings'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="more-section">
      <h2 className="section-title">{title}</h2>
      <div className="section-grid">{children}</div>
    </section>
  )
}

export default function More() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> More
        </div>

        <Section title="For us">
          <PhotoAlbum />
          <CoupleAvatars />
          <MemoryTimeline />
          <TimeCapsule />
          <ReasonsJar />
          <OpenWhen />
          <SecretChat />
          <SecretVault />
          <ARSurprise />
        </Section>

        <Section title="Plan together">
          <Calendar />
          <DateNightPlanner />
          <DateIdeas />
          <IdeaSuggestions />
          <ScheduleMessage />
          <SavingsGoal />
          <Expenses />
        </Section>

        <Section title="Grow together">
          <HabitTracker />
          <CoopGoals />
          <FitnessPact />
          <GuidedCourses />
          <RepairFlow />
          <ActiveListening />
          <ConversationDecks />
          <LoveLanguageQuiz />
          <CycleAwareness />
        </Section>

        <Section title="Unwind">
          <AmbientScenes />
          <CookTogether />
        </Section>

        <Section title="Lists & notes">
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
        </Section>

        <Section title="Settings">
          {/* NotificationsToggle is built but hidden until a push sender exists
              (Cloud Function needs the Blaze plan). Re-add to enable. */}
          <LanguageSettings />
        </Section>
      </div>
    </div>
  )
}
