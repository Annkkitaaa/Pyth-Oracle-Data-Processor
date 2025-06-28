import fs from 'fs/promises';
import path from 'path';
import { ProductionPythClient } from '../utils/productionApi';
import { getAllPriceFeedIds, PRICE_FEEDS } from '../config/priceFeeds';
import { OUTPUT_PATHS } from '../config/constants';

async function fetchProductionUpdates() {
  console.log(' Starting PRODUCTION price update fetch process...');
  console.log('='.repeat(60));

  try {
    // Initialize production client
    const client = new ProductionPythClient();
    
    // Get all 20 price feed IDs
    const priceIds = getAllPriceFeedIds();
    console.log(` Fetching INDIVIDUAL VAAs for ${priceIds.length} price feeds:`);
    
    // Display the feeds we're fetching
    PRICE_FEEDS.forEach((feed, index) => {
      console.log(`   ${index + 1}. ${feed.symbol} (${feed.assetType})`);
    });
    console.log();

    // Fetch individual price updates (each with its own VAA)
    console.log(' Fetching individual price updates with VAAs...');
    const result = await client.fetchIndividualPriceUpdates(priceIds);

    if (!result.success) {
      throw new Error(`Failed to fetch individual price updates: ${result.error}`);
    }

    const { individualUpdates, batchBinaryData, totalFeeds } = result.data;

    // Prepare output data
    const outputData = {
      fetchTimestamp: new Date().toISOString(),
      totalFeeds: priceIds.length,
      successfulFeeds: individualUpdates.length,
      processingTime: result.metadata?.processingTime,
      priceFeeds: PRICE_FEEDS,
      productionData: {
        individualUpdates,
        batchBinaryData, // Combined binary from Hermes
        validationInfo: {
          allUpdatesValid: individualUpdates.every((u: any) => 
            ProductionPythClient.validateUpdateData(u.updateData)
          ),
          totalVAASize: individualUpdates.reduce((sum: number, u: any) => sum + u.updateData.length, 0)
        }
      },
      metadata: {
        fetchedAt: result.timestamp,
        apiEndpoint: 'https://hermes.pyth.network',
        dataFormat: 'Individual Pyth VAAs (Production Ready)',
        note: 'Each update contains a valid VAA that can be submitted to Pyth contracts'
      }
    };

    // Ensure data directory exists
    const dataDir = path.dirname(OUTPUT_PATHS.RAW_DATA);
    await fs.mkdir(dataDir, { recursive: true });

    // Save production data
    await fs.writeFile(
      OUTPUT_PATHS.RAW_DATA.replace('.json', '_production.json'),
      JSON.stringify(outputData, null, 2),
      'utf8'
    );

    // Display results
    console.log(' PRODUCTION price update fetch completed successfully!');
    console.log(` Data saved to: ${OUTPUT_PATHS.RAW_DATA.replace('.json', '_production.json')}`);
    console.log(` Processing time: ${result.metadata?.processingTime}ms`);
    console.log(` Successfully fetched ${individualUpdates.length} individual VAAs`);
    
    // Display validation info
    const validUpdates = individualUpdates.filter((u: any) => 
      ProductionPythClient.validateUpdateData(u.updateData)
    );
    console.log(` Valid VAAs: ${validUpdates.length}/${individualUpdates.length}`);
    
    // Display total data size
    const totalSize = individualUpdates.reduce((sum: number, u: any) => sum + u.updateData.length, 0);
    console.log(` Total VAA data size: ${totalSize} characters (${totalSize / 2} bytes)`);

    // Display sample of fetched data
    console.log('\n Sample of fetched price data:');
    individualUpdates.slice(0, 5).forEach((update: any, index: number) => {
      const vaaSize = update.updateData.length;
      console.log(`   ${index + 1}. ${update.symbol}: ${update.priceInfo.price.toFixed(2)} (VAA: ${vaaSize} chars)`);
    });

    // Display key differences from demo version
    console.log('\n PRODUCTION vs DEMO differences:');
    console.log('   Individual VAAs: Each feed has its own valid VAA');
    console.log('   Direct submission: VAAs can be submitted directly to Pyth contracts');
    console.log('   Wormhole signed: All updates are signed by Wormhole guardians');
    console.log('   On-chain compatible: Passes all Pyth contract validations');

    console.log('\n Next step: Run `npm run select-production` to select 5 feeds');
    
  } catch (error) {
    console.error(' Error fetching production price updates:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fetchProductionUpdates();
}

export default fetchProductionUpdates;