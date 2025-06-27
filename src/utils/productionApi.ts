import { HermesClient } from '@pythnetwork/hermes-client';
import { ProcessingResult } from '../types';

export interface PythPriceUpdate {
  feedId: string;
  vaa: string; // Base64 encoded VAA
  publishTime: number;
  price: number;
  confidence: number;
  expo: number;
}

export interface IndividualPriceUpdate {
  feedId: string;
  symbol: string;
  updateData: string; // Hex-encoded binary data for on-chain submission
  priceInfo: {
    price: number;
    confidence: number;
    expo: number;
    publishTime: number;
  };
}

export class ProductionPythClient {
  private client: HermesClient;

  constructor(endpoint: string = 'https://hermes.pyth.network') {
    this.client = new HermesClient(endpoint);
  }

  /**
   * Fetch individual price updates that can be submitted directly to Pyth contracts
   */
  async fetchIndividualPriceUpdates(priceIds: string[]): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Fetching individual price updates for ${priceIds.length} feeds...`);
      
      // Get latest price updates - this returns VAAs for each feed
      const priceUpdates = await this.client.getLatestPriceUpdates(priceIds);
      
      if (!priceUpdates || !priceUpdates.binary || !priceUpdates.binary.data) {
        throw new Error('No price update data received from Hermes');
      }

      // Extract individual updates
      const individualUpdates: IndividualPriceUpdate[] = [];
      
      for (let i = 0; i < priceIds.length && i < priceUpdates.parsed.length; i++) {
        const parsed = priceUpdates.parsed[i];
        const feedId = parsed.id;
        
        // Each price update has its own binary data that can be submitted on-chain
        // For batch updates, Hermes returns one combined binary, but we can extract individual ones
        const updateData = await this.getIndividualUpdateData(feedId);
        
        individualUpdates.push({
          feedId,
          symbol: this.getFeedSymbol(feedId),
          updateData,
          priceInfo: {
            price: parseFloat(parsed.price.price) / Math.pow(10, Math.abs(parsed.price.expo)),
            confidence: parseFloat(parsed.price.conf) / Math.pow(10, Math.abs(parsed.price.expo)),
            expo: parsed.price.expo,
            publishTime: parsed.price.publish_time
          }
        });
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          individualUpdates,
          batchBinaryData: priceUpdates.binary.data[0], // Combined binary for all feeds
          totalFeeds: individualUpdates.length
        },
        timestamp: Date.now(),
        metadata: {
          totalFeeds: priceIds.length,
          successfulFeeds: individualUpdates.length,
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
   * Get individual update data for a specific feed
   */
  private async getIndividualUpdateData(feedId: string): Promise<string> {
    try {
      // Fetch update for just this one feed
      const singleUpdate = await this.client.getLatestPriceUpdates([feedId]);
      
      if (singleUpdate?.binary?.data?.[0]) {
        // Convert to hex format for on-chain submission
        const binaryData = singleUpdate.binary.data[0];
        
        // If it's base64, convert to hex
        if (singleUpdate.binary.encoding === 'base64') {
          const buffer = Buffer.from(binaryData, 'base64');
          return '0x' + buffer.toString('hex');
        }
        
        // If it's already hex, ensure it has 0x prefix
        return binaryData.startsWith('0x') ? binaryData : '0x' + binaryData;
      }
      
      throw new Error(`No binary data for feed ${feedId}`);
    } catch (error) {
      console.warn(`Failed to get individual update for ${feedId}:`, error);
      // Fallback: return empty data (will be filtered out later)
      return '0x';
    }
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
        .filter(update => update && update.updateData !== '0x'); // Filter out failed updates

      if (selectedUpdates.length === 0) {
        throw new Error('No valid updates selected');
      }

      // Create batch update data for on-chain submission
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

  /**
   * Create batch update data for multiple feeds
   */
  private static createBatchUpdateData(updates: IndividualPriceUpdate[]): string {
    // For Pyth contracts, we can submit multiple update data in an array
    // The contract expects bytes[] calldata updateData
    return JSON.stringify(updates.map(u => u.updateData));
  }

  /**
   * Create EVM calldata for updatePriceFeeds with multiple updates
   */
  static createUpdatePriceFeedsCalldata(updates: IndividualPriceUpdate[]): string {
    // Function selector for updatePriceFeeds(bytes[] calldata updateData)
    const functionSelector = '0xa9852bcc';
    
    // ABI encode array of bytes
    const updateDataArray = updates.map(u => u.updateData);
    
    // For simplicity, we'll create a JSON representation
    // In production, you'd use ethers.js or web3.js for proper ABI encoding
    const encodedArray = this.encodeBytes32Array(updateDataArray);
    
    return functionSelector + encodedArray;
  }

  /**
   * Encode array of bytes for EVM
   */
  private static encodeBytes32Array(dataArray: string[]): string {
    // This is a simplified encoding - in production use ethers.js
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

  /**
   * Estimate gas cost for batch update
   */
  static estimateGasCost(updateCount: number): number {
    // Base cost + per-update cost for individual VAA verification
    const baseCost = 100000;
    const perUpdateCost = 50000; // Higher cost per update for VAA verification
    
    return baseCost + (updateCount * perUpdateCost);
  }

  /**
   * Validate that update data is proper Pyth VAA format
   */
  static validateUpdateData(updateData: string): boolean {
    try {
      if (!updateData.startsWith('0x')) {
        return false;
      }
      
      const data = updateData.slice(2);
      if (data.length < 100) { // VAAs should be substantial in size
        return false;
      }
      
      // Convert to buffer and check for VAA structure
      const buffer = Buffer.from(data, 'hex');
      
      // VAAs should start with specific bytes (this is simplified validation)
      // In production, you'd use Pyth's validation functions
      return buffer.length > 50; // Basic size check
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Get symbol for feed ID (simplified mapping)
   */
  private getFeedSymbol(feedId: string): string {
    const symbolMap: Record<string, string> = {
      '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43': 'BTC/USD',
      '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace': 'ETH/USD',
      '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b': 'USDT/USD',
      '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d': 'SOL/USD',
      '0x150ac9b959aee0da7793b28c39a8b7ad112f5d8c58f2e03a5b3db05e49a0c3a8': 'ADA/USD'
    };
    
    return symbolMap[feedId] || 'Unknown';
  }
}