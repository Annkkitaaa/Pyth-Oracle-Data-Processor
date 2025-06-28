#!/usr/bin/env node

import dotenv from 'dotenv';
import fetchPriceUpdates from './scripts/fetchPriceUpdates';
import decodePriceData from './scripts/decodePriceData';
import reencodeSelectedFeeds from './scripts/reencodeSelected';
import validateUpdate from './scripts/validateUpdate';
import fetchProductionUpdates from './scripts/fetchProductionUpdates';
import selectProductionFeeds from './scripts/selectProductionFeeds';
import validateProduction from './scripts/validateProduction';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Pyth Oracle Data Processor
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log(' Pyth Oracle Data Processor');
  console.log('============================\n');

  try {
    switch (command) {
      // Demo pipeline (for educational purposes)
      case 'fetch':
        await fetchPriceUpdates();
        break;
        
      case 'decode':
        await decodePriceData();
        break;
        
      case 'reencode':
        await reencodeSelectedFeeds();
        break;
        
      case 'validate':
        await validateUpdate();
        break;
        
      case 'all':
      case 'process-all':
        console.log(' Running DEMO processing pipeline...\n');
        await fetchPriceUpdates();
        console.log('\n' + '='.repeat(60) + '\n');
        await decodePriceData();
        console.log('\n' + '='.repeat(60) + '\n');
        await reencodeSelectedFeeds();
        console.log('\n' + '='.repeat(60) + '\n');
        await validateUpdate();
        console.log('\n Demo pipeline finished successfully!');
        break;

      // Production pipeline (ready for on-chain use)
      case 'fetch-production':
        await fetchProductionUpdates();
        break;
        
      case 'select-production':
        await selectProductionFeeds();
        break;
        
      case 'validate-production':
        await validateProduction();
        break;
        
      case 'production':
      case 'production-pipeline':
        console.log(' Running PRODUCTION processing pipeline...\n');
        await fetchProductionUpdates();
        console.log('\n' + '='.repeat(60) + '\n');
        await selectProductionFeeds();
        console.log('\n' + '='.repeat(60) + '\n');
        await validateProduction();
        console.log('\n Production pipeline finished successfully!');
        break;
        
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
        
      default:
        console.error(` Unknown command: ${command || 'none'}`);
        console.log('\nUse "help" to see available commands.\n');
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(' Pipeline failed:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Usage: npm run <command> or node dist/index.js <command>

 PRODUCTION PIPELINE (Ready for on-chain use):

  fetch-production      Fetch individual VAAs for 20 assets from Hermes API
  select-production     Select 5 feeds with valid VAAs for on-chain submission  
  validate-production   Validate VAAs are ready for Pyth contract calls
  production            Run complete production pipeline ⭐ RECOMMENDED ⭐

 DEMO PIPELINE (Educational - shows binary decoding concepts):

  fetch                 Fetch price updates and demonstrate API usage
  decode                Decode binary data (educational demonstration)
  reencode              Re-encode for concept demonstration  
  validate              Validate the demo processing pipeline
  all                   Run complete demo pipeline

 DEVELOPMENT:

  help                  Show this help message
  build                 Compile TypeScript to JavaScript
  test                  Run test suite
  lint                  Check code style

 RECOMMENDED USAGE:

  npm run production-pipeline    # Get production-ready VAAs for on-chain use

Examples:

  npm run production-pipeline    # Complete production pipeline
  npm run fetch-production       # Just fetch production VAAs
  npm run all                    # Demo pipeline for learning

Environment Variables:

  DEBUG=1                        # Enable debug logging
  RUN_INTEGRATION_TESTS=true     # Enable integration tests

 KEY DIFFERENCES:

  PRODUCTION PIPELINE:
   Individual VAAs signed by Wormhole guardians  
   Ready for direct submission to Pyth contracts
   Proper gas estimation and validation
   Cross-chain compatible
  
  DEMO PIPELINE:  
   Educational binary format exploration
   Shows concepts of price data processing
   Demonstrates API integration patterns

For more information, see the README.md file.
`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default main;