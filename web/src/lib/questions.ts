export const QUESTIONS: string[] = [
  'What’s the first thing you want to do when we’re together again?',
  'What made you smile today?',
  'What’s a small thing I do that you love?',
  'Where in the world should we travel together first?',
  'What song reminds you of me?',
  'What’s your favorite memory of us so far?',
  'What are you most looking forward to this week?',
  'If we had a free day together right now, how would we spend it?',
  'What’s something new you want us to try together?',
  'What’s your comfort food, and would you cook it for me?',
  'What’s one thing you’re proud of yourself for lately?',
  'What does your perfect lazy morning with me look like?',
  'What’s a tiny goal you want to hit this month?',
  'What’s something that made you think of me recently?',
  'What show or movie should we watch together next?',
  'What’s your love language, and how can I show it more?',
  'What’s a dream you haven’t told me yet?',
  'What’s the best gift I could give you that isn’t a thing?',
  'What part of your day do you wish I could be there for?',
  'What’s something you’re grateful for right now?',
  'If you could teleport to me for one hour, what would we do?',
  'What’s a habit you want us to build together?',
  'What’s your favorite photo of us and why?',
  'What’s one thing you want to remember about this chapter of us?',
  'What made today hard, and how can I help?',
  'What’s a place near you that you wish you could show me?',
  'What’s something silly that always cheers you up?',
  'What do you find most attractive about me?',
  'What’s a future moment with me you daydream about?',
  'What’s one word for how you feel about us today?',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Same question for both partners on a given 'YYYY-MM-DD' day. */
export function questionForDate(dateKey: string): string {
  return QUESTIONS[hashStr(dateKey) % QUESTIONS.length]
}
