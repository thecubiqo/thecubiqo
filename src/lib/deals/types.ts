/**
 * Type definitions for deals and offers system
 */

export interface Deal {
  id: string
  title: string
  description: string
  provider: string
  originalPrice: number
  dealPrice: number
  discount: string
  category: DealCategory
  imageUrl?: string
  url: string
  expiresAt?: string
  rating?: number
  location?: string
}

export type DealCategory =
  | 'food'
  | 'travel'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'beauty'
  | 'services'
  | 'electronics'
  | 'fitness'
  | 'education'

export interface DealsQuery {
  category?: DealCategory
  query?: string
  location?: string
  maxResults?: number
}

export interface DealsResponse {
  deals: Deal[]
  query: DealsQuery
  timestamp: string
}

/** Keywords that map user interests to deal categories */
export const INTEREST_CATEGORY_MAP: Record<string, DealCategory> = {
  // Food
  restaurant: 'food',
  food: 'food',
  dining: 'food',
  eat: 'food',
  lunch: 'food',
  dinner: 'food',
  breakfast: 'food',
  coffee: 'food',
  pizza: 'food',
  sushi: 'food',
  burger: 'food',
  // Travel
  travel: 'travel',
  hotel: 'travel',
  flight: 'travel',
  vacation: 'travel',
  trip: 'travel',
  // Shopping
  shopping: 'shopping',
  buy: 'shopping',
  clothes: 'shopping',
  shoes: 'shopping',
  fashion: 'shopping',
  // Entertainment
  movie: 'entertainment',
  concert: 'entertainment',
  show: 'entertainment',
  theater: 'entertainment',
  music: 'entertainment',
  game: 'entertainment',
  // Health & Beauty
  spa: 'beauty',
  massage: 'beauty',
  salon: 'beauty',
  haircut: 'beauty',
  gym: 'fitness',
  fitness: 'fitness',
  workout: 'fitness',
  yoga: 'fitness',
  // Electronics
  phone: 'electronics',
  laptop: 'electronics',
  computer: 'electronics',
  gadget: 'electronics',
  // Education
  course: 'education',
  class: 'education',
  learn: 'education',
  tutorial: 'education',
}
