// Static content for guided courses (#78) and conversation decks (#63).
// Kept out of components so the data is easy to extend.

export type Lesson = { title: string; body: string; prompt: string }
export type Course = { id: string; title: string; emoji: string; blurb: string; lessons: Lesson[] }

export const COURSES: Course[] = [
  {
    id: 'communication',
    title: 'Better communication',
    emoji: '🗣️',
    blurb: 'Small habits that keep you understood across the distance.',
    lessons: [
      {
        title: 'Speak from “I”',
        body: 'Swap “you always…” for “I feel… when…”. It shares your experience without putting them on the defensive, so they can actually hear you.',
        prompt: 'Rewrite one recent complaint as an “I feel… when…” sentence and share it.',
      },
      {
        title: 'Reflect before reacting',
        body: 'Before replying to something that stung, say back what you heard: “So you felt left out when I…”. Being understood lowers the temperature instantly.',
        prompt: 'Next disagreement, reflect their point back before giving yours. Tell them you’ll try this.',
      },
      {
        title: 'Name the bid',
        body: 'A “bid” is a small reach for attention — a text, a meme, “look at this”. Turning toward bids is what builds closeness over time.',
        prompt: 'Notice one bid from your partner today and turn toward it warmly.',
      },
    ],
  },
  {
    id: 'intimacy',
    title: 'Closeness from afar',
    emoji: '💞',
    blurb: 'Keep emotional and physical closeness alive between visits.',
    lessons: [
      {
        title: 'Rituals of connection',
        body: 'Tiny repeated rituals — a good-morning voice note, a Sunday call — create safety. Predictable beats grand-but-rare.',
        prompt: 'Agree on one daily and one weekly ritual that are just yours.',
      },
      {
        title: 'Share the mundane',
        body: 'Closeness lives in the small stuff: what you ate, the annoying coworker. Narrating ordinary moments makes you feel present in each other’s days.',
        prompt: 'Send a photo of something boring from your day right now.',
      },
      {
        title: 'Anticipation',
        body: 'Looking forward to something together is its own kind of intimacy. A countdown, a planned date, a someday-trip.',
        prompt: 'Plan one thing — big or tiny — to look forward to together.',
      },
    ],
  },
  {
    id: 'conflict',
    title: 'Fighting fair',
    emoji: '🕊️',
    blurb: 'Disagree without disconnecting.',
    lessons: [
      {
        title: 'The 20-minute pause',
        body: 'When flooded, your body can’t problem-solve. Agree a signal to pause for 20 minutes, then come back — it’s not avoidance, it’s a reset.',
        prompt: 'Pick a gentle “let’s pause” phrase you both can use.',
      },
      {
        title: 'Repair attempts',
        body: 'A repair attempt is any small gesture to de-escalate — a joke, “I’m sorry”, reaching out a hand. Happy couples aren’t conflict-free; they repair quickly.',
        prompt: 'Think of one repair phrase that works for you two and remember it.',
      },
      {
        title: 'Find the shared goal',
        body: 'Under most fights is a shared want — to feel valued, secure, close. Naming it turns “me vs you” into “us vs the problem”.',
        prompt: 'In your next disagreement, ask: “What do we both actually want here?”',
      },
    ],
  },
]

export type Deck = { id: string; title: string; emoji: string; cards: string[] }

export const DECKS: Deck[] = [
  {
    id: 'deep',
    title: 'Go deep',
    emoji: '🌊',
    cards: [
      'What does feeling loved look like for you on an ordinary day?',
      'When did you last feel really proud of us?',
      'What’s a fear about us you’ve never said out loud?',
      'What part of your day do you most wish I could be there for?',
      'How have you changed since we got together?',
      'What do you need more of from me right now?',
    ],
  },
  {
    id: 'dreams',
    title: 'Our future',
    emoji: '✨',
    cards: [
      'Where do you picture us living one day?',
      'What’s a tradition you want us to start?',
      'What does our perfect ordinary Sunday look like — together?',
      'A trip you want us to take before anything else?',
      'What do you hope is still true about us in ten years?',
      'What’s one goal you want us to chase together?',
    ],
  },
  {
    id: 'playful',
    title: 'Just for fun',
    emoji: '🎈',
    cards: [
      'What was your first impression of me — honestly?',
      'If we swapped lives for a day, what would surprise you?',
      'What’s the most “us” song?',
      'Describe me to a stranger in three words.',
      'What’s a tiny thing I do that you secretly love?',
      'What would our reality TV show be called?',
    ],
  },
]
