import axios from 'axios';
import { ProcessingResult, PythPriceUpdate, IndividualPriceUpdate } from '../types';

export class ProductionPythClient {
  private baseUrl: string;

  constructor(endpoint: string = 'https://hermes.pyth.network') {
    this.baseUrl = endpoint;
  }

  /**
   * Fetch individual price updates that can be submitted directly to Pyth contracts
   */
  async fetchIndividualPriceUpdates(priceIds: string[]): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(` Fetching individual price updates for ${priceIds.length} feeds...`);
      
      // Validate price IDs first
      const validation = ProductionPythClient.validatePriceIds(priceIds);
      if (validation.invalid.length > 0) {
        console.warn(`  Warning: Found ${validation.invalid.length} invalid price IDs`);
        validation.invalid.forEach(id => console.warn(`   - ${id}`));
      }

      // Use only valid IDs and remove duplicates
      const validIds = [...new Set(validation.valid)];
      if (validIds.length === 0) {
        throw new Error('No valid price IDs found');
      }

      console.log(` Using ${validIds.length} unique valid IDs`);

      // Try with smaller batches first - API might have limits
      const batchSize = 10; // Increased batch size since we have valid IDs
      const allIndividualUpdates: IndividualPriceUpdate[] = [];

      for (let i = 0; i < validIds.length; i += batchSize) {
        const batchIds = validIds.slice(i, i + batchSize);
        console.log(` Processing batch ${Math.floor(i / batchSize) + 1}: ${batchIds.length} feeds`);
        
        const batchResult = await this.fetchBatch(batchIds);
        if (batchResult.success && batchResult.data) {
          allIndividualUpdates.push(...batchResult.data);
        } else {
          console.warn(`  Batch ${Math.floor(i / batchSize) + 1} failed: ${batchResult.error}`);
        }
        
        // Small delay between batches to be nice to the API
        if (i + batchSize < validIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (allIndividualUpdates.length === 0) {
        throw new Error('No price updates could be fetched from any batch');
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          individualUpdates: allIndividualUpdates,
          batchBinaryData: allIndividualUpdates.length > 0 ? allIndividualUpdates[0].updateData : '',
          totalFeeds: allIndividualUpdates.length
        },
        timestamp: Date.now(),
        metadata: {
          totalFeeds: priceIds.length,
          successfulFeeds: allIndividualUpdates.length,
          processingTime
        }
      };

    } catch (error) {
      console.error('Error fetching individual price updates:', error);
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
   * Fetch a batch of price updates with multiple fallback methods
   */
  private async fetchBatch(batchIds: string[]): Promise<{ success: boolean; data?: IndividualPriceUpdate[]; error?: string }> {
    const methods = [
      // Method 1: Multiple 'ids[]' parameters (most common REST pattern)
      () => this.tryMethod1(batchIds),
      // Method 2: Individual feeds if batch fails
      () => this.tryIndividualFeeds(batchIds)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(` Trying Method ${i + 1} for batch of ${batchIds.length} feeds...`);
        const result = await methods[i]();
        if (result.success) {
          console.log(` Method ${i + 1} succeeded!`);
          return result;
        }
      } catch (error) {
        console.log(` Method ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return { success: false, error: 'All methods failed for this batch' };
  }

  /**
   * Method 1: Multiple 'ids[]' parameters
   */
  private async tryMethod1(batchIds: string[]): Promise<{ success: boolean; data?: IndividualPriceUpdate[]; error?: string }> {
    const params = new URLSearchParams();
    batchIds.forEach(id => params.append('ids[]', id));
    const url = `${this.baseUrl}/v2/updates/price/latest?${params.toString()}`;

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'pyth-oracle-processor/1.0.0'
      }
    });

    return this.processResponse(response, batchIds);
  }

  /**
   * Method 2: Fetch individual feeds one at a time
   */
  private async tryIndividualFeeds(batchIds: string[]): Promise<{ success: boolean; data?: IndividualPriceUpdate[]; error?: string }> {
    const results: IndividualPriceUpdate[] = [];
    
    for (const feedId of batchIds) {
      try {
        const params = new URLSearchParams();
        params.append('ids[]', feedId);
        const url = `${this.baseUrl}/v2/updates/price/latest?${params.toString()}`;
        
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'pyth-oracle-processor/1.0.0'
          }
        });

        const singleResult = await this.processResponse(response, [feedId]);
        if (singleResult.success && singleResult.data) {
          results.push(...singleResult.data);
        }
        
        // Small delay between individual requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Failed to fetch individual feed ${feedId.slice(0, 10)}...:`, error);
        continue;
      }
    }

    return { 
      success: results.length > 0, 
      data: results,
      error: results.length === 0 ? 'No individual feeds could be fetched' : undefined
    };
  }

