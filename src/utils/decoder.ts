import { HermesResponse, DecodedPriceUpdate, ProcessingResult, PythPriceMessage } from '../types';

export class PythDataDecoder {
  
  /**
   * Decode Hermes binary data into structured format
   */
  static decodePriceUpdates(hermesResponse: HermesResponse): ProcessingResult {
    try {
      const startTime = Date.now();
      const binaryData = hermesResponse.binary.data[0]; // Get the hex string
      const parsedData = hermesResponse.parsed;
      
      console.log(`Decoding binary data of length: ${binaryData.length}`);
      
      // Convert hex string to buffer
      const buffer = Buffer.from(binaryData, 'hex');
      
      // Decode the binary data structure
      const decodedUpdates = this.parsePythAccumulatorUpdate(buffer);
      
      // Merge with parsed data for validation
      const enrichedUpdates = this.enrichWithParsedData(decodedUpdates, parsedData);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          originalBinary: binaryData,
          decodedUpdates: enrichedUpdates,
          feedCount: enrichedUpdates.length,
          buffer: buffer
        },
        timestamp: Date.now(),
        metadata: {
          totalFeeds: enrichedUpdates.length,
          processingTime
        }
      };
    } catch (error) {
      console.error('Error decoding price updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Parse Pyth accumulator update structure
   */
  private static parsePythAccumulatorUpdate(buffer: Buffer): DecodedPriceUpdate[] {
    const updates: DecodedPriceUpdate[] = [];
    let offset = 0;

    // Parse header
    const magic = buffer.readUInt32BE(offset);
    offset += 4;
    
    if (magic !== 0x504e4155) { // "PNAU" in hex
      throw new Error('Invalid Pyth update magic number');
    }

    const majorVersion = buffer.readUInt16BE(offset);
    offset += 2;
    
    const minorVersion = buffer.readUInt16BE(offset);
    offset += 2;

    const trailingHeaderSize = buffer.readUInt16BE(offset);
    offset += 2;

    const updateType = buffer.readUInt8(offset);
    offset += 1;

    // Skip trailing header
    offset += trailingHeaderSize;

    // Parse price updates
    const numUpdates = buffer.readUInt16BE(offset);
    offset += 2;

    for (let i = 0; i < numUpdates; i++) {
      const update = this.parseSinglePriceUpdate(buffer, offset);
      updates.push(update.data);
      offset = update.nextOffset;
    }

    return updates;
  }

  /**
   * Parse a single price update from the buffer
   */
  private static parseSinglePriceUpdate(buffer: Buffer, offset: number): { data: DecodedPriceUpdate, nextOffset: number } {
    // Price update message structure
    const messageSize = buffer.readUInt16BE(offset);
    offset += 2;

    const messageType = buffer.readUInt8(offset);
    offset += 1;

    // Feed ID (32 bytes)
    const feedId = buffer.subarray(offset, offset + 32).toString('hex');
    offset += 32;

    // Price (8 bytes, big endian)
    const priceValue = buffer.readBigInt64BE(offset);
    offset += 8;

    // Confidence (8 bytes, big endian)
    const confidence = buffer.readBigUInt64BE(offset);
    offset += 8;

    // Exponent (4 bytes, signed)
    const exponent = buffer.readInt32BE(offset);
    offset += 4;

    // Publish time (8 bytes)
    const publishTime = Number(buffer.readBigUInt64BE(offset));
    offset += 8;

    // Previous publish time (8 bytes)
    const prevPublishTime = buffer.readBigUInt64BE(offset);
    offset += 8;

    // EMA price (8 bytes)
    const emaPrice = buffer.readBigInt64BE(offset);
    offset += 8;

    // EMA confidence (8 bytes)
    const emaConfidence = buffer.readBigUInt64BE(offset);
    offset += 8;

    return {
      data: {
        feedId: `0x${feedId}`,
        priceValue,
        confidence,
        exponent,
        publishTime,
        emaPrice,
        emaConfidence,
        slot: 0 // Will be enriched from parsed data
      },
      nextOffset: offset
    };
  }

  /**
   * Enrich decoded data with parsed information
   */
  private static enrichWithParsedData(
    decodedUpdates: DecodedPriceUpdate[],
    parsedData: any[]
  ): DecodedPriceUpdate[] {
    return decodedUpdates.map(decoded => {
      const parsed = parsedData.find(p => p.id === decoded.feedId);
      if (parsed) {
        return {
          ...decoded,
          slot: parsed.metadata?.slot || 0
        };
      }
      return decoded;
    });
  }

  /**
   * Convert decoded update back to binary format
   */
  static encodePriceUpdate(update: DecodedPriceUpdate): Buffer {
    const buffers: Buffer[] = [];

    // Message type (1 byte)
    buffers.push(Buffer.from([0x00])); // Price update message type

    // Feed ID (32 bytes)
    const feedIdBuffer = Buffer.from(update.feedId.slice(2), 'hex');
    buffers.push(feedIdBuffer);

    // Price (8 bytes, big endian)
    const priceBuffer = Buffer.allocUnsafe(8);
    priceBuffer.writeBigInt64BE(update.priceValue);
    buffers.push(priceBuffer);

    // Confidence (8 bytes, big endian)
    const confBuffer = Buffer.allocUnsafe(8);
    confBuffer.writeBigUInt64BE(update.confidence);
    buffers.push(confBuffer);

    // Exponent (4 bytes, signed)
    const expoBuffer = Buffer.allocUnsafe(4);
    expoBuffer.writeInt32BE(update.exponent);
    buffers.push(expoBuffer);

    // Publish time (8 bytes)
    const timeBuffer = Buffer.allocUnsafe(8);
    timeBuffer.writeBigUInt64BE(BigInt(update.publishTime));
    buffers.push(timeBuffer);

    // Previous publish time (8 bytes) - use same as publish time
    buffers.push(timeBuffer);

    // EMA price (8 bytes)
    const emaPriceBuffer = Buffer.allocUnsafe(8);
    emaPriceBuffer.writeBigInt64BE(update.emaPrice);
    buffers.push(emaPriceBuffer);

    // EMA confidence (8 bytes)
    const emaConfBuffer = Buffer.allocUnsafe(8);
    emaConfBuffer.writeBigUInt64BE(update.emaConfidence);
    buffers.push(emaConfBuffer);

    const messageData = Buffer.concat(buffers);
    
    // Add message size header
    const sizeBuffer = Buffer.allocUnsafe(2);
    sizeBuffer.writeUInt16BE(messageData.length);
    
    return Buffer.concat([sizeBuffer, messageData]);
  }

  /**
   * Validate decoded data structure
   */
  static validateDecodedData(decodedUpdates: DecodedPriceUpdate[]): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(decodedUpdates)) {
      errors.push('Decoded updates is not an array');
      return { isValid: false, errors };
    }

    decodedUpdates.forEach((update, index) => {
      if (!update.feedId || !update.feedId.startsWith('0x')) {
        errors.push(`Update ${index}: Invalid feed ID format`);
      }
      
      if (typeof update.priceValue !== 'bigint') {
        errors.push(`Update ${index}: Price value is not a bigint`);
      }
      
      if (typeof update.confidence !== 'bigint') {
        errors.push(`Update ${index}: Confidence is not a bigint`);
      }
      
      if (typeof update.exponent !== 'number') {
        errors.push(`Update ${index}: Exponent is not a number`);
      }
      
      if (typeof update.publishTime !== 'number') {
        errors.push(`Update ${index}: Publish time is not a number`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}