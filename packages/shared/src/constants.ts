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
 * Approximate transit center geographic coordinates (WGS84 decimal degrees)
 * for regional corridor hubs, enabling client map previews without external geocoding requests.
 */
export const POPULAR_CITY_COORDINATES: Record<PopularCity, { lat: number; lng: number }> = {
  Surat: { lat: 21.1702, lng: 72.8311 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Gandhinagar: { lat: 23.2156, lng: 72.6369 },
  Bharuch: { lat: 21.7051, lng: 72.9959 },
  Anand: { lat: 22.5645, lng: 72.9289 },
  Navsari: { lat: 20.9500, lng: 72.9328 },
  Valsad: { lat: 20.5992, lng: 72.9342 },
  Vapi: { lat: 20.3893, lng: 72.9106 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Bhavnagar: { lat: 21.7645, lng: 72.1519 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
};

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