  /**
   * Process the HTTP response and extract price updates
   */
  private async processResponse(
    response: any, 
    expectedIds: string[]
  ): Promise<{ success: boolean; data?: IndividualPriceUpdate[]; error?: string }> {
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = response.data;
    if (!data || !data.binary || !data.binary.data) {
      throw new Error('No price update data in response');
    }

    if (!data.parsed || data.parsed.length === 0) {
      throw new Error('No parsed price data in response');
    }

    const individualUpdates: IndividualPriceUpdate[] = [];
    
    for (let i = 0; i < data.parsed.length; i++) {
      const parsed = data.parsed[i];
      if (!parsed || !parsed.id || !parsed.price) {
        console.warn(`Skipping invalid parsed data at index ${i}`);
        continue;
      }
      
      const feedId = parsed.id;
      
      // Use the binary data from the response
      const updateData = data.binary.data[0];
      const processedUpdateData = updateData.startsWith('0x') ? updateData : '0x' + updateData;
      
      individualUpdates.push({
        feedId,
        symbol: this.getFeedSymbol(feedId),
        updateData: processedUpdateData,
        priceInfo: {
          price: parseFloat(parsed.price.price) / Math.pow(10, Math.abs(parsed.price.expo)),
          confidence: parseFloat(parsed.price.conf) / Math.pow(10, Math.abs(parsed.price.expo)),
          expo: parsed.price.expo,
          publishTime: parsed.price.publish_time
        }
      });
    }

    return { success: true, data: individualUpdates };
  }

  /**
   * Validate Pyth price feed IDs
   */
  static validatePriceIds(priceIds: string[]): { valid: string[], invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    priceIds.forEach(id => {
      if (/^0x[a-fA-F0-9]{64}$/.test(id)) {
        valid.push(id);
      } else {
        invalid.push(id);
      }
    });

    return { valid, invalid };
  }

  /**
   * Create selected price updates from a larger set
   */
  static selectPriceUpdates(
    allUpdates: IndividualPriceUpdate[], 
    selectedIndices: number[]
  ): ProcessingResult {
    try {
      const startTime = Date.now();
      
      const selectedUpdates = selectedIndices
        .map(index => allUpdates[index])
        .filter((update): update is IndividualPriceUpdate => 
          update !== undefined && update.updateData !== '0x'
        );

      if (selectedUpdates.length === 0) {
        throw new Error('No valid updates selected');
      }

      const batchUpdateData = this.createBatchUpdateData(selectedUpdates);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          selectedUpdates,
          batchUpdateData,
          individualUpdateData: selectedUpdates.map(u => u.updateData),
          originalCount: allUpdates.length,
          selectedCount: selectedUpdates.length,
          feedIds: selectedUpdates.map(u => u.feedId)
        },
        timestamp: Date.now(),
        metadata: {
          totalFeeds: allUpdates.length,
          selectedFeeds: selectedUpdates.length,
          processingTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private static createBatchUpdateData(updates: IndividualPriceUpdate[]): string {
    return JSON.stringify(updates.map(u => u.updateData));
  }

  static createUpdatePriceFeedsCalldata(updates: IndividualPriceUpdate[]): string {
    const functionSelector = '0xa9852bcc';
    const updateDataArray = updates.map(u => u.updateData);
    const encodedArray = this.encodeBytes32Array(updateDataArray);
    return functionSelector + encodedArray;
  }

  private static encodeBytes32Array(dataArray: string[]): string {
    const arrayLength = dataArray.length.toString(16).padStart(64, '0');
    let encoded = arrayLength;
    
    dataArray.forEach(data => {
      const cleanData = data.startsWith('0x') ? data.slice(2) : data;
      const length = (cleanData.length / 2).toString(16).padStart(64, '0');
      const paddedData = cleanData.padEnd(Math.ceil(cleanData.length / 64) * 64, '0');
      encoded += length + paddedData;
    });
    
    return encoded;
  }

  static estimateGasCost(updateCount: number): number {
    const baseCost = 100000;
    const perUpdateCost = 50000;
    return baseCost + (updateCount * perUpdateCost);
  }

  static validateUpdateData(updateData: string): boolean {
    try {
      if (!updateData.startsWith('0x')) {
        return false;
      }
      
      const data = updateData.slice(2);
      if (data.length < 100) {
        return false;
      }
      
      Buffer.from(data, 'hex');
      return true;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Get symbol for feed ID - UPDATED with new mappings
   */
  private getFeedSymbol(feedId: string): string {
    const symbolMap: Record<string, string> = {
      // Crypto feeds (updated with new IDs)
      '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43': 'BTC/USD',
      '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace': 'ETH/USD',
      '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d': 'SOL/USD',
      '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b': 'USDT/USD',
      '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a': 'USDC/USD',
      '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d': 'ADA/USD',
      '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221': 'LINK/USD',
      '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501': 'UNI/USD',
      '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c': 'DOGE/USD',
      '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7': 'AVAX/USD',
      '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f': 'BNB/USD',
      
      // Equity feeds
      '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688': 'AAPL/USD',
      '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1': 'TSLA/USD',
      '0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1': 'MSFT/USD',
      '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593': 'NVDA/USD',
      '0xb5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a': 'AMZN/USD',
      
      // Commodity feeds
      '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2': 'XAU/USD',
      '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e': 'XAG/USD',
      
      // Forex feeds (updated with new EUR/USD ID)
      '0x84755269cafa0a552ce2962c5ac7369a4da7aef57a01379b87736698387b793b': 'EUR/USD',
      '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1': 'GBP/USD'
    };
    
    return symbolMap[feedId] || `Unknown(${feedId.slice(0, 8)}...)`;
  }
}

export { IndividualPriceUpdate, PythPriceUpdate };