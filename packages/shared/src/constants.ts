/**
 * Application branding and metadata
 */
export const APP_NAME = 'RideMitra';
export const APP_TAGLINE = 'Smart Carpooling & Bikepooling for City & Intercity Travel';
export const DEFAULT_API_VERSION = 'v1';

/**
 * Common regional transit hub cities for western India / Gujarat corridor
 */
export const POPULAR_CITIES = [
  'Surat',
  'Ahmedabad',
  'Vadodara',
  'Gandhinagar',
  'Bharuch',
  'Anand',
  'Navsari',
  'Valsad',
  'Vapi',
  'Rajkot',
  'Bhavnagar',
  'Mumbai',
] as const;

export type PopularCity = (typeof POPULAR_CITIES)[number];

/**
 * Standard commute categories
 */
export const COMMUTE_MODES = [
  {
    id: 'carpooling',
    name: 'Carpooling',
    description: 'Share empty car seats with verified commuters travelling along your route.',
    badge: 'Eco & Comfortable',
  },
  {
    id: 'bikepooling',
    name: 'Bikepooling',
    description:
      'Quick, economical two-wheeler rides for agile intra-city daily office and college travel.',
    badge: 'Fast & Affordable',
  },
] as const;
