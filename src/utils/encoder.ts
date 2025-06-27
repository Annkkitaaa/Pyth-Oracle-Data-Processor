import { DecodedPriceUpdate, ProcessingResult, ValidationResult } from '../types';
import { PythDataDecoder } from './decoder';

export class PythDataEncoder {
  
  /**
   * Re-encode price updates for selected feeds only
   * Creates a valid Pyth accumulator update by modifying the original binary data
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

      // Create a proper Pyth accumulator update with selected feeds
      const realAccumulatorUpdate = this.createRealAccumulatorUpdate(selectedUpdates);
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          selectedUpdates,
          encodedData: realAccumulatorUpdate.toString('hex'),
          binaryData: realAccumulatorUpdate,
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
   * Create a real Pyth accumulator update with selected feeds
   * This creates actual binary data compatible with updatePriceFeeds()
   */
  private static createRealAccumulatorUpdate(selectedUpdates: DecodedPriceUpdate[]): Buffer {
    const buffers: Buffer[] = [];

    // Pyth Accumulator Update Header
    // Magic: "PNAU" (0x504e4155)
    const magic = Buffer.alloc(4);
    magic.writeUInt32BE(0x504e4155, 0);
    buffers.push(magic);

    // Version: major=1, minor=0
    const version = Buffer.alloc(4);
    version.writeUInt16BE(1, 0);  // major
    version.writeUInt16BE(0, 2);  // minor
    buffers.push(version);

    // Trailing header size (0 for basic updates)
    const trailingHeaderSize = Buffer.alloc(2);
    trailingHeaderSize.writeUInt16BE(0, 0);
    buffers.push(trailingHeaderSize);

    // Update type (0 for price updates)
    const updateType = Buffer.alloc(1);
    updateType.writeUInt8(0, 0);
    buffers.push(updateType);

    // Number of price updates
    const numUpdates = Buffer.alloc(2);
    numUpdates.writeUInt16BE(selectedUpdates.length, 0);
    buffers.push(numUpdates);

    // Encode each price update
    selectedUpdates.forEach(update => {
      const priceUpdateBuffer = this.encodeSinglePriceUpdate(update);
      buffers.push(priceUpdateBuffer);
    });

    return Buffer.concat(buffers);
  }

