export type Recipe = {
  id: string
  name: string
  emoji: string
  ingredients: string[]
  steps: string[]
}

export const RECIPES: Recipe[] = [
  {
    id: 'pasta',
    name: 'Garlic Butter Pasta',
    emoji: '🍝',
    ingredients: ['Pasta', 'Butter', 'Garlic', 'Parmesan', 'Salt & pepper', 'Parsley'],
    steps: [
      'Boil the pasta until al dente.',
      'Melt butter, add minced garlic, cook 1 min.',
      'Toss the pasta in the garlic butter.',
      'Add parmesan, salt and pepper.',
      'Top with parsley and eat “together”.',
    ],
  },
  {
    id: 'pancakes',
    name: 'Fluffy Pancakes',
    emoji: '🥞',
    ingredients: ['Flour', 'Milk', 'Egg', 'Sugar', 'Baking powder', 'Butter'],
    steps: [
      'Mix the dry ingredients.',
      'Whisk in milk and egg.',
      'Rest the batter 5 min.',
      'Cook on a buttered pan until bubbly, then flip.',
      'Stack, add toppings, dig in.',
    ],
  },
  {
    id: 'maggi',
    name: 'Loaded Masala Maggi',
    emoji: '🍜',
    ingredients: ['Maggi noodles', 'Onion', 'Tomato', 'Peas', 'Masala mix', 'Chilli (optional)'],
    steps: [
      'Sauté onion and tomato.',
      'Add peas and a splash of water.',
      'Add noodles, masala and water.',
      'Cook 3–4 min until soft.',
      'Garnish and share a bowl.',
    ],
  },
  {
    id: 'smoothie',
    name: 'Berry Smoothie',
    emoji: '🥤',
    ingredients: ['Banana', 'Berries', 'Yogurt', 'Milk', 'Honey'],
    steps: [
      'Add everything to a blender.',
      'Blend until smooth.',
      'Pour into two glasses.',
      'Cheers over video 🥂',
    ],
  },
]
