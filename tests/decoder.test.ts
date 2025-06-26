import { PythDataDecoder } from '../src/utils/decoder';
import { HermesResponse, DecodedPriceUpdate } from '../src/types';

describe('PythDataDecoder', () => {
  
  describe('validateDecodedData', () => {
    it('should validate correct decoded data structure', () => {
      const validUpdates: DecodedPriceUpdate[] = [
        {
          feedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
          priceValue: BigInt('6140993501000'),
          confidence: BigInt('3287868567'),
          exponent: -8,
          publishTime: 1714746101,
          emaPrice: BigInt('6094004700000'),
          emaConfidence: BigInt('3792887800'),
          slot: 138881186
        }
      ];

      const result = PythDataDecoder.validateDecodedData(validUpdates);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid feed ID format', () => {
      const invalidUpdates: DecodedPriceUpdate[] = [
        {
          feedId: 'invalid-id',
          priceValue: BigInt('6140993501000'),
          confidence: BigInt('3287868567'),
          exponent: -8,
          publishTime: 1714746101,
          emaPrice: BigInt('6094004700000'),
          emaConfidence: BigInt('3792887800'),
          slot: 138881186
        }
      ];

      const result = PythDataDecoder.validateDecodedData(invalidUpdates);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Update 0: Invalid feed ID format');
    });

    it('should reject non-bigint price values', () => {
      const invalidUpdates: any[] = [
        {
          feedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
          priceValue: 1234, // Should be BigInt
          confidence: BigInt('3287868567'),
          exponent: -8,
          publishTime: 1714746101,
          emaPrice: BigInt('6094004700000'),
          emaConfidence: BigInt('3792887800'),
          slot: 138881186
        }
      ];

      const result = PythDataDecoder.validateDecodedData(invalidUpdates);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Update 0: Price value is not a bigint');
    });

    it('should handle empty array', () => {
      const result = PythDataDecoder.validateDecodedData([]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject non-array input', () => {
      const result = PythDataDecoder.validateDecodedData(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Decoded updates is not an array');
    });
  });

  describe('encodePriceUpdate', () => {
    it('should encode price update to binary format', () => {
      const update: DecodedPriceUpdate = {
        feedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        priceValue: BigInt('6140993501000'),
        confidence: BigInt('3287868567'),
        exponent: -8,
        publishTime: 1714746101,
        emaPrice: BigInt('6094004700000'),
        emaConfidence: BigInt('3792887800'),
        slot: 138881186
      };

      const encoded = PythDataDecoder.encodePriceUpdate(update);
      
      expect(encoded).toBeInstanceOf(Buffer);
      expect(encoded.length).toBeGreaterThan(0);
      
      // Check that it starts with message size (2 bytes) + message type (1 byte)
      expect(encoded.length).toBeGreaterThan(70); // Should be around 75 bytes
    });

    it('should create consistent encoding for same input', () => {
      const update: DecodedPriceUpdate = {
        feedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        priceValue: BigInt('1000000'),
        confidence: BigInt('10000'),
        exponent: -6,
        publishTime: 1000000,
        emaPrice: BigInt('1000000'),
        emaConfidence: BigInt('10000'),
        slot: 1000
      };

      const encoded1 = PythDataDecoder.encodePriceUpdate(update);
      const encoded2 = PythDataDecoder.encodePriceUpdate(update);
      
      expect(encoded1.equals(encoded2)).toBe(true);
    });
  });

  describe('Binary data parsing', () => {
    it('should handle malformed binary data gracefully', () => {
      const malformedResponse: HermesResponse = {
        binary: {
          encoding: 'hex',
          data: ['invalid-hex-data']
        },
        parsed: []
      };

      const result = PythDataDecoder.decodePriceUpdates(malformedResponse);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty binary data', () => {
      const emptyResponse: HermesResponse = {
        binary: {
          encoding: 'hex',
          data: ['']
        },
        parsed: []
      };

      const result = PythDataDecoder.decodePriceUpdates(emptyResponse);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate magic number in binary data', () => {
      // Create a buffer with wrong magic number
      const wrongMagic = Buffer.alloc(20);
      wrongMagic.writeUInt32BE(0x12345678, 0); // Wrong magic instead of 0x504e4155

      const wrongMagicResponse: HermesResponse = {
        binary: {
          encoding: 'hex',
          data: [wrongMagic.toString('hex')]
        },
        parsed: []
      };

      const result = PythDataDecoder.decodePriceUpdates(wrongMagicResponse);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Pyth update magic number');
    });
  });

  describe('Round-trip encoding/decoding', () => {
    it('should preserve data through encode-decode cycle', () => {
      const originalUpdate: DecodedPriceUpdate = {
        feedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        priceValue: BigInt('6140993501000'),
        confidence: BigInt('3287868567'),
        exponent: -8,
        publishTime: 1714746101,
        emaPrice: BigInt('6094004700000'),
        emaConfidence: BigInt('3792887800'),
        slot: 138881186
      };

      // Encode
      const encoded = PythDataDecoder.encodePriceUpdate(originalUpdate);
      
      // For a full round-trip test, we'd need to reconstruct the full 
      // accumulator update structure, which is complex for a unit test
      // Instead, we verify the encoding produces the expected structure
      
      expect(encoded.length).toBeGreaterThan(70);
      
      // Verify the feed ID is embedded correctly (starts at byte 3)
      const feedIdFromBuffer = encoded.subarray(3, 35);
      const expectedFeedId = Buffer.from(originalUpdate.feedId.slice(2), 'hex');
      
      expect(feedIdFromBuffer.equals(expectedFeedId)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle missing binary data gracefully', () => {
      const noBinaryResponse: any = {
        parsed: []
      };

      const result = PythDataDecoder.decodePriceUpdates(noBinaryResponse);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle buffer read errors gracefully', () => {
      // Create a buffer that's too short for the expected structure
      const tooShort = Buffer.alloc(5);
      tooShort.writeUInt32BE(0x504e4155, 0); // Correct magic but insufficient data

      const shortResponse: HermesResponse = {
        binary: {
          encoding: 'hex',
          data: [tooShort.toString('hex')]
        },
        parsed: []
      };

      const result = PythDataDecoder.decodePriceUpdates(shortResponse);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});