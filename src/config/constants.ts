export const HERMES_API_BASE_URL = 'https://hermes.pyth.network';

export const API_ENDPOINTS = {
  LATEST_PRICE_UPDATES: '/v2/updates/price/latest',
  STREAMING_UPDATES: '/v2/updates/price/stream',
  PRICE_FEEDS: '/v2/price_feeds'
} as const;

export const SELECTED_ASSET_INDICES = [0, 4, 8, 12, 16]; // Indices for 5 assets to re-encode

export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

export const OUTPUT_PATHS = {
  RAW_DATA: './data/raw_price_updates.json',
  DECODED_DATA: './data/decoded_data.json',
  REENCODED_DATA: './data/reencoded_data.json'
} as const;