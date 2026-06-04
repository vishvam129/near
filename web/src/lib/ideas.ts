// Idea bank for the date & gift suggestion engine (#64). Filtered locally by
// type / budget / energy — a curated recommender, not an LLM call.
export type Budget = 'free' | 'cheap' | 'splurge'
export type Energy = 'chill' | 'active'
export type IdeaType = 'date' | 'gift'

export type Idea = { text: string; type: IdeaType; budget: Budget; energy: Energy }

export const IDEAS: Idea[] = [
  // --- date · free ---
  { text: 'Watch the sunset together on a video call', type: 'date', budget: 'free', energy: 'chill' },
  { text: 'Cook the same recipe at the same time', type: 'date', budget: 'free', energy: 'active' },
  { text: 'Star-map gazing — point your phones at the same constellation', type: 'date', budget: 'free', energy: 'chill' },
  { text: 'Take a “walk together” — both go outside on a call', type: 'date', budget: 'free', energy: 'active' },
  { text: 'Play 20 questions until you learn something new', type: 'date', budget: 'free', energy: 'chill' },
  { text: 'Do a home workout side-by-side on video', type: 'date', budget: 'free', energy: 'active' },
  // --- date · cheap ---
  { text: 'Order each other’s dinner as a surprise', type: 'date', budget: 'cheap', energy: 'chill' },
  { text: 'Rent the same new movie and sync play', type: 'date', budget: 'cheap', energy: 'chill' },
  { text: 'Online escape room over video', type: 'date', budget: 'cheap', energy: 'active' },
  { text: 'Both try a cheap new hobby kit and compare', type: 'date', budget: 'cheap', energy: 'active' },
  { text: 'Coffee date — order from the same chain, sip on call', type: 'date', budget: 'cheap', energy: 'chill' },
  // --- date · splurge ---
  { text: 'Book a surprise weekend visit', type: 'date', budget: 'splurge', energy: 'active' },
  { text: 'Send a full restaurant meal to their door for a “dinner date”', type: 'date', budget: 'splurge', energy: 'chill' },
  { text: 'Plan a shared experience for your next visit (concert, class)', type: 'date', budget: 'splurge', energy: 'active' },
  { text: 'Couple’s spa kit delivered to both of you for a pamper night', type: 'date', budget: 'splurge', energy: 'chill' },
  // --- gift · free ---
  { text: 'Make a playlist of songs that remind you of them', type: 'gift', budget: 'free', energy: 'chill' },
  { text: 'Write a “52 reasons I love you” note', type: 'gift', budget: 'free', energy: 'active' },
  { text: 'Record a good-morning voice note for each day this week', type: 'gift', budget: 'free', energy: 'chill' },
  { text: 'Make a photo collage of your favourite moments', type: 'gift', budget: 'free', energy: 'active' },
  // --- gift · cheap ---
  { text: 'Send their favourite snack by post', type: 'gift', budget: 'cheap', energy: 'chill' },
  { text: 'A small book in a genre they love, with a note inside', type: 'gift', budget: 'cheap', energy: 'chill' },
  { text: 'Matching phone wallpapers you design together', type: 'gift', budget: 'cheap', energy: 'active' },
  { text: 'A candle in “your” scent so home feels shared', type: 'gift', budget: 'cheap', energy: 'chill' },
  // --- gift · splurge ---
  { text: 'A custom star map of the night you met', type: 'gift', budget: 'splurge', energy: 'chill' },
  { text: 'Matching jewellery or watches', type: 'gift', budget: 'splurge', energy: 'chill' },
  { text: 'A surprise flight or train ticket to visit', type: 'gift', budget: 'splurge', energy: 'active' },
  { text: 'A subscription you’ll both enjoy (streaming, a box)', type: 'gift', budget: 'splurge', energy: 'chill' },
]
