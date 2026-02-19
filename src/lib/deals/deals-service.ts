/**
 * Deals Service
 * Fetches and filters deals/offers based on user interest.
 * Uses a provider-agnostic adapter pattern for deal sources (Groupon-style).
 */

import type { Deal, DealCategory, DealsQuery, DealsResponse } from './types'
import { INTEREST_CATEGORY_MAP } from './types'

/**
 * Detect deal-relevant categories from user message text.
 */
export function detectInterestCategories(text: string): DealCategory[] {
  const lower = text.toLowerCase()
  const categories = new Set<DealCategory>()

  for (const [keyword, category] of Object.entries(INTEREST_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      categories.add(category)
    }
  }

  return Array.from(categories)
}

/**
 * Check whether a user message signals deal/offer interest.
 */
export function hasDealIntent(text: string): boolean {
  const dealKeywords = [
    'deal', 'deals', 'offer', 'offers', 'discount', 'coupon',
    'save', 'cheap', 'sale', 'bargain', 'promo', 'promotion',
    'groupon', 'best price', 'affordable',
  ]
  const lower = text.toLowerCase()
  return dealKeywords.some(k => lower.includes(k))
}

// ---------------------------------------------------------------------------
// Curated deal catalog (provider-agnostic, Groupon-style)
// ---------------------------------------------------------------------------

const DEAL_CATALOG: Deal[] = [
  {
    id: 'deal-food-1',
    title: '50% Off Farm-to-Table Dining Experience',
    description: 'Enjoy a curated 3-course meal at top-rated local restaurants. Valid for dine-in.',
    provider: 'CubiQo Deals',
    originalPrice: 80,
    dealPrice: 40,
    discount: '50% off',
    category: 'food',
    url: '#',
    rating: 4.7,
  },
  {
    id: 'deal-food-2',
    title: '$15 for $30 Worth of Sushi & Japanese Cuisine',
    description: 'Fresh sushi rolls, sashimi, and traditional Japanese dishes at half price.',
    provider: 'CubiQo Deals',
    originalPrice: 30,
    dealPrice: 15,
    discount: '50% off',
    category: 'food',
    url: '#',
    rating: 4.5,
  },
  {
    id: 'deal-travel-1',
    title: 'Weekend Getaway: 2 Nights from $99',
    description: 'Boutique hotel stay with breakfast included. Select destinations available.',
    provider: 'CubiQo Deals',
    originalPrice: 250,
    dealPrice: 99,
    discount: '60% off',
    category: 'travel',
    url: '#',
    rating: 4.6,
  },
  {
    id: 'deal-shopping-1',
    title: '$25 for $50 at Popular Fashion Outlets',
    description: 'Use towards clothing, accessories, and footwear at participating stores.',
    provider: 'CubiQo Deals',
    originalPrice: 50,
    dealPrice: 25,
    discount: '50% off',
    category: 'shopping',
    url: '#',
    rating: 4.3,
  },
  {
    id: 'deal-entertainment-1',
    title: 'Movie Night: 2 Tickets + Popcorn for $15',
    description: 'Enjoy the latest blockbusters with a companion. Valid at major theater chains.',
    provider: 'CubiQo Deals',
    originalPrice: 35,
    dealPrice: 15,
    discount: '57% off',
    category: 'entertainment',
    url: '#',
    rating: 4.8,
  },
  {
    id: 'deal-beauty-1',
    title: 'Spa Day Package: Massage + Facial from $59',
    description: '90-minute relaxation package at premium wellness centers.',
    provider: 'CubiQo Deals',
    originalPrice: 150,
    dealPrice: 59,
    discount: '61% off',
    category: 'beauty',
    url: '#',
    rating: 4.9,
  },
  {
    id: 'deal-fitness-1',
    title: '1-Month Unlimited Gym Membership for $19',
    description: 'Access to all equipment, classes, and facilities. New members only.',
    provider: 'CubiQo Deals',
    originalPrice: 50,
    dealPrice: 19,
    discount: '62% off',
    category: 'fitness',
    url: '#',
    rating: 4.4,
  },
  {
    id: 'deal-electronics-1',
    title: 'Wireless Earbuds: Premium Sound for $29',
    description: 'Noise-canceling, 24h battery life, Bluetooth 5.3. Limited stock.',
    provider: 'CubiQo Deals',
    originalPrice: 79,
    dealPrice: 29,
    discount: '63% off',
    category: 'electronics',
    url: '#',
    rating: 4.5,
  },
  {
    id: 'deal-education-1',
    title: 'Online Learning: Any Course for $9.99',
    description: 'Choose from 5,000+ courses in tech, business, design, and more.',
    provider: 'CubiQo Deals',
    originalPrice: 49.99,
    dealPrice: 9.99,
    discount: '80% off',
    category: 'education',
    url: '#',
    rating: 4.6,
  },
  {
    id: 'deal-services-1',
    title: 'Home Cleaning: 3 Hours for $49',
    description: 'Professional cleaning service with eco-friendly products. Satisfaction guaranteed.',
    provider: 'CubiQo Deals',
    originalPrice: 120,
    dealPrice: 49,
    discount: '59% off',
    category: 'services',
    url: '#',
    rating: 4.7,
  },
]

/**
 * Fetch deals matching the given query.
 * This is the main entry point — swap the implementation to connect
 * a live provider (Groupon API, affiliate feed, etc.) in production.
 */
export async function fetchDeals(query: DealsQuery): Promise<DealsResponse> {
  let results = [...DEAL_CATALOG]

  if (query.category) {
    results = results.filter(d => d.category === query.category)
  }

  if (query.query) {
    const q = query.query.toLowerCase()
    results = results.filter(
      d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.includes(q)
    )
  }

  const maxResults = query.maxResults ?? 5
  results = results.slice(0, maxResults)

  return {
    deals: results,
    query,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get contextual deals for a user message — convenience wrapper.
 */
export async function getContextualDeals(
  userMessage: string,
  maxResults = 3
): Promise<Deal[]> {
  const categories = detectInterestCategories(userMessage)
  const showDeals = hasDealIntent(userMessage) || categories.length > 0

  if (!showDeals) return []

  // Fetch deals for each detected category, then merge
  const allDeals: Deal[] = []
  if (categories.length > 0) {
    for (const category of categories) {
      const { deals } = await fetchDeals({ category, maxResults: 2 })
      allDeals.push(...deals)
    }
  } else {
    // Generic deal intent without specific category
    const { deals } = await fetchDeals({ maxResults })
    allDeals.push(...deals)
  }

  // Deduplicate and limit
  const seen = new Set<string>()
  const unique = allDeals.filter(d => {
    if (seen.has(d.id)) return false
    seen.add(d.id)
    return true
  })

  return unique.slice(0, maxResults)
}
