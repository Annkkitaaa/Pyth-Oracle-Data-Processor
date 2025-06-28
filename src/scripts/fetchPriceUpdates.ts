import fs from 'fs/promises';
import path from 'path';
import { HermesApiClient } from '../utils/api';
import { getAllPriceFeedIds, PRICE_FEEDS } from '../config/priceFeeds';
import { OUTPUT_PATHS } from '../config/constants';

async function fetchPriceUpdates() {
  console.log(' Starting price update fetch process...');
  console.log('='.repeat(50));

  try {
    // Initialize API client
    const client = new HermesApiClient();
    
    // Get all 20 price feed IDs
    const priceIds = getAllPriceFeedIds();
    console.log(` Fetching updates for ${priceIds.length} price feeds:`);
    
    // Display the feeds we're fetching
    PRICE_FEEDS.forEach((feed, index) => {
      console.log(`   ${index + 1}. ${feed.symbol} (${feed.assetType})`);
    });
    console.log();

    // Validate price feed IDs
    const validation = HermesApiClient.validatePriceIds(priceIds);
    if (validation.invalid.length > 0) {
      console.warn(`  Warning: Found ${validation.invalid.length} invalid price IDs:`);
      validation.invalid.forEach(id => console.warn(`   - ${id}`));
    }

    // Fetch price updates
    console.log(' Fetching latest price updates from Hermes API...');
    const result = await client.fetchLatestPriceUpdates(validation.valid);

    if (!result.success) {
      throw new Error(`Failed to fetch price updates: ${result.error}`);
    }

    // Prepare output data
    const outputData = {
      fetchTimestamp: new Date().toISOString(),
      totalFeeds: priceIds.length,
      successfulFeeds: result.data.parsed?.length || 0,
      processingTime: result.metadata?.processingTime,
      priceFeeds: PRICE_FEEDS,
      hermesResponse: result.data,
      metadata: {
        fetchedAt: result.timestamp,
        apiEndpoint: 'https://hermes.pyth.network/v2/updates/price/latest',
        dataFormat: 'Pyth Accumulator Update'
      }
    };

    // Ensure data directory exists
    const dataDir = path.dirname(OUTPUT_PATHS.RAW_DATA);
    await fs.mkdir(dataDir, { recursive: true });

    // Save raw data
    await fs.writeFile(
      OUTPUT_PATHS.RAW_DATA,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );

    // Display results
    console.log(' Price update fetch completed successfully!');
    console.log(` Raw data saved to: ${OUTPUT_PATHS.RAW_DATA}`);
    console.log(`  Processing time: ${result.metadata?.processingTime}ms`);
    console.log(` Successfully fetched updates for ${outputData.successfulFeeds} feeds`);
    
    // Display binary data info
    if (result.data.binary?.data?.[0]) {
      const binarySize = result.data.binary.data[0].length;
      console.log(`Binary data size: ${binarySize} characters (${binarySize / 2} bytes)`);
    }

    // Display sample of parsed data
    if (result.data.parsed?.length > 0) {
      console.log('\n Sample of fetched price data:');
      result.data.parsed.slice(0, 3).forEach((update: any) => {
        const symbol = PRICE_FEEDS.find(f => f.id === update.id)?.symbol || 'Unknown';
        const price = parseFloat(update.price.price) / Math.pow(10, Math.abs(update.price.expo));
        console.log(`   ${symbol}: $${price.toFixed(2)} (±${update.price.conf})`);
      });
    }

    console.log('\n Next step: Run `npm run decode` to decode the binary data');
    
  } catch (error) {
    console.error(' Error fetching price updates:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fetchPriceUpdates();
}

export default fetchPriceUpdates;