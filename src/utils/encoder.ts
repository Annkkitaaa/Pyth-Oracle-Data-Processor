import { DecodedPriceUpdate, ProcessingResult, ValidationResult } from '../types';
import { PythDataDecoder } from './decoder';

export class PythDataEncoder {
  
  /**
   * Re-encode price updates for selected feeds only
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

      // Encode each selected update
      const encodedMessages = selectedUpdates.map(update => 
        PythDataDecoder.encodePriceUpdate(update)
      );

      // Create the complete accumulator update structure
      const fullUpdate = this.createAccumulatorUpdate(encodedMessages);
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          selectedUpdates,
          encodedData: fullUpdate.toString('hex'),
          binaryData: fullUpdate,
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
   * Validate that re-encoded data can be parsed correctly
   */
  static validateReencodedData(
    originalUpdates: DecodedPriceUpdate[],
    reencodedHex: string,
    selectedIndices: number[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Convert hex back to buffer and try to decode
      const buffer = Buffer.from(reencodedHex, 'hex');
      
      // Basic structure validation
      if (buffer.length < 11) { // Minimum header size
        errors.push('Re-encoded data is too short');
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

      // Check magic number
      const magic = buffer.readUInt32BE(0);
      if (magic !== 0x504e4155) {
        errors.push('Invalid magic number in re-encoded data');
      }

      // Check number of updates
      const numUpdates = buffer.readUInt16BE(9);
      if (numUpdates !== selectedIndices.length) {
        errors.push(`Expected ${selectedIndices.length} updates, found ${numUpdates}`);
      }

      // Try to decode and compare
      try {
        const mockHermesResponse = {
          binary: {
            encoding: 'hex',
            data: [reencodedHex]
          },
          parsed: []
        };

        const decodeResult = PythDataDecoder.decodePriceUpdates(mockHermesResponse);
        
        if (!decodeResult.success) {
          errors.push(`Failed to decode re-encoded data: ${decodeResult.error}`);
        } else {
          const decodedUpdates = decodeResult.data.decodedUpdates;
          
          // Compare feed IDs
          const expectedFeedIds = selectedIndices.map(i => originalUpdates[i]?.feedId).filter(Boolean);
          const actualFeedIds = decodedUpdates.map((u: DecodedPriceUpdate) => u.feedId);
          
          expectedFeedIds.forEach(expectedId => {
            if (!actualFeedIds.includes(expectedId)) {
              errors.push(`Missing expected feed ID: ${expectedId}`);
            }
          });

          // Check for extra feeds
          if (actualFeedIds.length > expectedFeedIds.length) {
            warnings.push('Re-encoded data contains more feeds than expected');
          }
        }
      } catch (decodeError) {
        errors.push(`Failed to validate by decoding: ${decodeError}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          expectedFeeds: selectedIndices.length,
          actualFeeds: numUpdates,
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
   * Create updatePriceFeeds function call data
   */
  static createUpdatePriceFeedsCalldata(encodedUpdate: string): string {
    // This creates the calldata for calling updatePriceFeeds(bytes calldata updateData)
    // The function selector for updatePriceFeeds is typically 0xa9852bcc
    
    const functionSelector = '0xa9852bcc';
    
    // Encode the bytes parameter
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
      process: 'Pyth Price Feed Re-encoding',
      originalFeedCount: originalCount,
      selectedFeedCount: selectedCount,
      selectedIndices,
      selectedFeedIds: feedIds,
      encodedDataSize: dataSize,
      estimatedGasCost: this.estimateGasCost(selectedCount),
      timestamp: new Date().toISOString(),
      summary: `Successfully re-encoded ${selectedCount} of ${originalCount} price feeds`
    };
  }
}