import { PythDataEncoder } from '../src/utils/encoder';
import { DecodedPriceUpdate } from '../src/types';

describe('PythDataEncoder', () => {
  
  const mockUpdates: DecodedPriceUpdate[] = [
    {
      feedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      priceValue: BigInt('6140993501000'),
      confidence: BigInt('3287868567'),
      exponent: -8,
      publishTime: 1714746101,
      emaPrice: BigInt('6094004700000'),
      emaConfidence: BigInt('3792887800'),
      slot: 138881186
    },
    {
      feedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      priceValue: BigInt('4959503'),
      confidence: BigInt('5465'),
      exponent: -8,
      publishTime: 1714746101,
      emaPrice: BigInt('4982594'),
      emaConfidence: BigInt('5536'),
      slot: 138881186
    },
    {
      feedId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      priceValue: BigInt('100000000'),
      confidence: BigInt('50000'),
      exponent: -8,
      publishTime: 1714746101,
      emaPrice: BigInt('100000000'),
      emaConfidence: BigInt('50000'),
      slot: 138881186
    }
  ];

  describe('reencodeSelectedFeeds', () => {
    it('should successfully re-encode selected feeds', () => {
      const selectedIndices = [0, 2]; // Select first and third feeds
      
      const result = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, selectedIndices);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.selectedCount).toBe(2);
      expect(result.data.originalCount).toBe(3);
      expect(result.data.encodedData).toBeDefined();
      expect(result.data.binaryData).toBeInstanceOf(Buffer);
    });

    it('should handle empty selection', () => {
      const result = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, []);
      
      expect(result.success).toBe(true);
      expect(result.data.selectedCount).toBe(0);
    });

    it('should handle invalid indices gracefully', () => {
      const invalidIndices = [10, 20]; // Indices that don't exist
      
      const result = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, invalidIndices);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should preserve selected feed data', () => {
      const selectedIndices = [1]; // Select second feed
      
      const result = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, selectedIndices);
      
      expect(result.success).toBe(true);
      expect(result.data.selectedUpdates).toHaveLength(1);
      expect(result.data.selectedUpdates[0].feedId).toBe(mockUpdates[1].feedId);
      expect(result.data.feedIds).toEqual([mockUpdates[1].feedId]);
    });
  });

  describe('validateReencodedData', () => {
    it('should validate correctly re-encoded data', () => {
      const selectedIndices = [0, 1];
      const encodeResult = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, selectedIndices);
      
      expect(encodeResult.success).toBe(true);
      
      const validation = PythDataEncoder.validateReencodedData(
        mockUpdates,
        encodeResult.data.encodedData,
        selectedIndices
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
      expect(validation.metadata.expectedFeeds).toBe(2);
    });

    it('should detect invalid hex data', () => {
      const invalidHex = 'not-valid-hex';
      
      const validation = PythDataEncoder.validateReencodedData(
        mockUpdates,
        invalidHex,
        [0]
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect incorrect feed count', () => {
      // Create valid-looking hex but with wrong structure
      const wrongCountHex = '504e41550100000000000002'; // Valid header but claims 2 feeds when we expect 1
      
      const validation = PythDataEncoder.validateReencodedData(
        mockUpdates,
        wrongCountHex,
        [0] // Expecting 1 feed
      );
      
      expect(validation.isValid).toBe(false);
    });

    it('should handle too-short data', () => {
      const tooShort = '504e4155'; // Just magic number
      
      const validation = PythDataEncoder.validateReencodedData(
        mockUpdates,
        tooShort,
        [0]
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Re-encoded data is too short');
    });
  });

  describe('createUpdatePriceFeedsCalldata', () => {
    it('should create valid EVM calldata', () => {
      const encodedUpdate = '504e41550100000000000001'; // Minimal valid update
      
      const calldata = PythDataEncoder.createUpdatePriceFeedsCalldata(encodedUpdate);
      
      expect(calldata).toMatch(/^0xa9852bcc/); // updatePriceFeeds function selector
      expect(calldata.length).toBeGreaterThan(200); // Should have offset, length, and data
    });

    it('should handle hex strings with and without 0x prefix', () => {
      const update = '504e41550100000000000001';
      
      const calldata1 = PythDataEncoder.createUpdatePriceFeedsCalldata(update);
      const calldata2 = PythDataEncoder.createUpdatePriceFeedsCalldata('0x' + update);
      
      expect(calldata1).toBe(calldata2);
    });

    it('should properly pad data to 32-byte boundary', () => {
      const update = '504e4155'; // 4 bytes, should be padded
      
      const calldata = PythDataEncoder.createUpdatePriceFeedsCalldata(update);
      
      expect(calldata).toMatch(/^0xa9852bcc/);
      // The data section should be padded to end on 32-byte boundary
      expect((calldata.length - 10) % 64).toBe(0); // -10 for 0x and function selector, then check padding
    });
  });

  describe('estimateGasCost', () => {
    it('should provide reasonable gas estimates', () => {
      expect(PythDataEncoder.estimateGasCost(1)).toBe(80000);  // 50k base + 30k per feed
      expect(PythDataEncoder.estimateGasCost(5)).toBe(200000); // 50k base + 150k for 5 feeds
      expect(PythDataEncoder.estimateGasCost(0)).toBe(50000);  // Just base cost
    });

    it('should scale linearly with feed count', () => {
      const cost1 = PythDataEncoder.estimateGasCost(1);
      const cost2 = PythDataEncoder.estimateGasCost(2);
      
      expect(cost2 - cost1).toBe(30000); // Per-feed cost
    });
  });

  describe('createSummary', () => {
    it('should create comprehensive summary', () => {
      const summary = PythDataEncoder.createSummary(
        10,      // originalCount
        3,       // selectedCount
        [0, 5, 9], // selectedIndices
        ['0xabc...', '0xdef...', '0x123...'], // feedIds
        1024     // dataSize
      );
      
      expect(summary).toMatchObject({
        process: 'Pyth Price Feed Re-encoding',
        originalFeedCount: 10,
        selectedFeedCount: 3,
        selectedIndices: [0, 5, 9],
        selectedFeedIds: ['0xabc...', '0xdef...', '0x123...'],
        encodedDataSize: 1024,
        estimatedGasCost: 140000, // 50k + 3 * 30k
        summary: 'Successfully re-encoded 3 of 10 price feeds'
      });
      
      expect(summary).toHaveProperty('timestamp');
    });
  });

  describe('Error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const result = PythDataEncoder.reencodeSelectedFeeds(null as any, [0]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty updates array', () => {
      const result = PythDataEncoder.reencodeSelectedFeeds([], [0]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide meaningful error messages', () => {
      const result = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, [100]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not find all requested updates');
    });
  });

  describe('Integration with actual encoded data', () => {
    it('should create valid accumulator update structure', () => {
      const selectedIndices = [0, 1];
      const result = PythDataEncoder.reencodeSelectedFeeds(mockUpdates, selectedIndices);
      
      expect(result.success).toBe(true);
      
      const buffer = result.data.binaryData;
      
      // Check magic number
      const magic = buffer.readUInt32BE(0);
      expect(magic).toBe(0x504e4155); // "PNAU"
      
      // Check version
      const majorVersion = buffer.readUInt16BE(4);
      const minorVersion = buffer.readUInt16BE(6);
      expect(majorVersion).toBe(1);
      expect(minorVersion).toBe(0);
      
      // Check number of updates
      const numUpdates = buffer.readUInt16BE(9);
      expect(numUpdates).toBe(2);
    });
  });
});