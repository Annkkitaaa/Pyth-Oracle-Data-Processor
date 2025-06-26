import { HermesApiClient } from '../src/utils/api';
import { PRICE_FEEDS } from '../src/config/priceFeeds';

describe('HermesApiClient', () => {
  let client: HermesApiClient;

  beforeEach(() => {
    client = new HermesApiClient();
  });

  describe('validatePriceIds', () => {
    it('should validate correct price feed IDs', () => {
      const validIds = [
        '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
      ];

      const result = HermesApiClient.validatePriceIds(validIds);
      
      expect(result.valid).toEqual(validIds);
      expect(result.invalid).toEqual([]);
    });

    it('should identify invalid price feed IDs', () => {
      const invalidIds = [
        '0xinvalid',
        'not-a-hex-string',
        '0x123', // too short
        'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' // missing 0x
      ];

      const result = HermesApiClient.validatePriceIds(invalidIds);
      
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(invalidIds);
    });

    it('should handle mixed valid and invalid IDs', () => {
      const mixedIds = [
        '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // valid
        '0xinvalid', // invalid
        '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'  // valid
      ];

      const result = HermesApiClient.validatePriceIds(mixedIds);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0]).toBe('0xinvalid');
    });
  });

  describe('configuration validation', () => {
    it('should have valid price feed IDs in config', () => {
      const priceIds = PRICE_FEEDS.map(feed => feed.id);
      const result = HermesApiClient.validatePriceIds(priceIds);
      
      expect(result.invalid).toEqual([]);
      expect(result.valid).toHaveLength(PRICE_FEEDS.length);
    });

    it('should have 20 configured price feeds', () => {
      expect(PRICE_FEEDS).toHaveLength(20);
    });

    it('should have diverse asset types', () => {
      const assetTypes = new Set(PRICE_FEEDS.map(feed => feed.assetType));
      
      expect(assetTypes.has('crypto')).toBe(true);
      expect(assetTypes.has('equity')).toBe(true);
      expect(assetTypes.has('commodity')).toBe(true);
      expect(assetTypes.has('forex')).toBe(true);
    });
  });

  describe('API client configuration', () => {
    it('should use default configuration', () => {
      const defaultClient = new HermesApiClient();
      
      expect(defaultClient['config'].baseUrl).toBe('https://hermes.pyth.network');
      expect(defaultClient['config'].timeout).toBe(30000);
      expect(defaultClient['config'].retryAttempts).toBe(3);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        timeout: 60000,
        retryAttempts: 5
      };
      
      const customClient = new HermesApiClient(customConfig);
      
      expect(customClient['config'].timeout).toBe(60000);
      expect(customClient['config'].retryAttempts).toBe(5);
      expect(customClient['config'].baseUrl).toBe('https://hermes.pyth.network'); // Should keep default
    });
  });
});

// Integration test (will be skipped in CI unless explicitly enabled)
describe('HermesApiClient Integration', () => {
  const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

  if (!runIntegrationTests) {
    it.skip('Integration tests skipped (set RUN_INTEGRATION_TESTS=true to enable)', () => {});
    return;
  }

  let client: HermesApiClient;

  beforeEach(() => {
    client = new HermesApiClient();
  });

  it('should fetch real price data from Hermes API', async () => {
    const testPriceIds = [
      '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' // BTC/USD
    ];

    const result = await client.fetchLatestPriceUpdates(testPriceIds);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.binary).toBeDefined();
    expect(result.data.parsed).toBeDefined();
    expect(result.data.parsed).toHaveLength(1);
  }, 30000); // 30 second timeout for API call
});