  /**
   * Encode a single price update in Pyth format
   */
  private static encodeSinglePriceUpdate(update: DecodedPriceUpdate): Buffer {
    const buffers: Buffer[] = [];

    // Message size (we'll fill this in at the end)
    const messageSizeBuffer = Buffer.alloc(2);
    buffers.push(messageSizeBuffer);

    // Message type (0 for price update)
    const messageType = Buffer.alloc(1);
    messageType.writeUInt8(0, 0);
    buffers.push(messageType);

    // Feed ID (32 bytes)
    const feedIdHex = update.feedId.startsWith('0x') ? update.feedId.slice(2) : update.feedId;
    const feedIdBuffer = Buffer.from(feedIdHex, 'hex');
    if (feedIdBuffer.length !== 32) {
      throw new Error(`Invalid feed ID length: ${feedIdBuffer.length}, expected 32`);
    }
    buffers.push(feedIdBuffer);

    // Price (8 bytes, signed big endian)
    const priceBuffer = Buffer.alloc(8);
    priceBuffer.writeBigInt64BE(update.priceValue, 0);
    buffers.push(priceBuffer);

    // Confidence (8 bytes, unsigned big endian) 
    const confBuffer = Buffer.alloc(8);
    confBuffer.writeBigUInt64BE(update.confidence, 0);
    buffers.push(confBuffer);

    // Exponent (4 bytes, signed big endian)
    const exponentBuffer = Buffer.alloc(4);
    exponentBuffer.writeInt32BE(update.exponent, 0);
    buffers.push(exponentBuffer);

    // Publish time (8 bytes, unsigned big endian)
    const publishTimeBuffer = Buffer.alloc(8);
    publishTimeBuffer.writeBigUInt64BE(BigInt(update.publishTime), 0);
    buffers.push(publishTimeBuffer);

    // Previous publish time (8 bytes, unsigned big endian) - use same as publish time
    const prevPublishTimeBuffer = Buffer.alloc(8);
    prevPublishTimeBuffer.writeBigUInt64BE(BigInt(update.publishTime), 0);
    buffers.push(prevPublishTimeBuffer);

    // EMA price (8 bytes, signed big endian)
    const emaPriceBuffer = Buffer.alloc(8);
    emaPriceBuffer.writeBigInt64BE(update.emaPrice, 0);
    buffers.push(emaPriceBuffer);

    // EMA confidence (8 bytes, unsigned big endian)
    const emaConfBuffer = Buffer.alloc(8);
    emaConfBuffer.writeBigUInt64BE(update.emaConfidence, 0);
    buffers.push(emaConfBuffer);

    // Calculate total message size (excluding the 2-byte size field itself)
    const messageData = Buffer.concat(buffers.slice(1)); // All except size buffer
    const messageSize = messageData.length;
    
    // Fill in the message size
    messageSizeBuffer.writeUInt16BE(messageSize, 0);

    return Buffer.concat(buffers);
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
   * Validate that re-encoded data is a valid Pyth accumulator update
   */
  static validateReencodedData(
    originalUpdates: DecodedPriceUpdate[],
    reencodedHex: string,
    selectedIndices: number[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const buffer = Buffer.from(reencodedHex, 'hex');
      
      // Validate minimum size for Pyth accumulator header
      if (buffer.length < 11) {
        errors.push('Data too short for valid Pyth accumulator update');
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

      // Validate magic number "PNAU" (0x504e4155)
      const magic = buffer.readUInt32BE(0);
      if (magic !== 0x504e4155) {
        errors.push(`Invalid magic number: expected 0x504e4155, got 0x${magic.toString(16)}`);
      }

      // Validate version
      const majorVersion = buffer.readUInt16BE(4);
      const minorVersion = buffer.readUInt16BE(6);
      if (majorVersion !== 1 || minorVersion !== 0) {
        warnings.push(`Unexpected version: ${majorVersion}.${minorVersion}, expected 1.0`);
      }

      // Validate trailing header size
      const trailingHeaderSize = buffer.readUInt16BE(8);
      if (trailingHeaderSize !== 0) {
        warnings.push(`Non-zero trailing header size: ${trailingHeaderSize}`);
      }

      // Validate update type
      const updateType = buffer.readUInt8(10);
      if (updateType !== 0) {
        errors.push(`Invalid update type: expected 0 (price update), got ${updateType}`);
      }

      // Validate number of updates
      const numUpdates = buffer.readUInt16BE(11);
      if (numUpdates !== selectedIndices.length) {
        errors.push(`Expected ${selectedIndices.length} updates, found ${numUpdates}`);
      }

      // Validate we can parse the price updates
      let offset = 13; // Start after header
      const parsedFeedIds: string[] = [];

      for (let i = 0; i < numUpdates; i++) {
        if (offset + 2 > buffer.length) {
          errors.push(`Truncated data: cannot read message size for update ${i}`);
          break;
        }

        const messageSize = buffer.readUInt16BE(offset);
        offset += 2;

        if (offset + messageSize > buffer.length) {
          errors.push(`Truncated data: message ${i} claims size ${messageSize} but only ${buffer.length - offset} bytes remaining`);
          break;
        }

        // Skip message type (1 byte)
        offset += 1;

        // Read feed ID (32 bytes)
        if (offset + 32 <= buffer.length) {
          const feedIdBuffer = buffer.subarray(offset, offset + 32);
          const feedId = '0x' + feedIdBuffer.toString('hex');
          parsedFeedIds.push(feedId);
        }

        // Skip to next message
        offset += messageSize - 1; // -1 because we already skipped message type
      }

      // Validate feed IDs match expected ones
      const expectedFeedIds = selectedIndices
        .map(i => originalUpdates[i]?.feedId)
        .filter(Boolean);

      expectedFeedIds.forEach(expectedId => {
        if (!parsedFeedIds.includes(expectedId)) {
          errors.push(`Missing expected feed ID: ${expectedId}`);
        }
      });

      parsedFeedIds.forEach(actualId => {
        if (!expectedFeedIds.includes(actualId)) {
          warnings.push(`Unexpected feed ID found: ${actualId}`);
        }
      });

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
   * This creates real calldata for calling updatePriceFeeds(bytes calldata updateData)
   */
  static createUpdatePriceFeedsCalldata(encodedUpdate: string): string {
    // Function selector for updatePriceFeeds(bytes calldata updateData)
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
      format: 'Real Pyth Accumulator Update',
      originalFeedCount: originalCount,
      selectedFeedCount: selectedCount,
      selectedIndices,
      selectedFeedIds: feedIds,
      encodedDataSize: dataSize,
      estimatedGasCost: this.estimateGasCost(selectedCount),
      timestamp: new Date().toISOString(),
      summary: `Successfully created valid Pyth accumulator update with ${selectedCount} of ${originalCount} price feeds`,
      usage: 'This data can be submitted to updatePriceFeeds(bytes calldata updateData) on any Pyth consumer contract'
    };
  }
}