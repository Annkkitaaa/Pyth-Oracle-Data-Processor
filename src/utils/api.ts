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
   * Fetch latest price updates for multiple price feed IDs with multiple fallback methods
   */
  async fetchLatestPriceUpdates(priceIds: string[]): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Validate price IDs first
      const validation = HermesApiClient.validatePriceIds(priceIds);
      if (validation.invalid.length > 0) {
        console.warn(`⚠️  Warning: Found ${validation.invalid.length} invalid price IDs`);
        validation.invalid.forEach(id => console.warn(`   - ${id}`));
      }

      // Use only valid IDs and remove duplicates
      const validIds = [...new Set(validation.valid)];
      if (validIds.length === 0) {
        throw new Error('No valid price IDs found');
      }

      console.log(`📊 Using ${validIds.length} unique valid IDs`);

      // Try different methods to fetch data
      const methods = [
        () => this.fetchWithArrayParams(validIds),
        () => this.fetchWithBatchSize(validIds, 10),
        () => this.fetchWithBatchSize(validIds, 5),
        () => this.fetchIndividuallyAndCombine(validIds)
      ];

      let lastError: Error = new Error('All methods failed');

      for (let i = 0; i < methods.length; i++) {
        try {
          console.log(`🔄 Trying Method ${i + 1}...`);
          const response = await methods[i]();
          const processingTime = Date.now() - startTime;

          return {
            success: true,
            data: response.data,
            timestamp: Date.now(),
            metadata: {
              totalFeeds: priceIds.length,
              successfulFeeds: response.data.parsed?.length || 0,
              processingTime
            }
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(`Method ${i + 1} failed`);
          console.log(`❌ Method ${i + 1} failed: ${lastError.message}`);
          
          if (i < methods.length - 1) {
            console.log(`⏳ Waiting before trying next method...`);
            await this.delay(1000);
          }
        }
      }

      throw lastError;

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
   * Method 1: Standard array parameter approach
   */
  private async fetchWithArrayParams(priceIds: string[]): Promise<AxiosResponse<HermesResponse>> {
    const params = new URLSearchParams();
    priceIds.forEach(id => {
      params.append('ids[]', id);
    });

    const url = `${this.config.baseUrl}${API_ENDPOINTS.LATEST_PRICE_UPDATES}?${params.toString()}`;
    console.log(` Fetching with array params: ${priceIds.length} feeds`);
    
    return await this.makeRequest(url);
  }

  /**
   * Method 2: Batch processing with smaller chunks
   */
  private async fetchWithBatchSize(priceIds: string[], batchSize: number): Promise<AxiosResponse<HermesResponse>> {
    console.log(` Batch processing with size ${batchSize}`);
    
    if (priceIds.length <= batchSize) {
      return await this.fetchWithArrayParams(priceIds);
    }

    const batches: string[][] = [];
    for (let i = 0; i < priceIds.length; i += batchSize) {
      batches.push(priceIds.slice(i, i + batchSize));
    }

    console.log(` Processing ${batches.length} batches of ${batchSize} feeds each`);

    const allParsed: any[] = [];
    let combinedBinary = '';

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(` Processing batch ${i + 1}/${batches.length} (${batch.length} feeds)`);
      
      try {
        const response = await this.fetchWithArrayParams(batch);
        
        if (response.data.parsed) {
          allParsed.push(...response.data.parsed);
        }
        
        if (response.data.binary?.data?.[0] && !combinedBinary) {
          combinedBinary = response.data.binary.data[0];
        }
        
        // Small delay between batches
        if (i < batches.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.warn(`  Batch ${i + 1} failed, continuing with others...`);
      }
    }

    if (allParsed.length === 0) {
      throw new Error('No data retrieved from any batch');
    }

    // Combine results
    const combinedResponse: AxiosResponse<HermesResponse> = {
      data: {
        binary: {
          encoding: 'hex',
          data: [combinedBinary]
        },
        parsed: allParsed
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
      request: {}
    };

    return combinedResponse;
  }

  /**
   * Method 3: Fetch each feed individually and combine
   */
  private async fetchIndividuallyAndCombine(priceIds: string[]): Promise<AxiosResponse<HermesResponse>> {
    console.log(` Fetching ${priceIds.length} feeds individually`);
    
    const allParsed: any[] = [];
    const validBinaries: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < priceIds.length; i++) {
      const id = priceIds[i];
      try {
        console.log(`📡 Fetching feed ${i + 1}/${priceIds.length}: ${id.slice(0, 10)}...`);
        
        const params = new URLSearchParams();
        params.append('ids[]', id);
        const url = `${this.config.baseUrl}${API_ENDPOINTS.LATEST_PRICE_UPDATES}?${params.toString()}`;
        
        const response = await this.makeRequest(url);
        
        if (response.data.parsed?.[0]) {
          allParsed.push(response.data.parsed[0]);
        }
        
        if (response.data.binary?.data?.[0]) {
          validBinaries.push(response.data.binary.data[0]);
        }
        
        // Small delay between requests
        await this.delay(200);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Feed ${id.slice(0, 10)}: ${errorMsg}`);
        console.warn(`  Failed to fetch ${id.slice(0, 10)}: ${errorMsg}`);
      }
    }

    if (allParsed.length === 0) {
      throw new Error(`No feeds could be fetched. Errors: ${errors.join(', ')}`);
    }

    console.log(`Successfully fetched ${allParsed.length}/${priceIds.length} feeds`);

    // Use the first valid binary data (they should be compatible)
    const combinedResponse: AxiosResponse<HermesResponse> = {
      data: {
        binary: {
          encoding: 'hex',
          data: validBinaries.length > 0 ? [validBinaries[0]] : ['']
        },
        parsed: allParsed
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
      request: {}
    };

    return combinedResponse;
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
          },
          // Add some axios-specific configurations
          validateStatus: (status) => status === 200
        });

        if (response.status === 200 && response.data) {
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