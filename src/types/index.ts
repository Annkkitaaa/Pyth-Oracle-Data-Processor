export interface PriceData {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}

export interface PriceUpdateData {
  id: string;
  price: PriceData;
  ema_price: PriceData;
  metadata: {
    slot: number;
    proof_available_time: number;
    prev_publish_time: number;
  };
}

export interface HermesResponse {
  binary: {
    encoding: string;
    data: string[];
  };
  parsed: PriceUpdateData[];
}

export interface DecodedPriceUpdate {
  feedId: string;
  priceValue: bigint;
  confidence: bigint;
  exponent: number;
  publishTime: number;
  emaPrice: bigint;
  emaConfidence: bigint;
  slot: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
  metadata?: {
    totalFeeds?: number;
    selectedFeeds?: number;
    successfulFeeds?: number;
    processingTime?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    expectedFeeds: number;
    actualFeeds: number;
    dataSize: number;
  };
}

// Pyth price update message structure
export interface PythPriceMessage {
  feedId: Uint8Array;
  price: bigint;
  conf: bigint;
  expo: number;
  publishTime: bigint;
  prevPublishTime: bigint;
  emaPrice: bigint;
  emaConf: bigint;
}

// Accumulator update structure
export interface AccumulatorUpdate {
  encoding: number;
  vaa: Uint8Array;
  updates: PythPriceMessage[];
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}