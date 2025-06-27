import { DecodedPriceUpdate, ProcessingResult, ValidationResult } from '../types';
import { PythDataDecoder } from './decoder';

export class PythDataEncoder {
  
  /**
   * Re-encode price updates for selected feeds only
   * Note: This creates a demonstration format for educational purposes
   */
  static reencodeSelectedFeeds(
    allUpdates: DecodedPriceUpdate[],
    selectedIndices: number[]
  ): ProcessingResult {
    try {
      const startTime = Date.now();
      
      console.log(`Re-encoding ${selectedIndices.length} feeds from ${allUpdates.length} total updates`);
      
      // Select the specified updates
      const selectedUpdates = selectedIndices
        .map(index => allUpdates[index])
        .filter((update): update is DecodedPriceUpdate => update !== undefined);

      if (selectedUpdates.length !== selectedIndices.length) {
        throw new Error(`Could not find all requested updates. Found ${selectedUpdates.length} of ${selectedIndices.length}`);
      }

      // Create a simplified demonstration format
      // In production, you'd use Pyth's official SDK for proper encoding
      const demoEncodedData = this.createDemonstrationFormat(selectedUpdates);
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          selectedUpdates,
          encodedData: demoEncodedData,
          binaryData: Buffer.from(demoEncodedData, 'hex'),
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
      console.error('Error re-encoding price updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Create a demonstration format for educational purposes
   * Note: In production, use Pyth's official SDK for proper encoding
   */
  private static createDemonstrationFormat(updates: DecodedPriceUpdate[]): string {
    // Create a simple JSON-based format for demonstration
    const demoFormat = {
      format: 'pyth-demo-v1',
      timestamp: Date.now(),
      feeds: updates.map(update => ({
        id: update.feedId,
        price: update.priceValue.toString(),
        confidence: update.confidence.toString(),
        exponent: update.exponent,
        publishTime: update.publishTime
      }))
    };
    
    // Convert to hex string (simulating binary encoding)
    const jsonString = JSON.stringify(demoFormat);
    return Buffer.from(jsonString, 'utf8').toString('hex');
  }

  /**
   * Create a complete Pyth accumulator update structure
   */
  private static createAccumulatorUpdate(encodedMessages: Buffer[]): Buffer {
    const buffers: Buffer[] = [];

    // Header: Magic number "PNAU" (0x504e4155)
    const magic = Buffer.allocUnsafe(4);
    magic.writeUInt32BE(0x504e4155);
    buffers.push(magic);

    // Version (major.minor)
    const majorVersion = Buffer.allocUnsafe(2);
    majorVersion.writeUInt16BE(1);
    buffers.push(majorVersion);

    const minorVersion = Buffer.allocUnsafe(2);
    minorVersion.writeUInt16BE(0);
    buffers.push(minorVersion);

    // Trailing header size
    const trailingHeaderSize = Buffer.allocUnsafe(2);
    trailingHeaderSize.writeUInt16BE(0);
    buffers.push(trailingHeaderSize);

    // Update type (0 for price update)
    const updateType = Buffer.from([0x00]);
    buffers.push(updateType);

    // Number of updates
    const numUpdates = Buffer.allocUnsafe(2);
    numUpdates.writeUInt16BE(encodedMessages.length);
    buffers.push(numUpdates);

    // Add all encoded messages
    encodedMessages.forEach(message => {
      buffers.push(message);
    });

    return Buffer.concat(buffers);
  }

  /**
   * Validate that re-encoded data contains the expected information
   * Note: This validates our demonstration format
   */
  static validateReencodedData(
    originalUpdates: DecodedPriceUpdate[],
    reencodedHex: string,
    selectedIndices: number[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Convert hex back to JSON and parse our demonstration format
      const buffer = Buffer.from(reencodedHex, 'hex');
      const jsonString = buffer.toString('utf8');
      const demoData = JSON.parse(jsonString);
      
      // Validate our demonstration format
      if (demoData.format !== 'pyth-demo-v1') {
        errors.push('Invalid demonstration format identifier');
      }
      
      if (!demoData.feeds || !Array.isArray(demoData.feeds)) {
        errors.push('Missing or invalid feeds array');
        return {
          isValid: false,
          errors,
          warnings,
          metadata: {
            expectedFeeds: selectedIndices.length,
            actualFeeds: 0,
            dataSize: buffer.length
          }
        };
      }

      const actualFeeds = demoData.feeds.length;
      if (actualFeeds !== selectedIndices.length) {
        errors.push(`Expected ${selectedIndices.length} feeds, found ${actualFeeds}`);
      }

      // Validate feed IDs match expected ones
      const expectedFeedIds = selectedIndices.map(i => originalUpdates[i]?.feedId).filter(Boolean);
      const actualFeedIds = demoData.feeds.map((f: any) => f.id);
      
      expectedFeedIds.forEach(expectedId => {
        if (!actualFeedIds.includes(expectedId)) {
          errors.push(`Missing expected feed ID: ${expectedId}`);
        }
      });

      // Validate data structure
      demoData.feeds.forEach((feed: any, index: number) => {
        if (!feed.id || !feed.id.startsWith('0x')) {
          errors.push(`Feed ${index}: Invalid ID format`);
        }
        if (!feed.price || !feed.confidence) {
          errors.push(`Feed ${index}: Missing price or confidence data`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          expectedFeeds: selectedIndices.length,
          actualFeeds: actualFeeds,
          dataSize: buffer.length
        }
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        metadata: {
          expectedFeeds: selectedIndices.length,
          actualFeeds: 0,
          dataSize: 0
        }
      };
    }
  }

  /**
   * Create updatePriceFeeds function call data (demonstration format)
   * Note: In production, use Pyth's official SDK for proper calldata generation
   */
  static createUpdatePriceFeedsCalldata(encodedUpdate: string): string {
    // This creates demonstration calldata for educational purposes
    // The function selector for updatePriceFeeds is typically 0xa9852bcc
    
    const functionSelector = '0xa9852bcc';
    
    // For our demonstration format, we'll create valid-looking calldata
    const updateData = encodedUpdate.startsWith('0x') ? encodedUpdate.slice(2) : encodedUpdate;
    
    // ABI encode: offset (32 bytes) + length (32 bytes) + data (padded to 32-byte boundary)
    const offset = '0000000000000000000000000000000000000000000000000000000000000020'; // 32 in hex
    const length = (updateData.length / 2).toString(16).padStart(64, '0');
    
    // Pad data to 32-byte boundary
    const paddingNeeded = (32 - (updateData.length / 2) % 32) % 32;
    const paddedData = updateData + '0'.repeat(paddingNeeded * 2);
    
    return functionSelector + offset + length + paddedData;
  }

  /**
   * Estimate gas cost for the update
   */
  static estimateGasCost(numFeeds: number): number {
    // Base cost + per-feed cost (approximate)
    const baseCost = 50000;
    const perFeedCost = 30000;
    return baseCost + (numFeeds * perFeedCost);
  }

  /**
   * Create a summary of the re-encoding process
   */
  static createSummary(
    originalCount: number,
    selectedCount: number,
    selectedIndices: number[],
    feedIds: string[],
    dataSize: number
  ): object {
    return {
      process: 'Pyth Price Feed Re-encoding (Demonstration)',
      note: 'This demonstration shows the concepts. For production, use Pyth\'s official SDK.',
      originalFeedCount: originalCount,
      selectedFeedCount: selectedCount,
      selectedIndices,
      selectedFeedIds: feedIds,
      encodedDataSize: dataSize,
      estimatedGasCost: this.estimateGasCost(selectedCount),
      timestamp: new Date().toISOString(),
      summary: `Successfully demonstrated re-encoding ${selectedCount} of ${originalCount} price feeds`
    };
  }
}