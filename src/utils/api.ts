import axios, { AxiosResponse } from 'axios';
import { HERMES_API_BASE_URL, API_ENDPOINTS, REQUEST_CONFIG } from '../config/constants';
import { HermesResponse, ApiConfig, ProcessingResult } from '../types';

export class HermesApiClient {
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseUrl: HERMES_API_BASE_URL,
      timeout: REQUEST_CONFIG.TIMEOUT,
      retryAttempts: REQUEST_CONFIG.RETRY_ATTEMPTS,
      retryDelay: REQUEST_CONFIG.RETRY_DELAY,
      ...config
    };
  }

  /**
   * Fetch latest price updates for multiple price feed IDs
   */
  async fetchLatestPriceUpdates(priceIds: string[]): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Construct query parameters for multiple IDs
      const params = new URLSearchParams();
      priceIds.forEach(id => {
        params.append('ids[]', id);
      });

      const url = `${this.config.baseUrl}${API_ENDPOINTS.LATEST_PRICE_UPDATES}?${params.toString()}`;
      
      console.log(`Fetching price updates for ${priceIds.length} feeds...`);
      console.log(`URL: ${url}`);

      const response = await this.makeRequest(url);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
        metadata: {
          totalFeeds: priceIds.length,
          processingTime
        }
      };
    } catch (error) {
      console.error('Error fetching price updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        metadata: {
          totalFeeds: priceIds.length,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Fetch price updates with retry logic
   */
  private async makeRequest(url: string): Promise<AxiosResponse<HermesResponse>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await axios.get<HermesResponse>(url, {
          timeout: this.config.timeout,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'pyth-oracle-processor/1.0.0'
          }
        });

        if (response.status === 200) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          console.log(`Attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Validate price feed IDs format
   */
  static validatePriceIds(priceIds: string[]): { valid: string[], invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    priceIds.forEach(id => {
      // Pyth price feed IDs should be 64-character hex strings starting with 0x
      if (/^0x[a-fA-F0-9]{64}$/.test(id)) {
        valid.push(id);
      } else {
        invalid.push(id);
      }
    });

    return { valid, invalid };
  }

  /**
   * Get price feed information
   */
  async fetchPriceFeedInfo(): Promise<ProcessingResult> {
    try {
      const url = `${this.config.baseUrl}${API_ENDPOINTS.PRICE_FEEDS}`;
      const response = await this.makeRequest(url);

      return {
        success: true,
        data: response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}