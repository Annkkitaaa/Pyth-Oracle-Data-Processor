#!/usr/bin/env node

import dotenv from 'dotenv';
import fetchPriceUpdates from './scripts/fetchPriceUpdates';
import decodePriceData from './scripts/decodePriceData';
import reencodeSelectedFeeds from './scripts/reencodeSelected';
import validateUpdate from './scripts/validateUpdate';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Pyth Oracle Data Processor
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🐍 Pyth Oracle Data Processor');
  console.log('============================\n');

  try {
    switch (command) {
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
        console.log('🚀 Running complete processing pipeline...\n');
        await fetchPriceUpdates();
        console.log('\n' + '='.repeat(60) + '\n');
        await decodePriceData();
        console.log('\n' + '='.repeat(60) + '\n');
        await reencodeSelectedFeeds();
        console.log('\n' + '='.repeat(60) + '\n');
        await validateUpdate();
        console.log('\n🎉 Complete pipeline finished successfully!');
        break;
        
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command || 'none'}`);
        console.log('\nUse "help" to see available commands.\n');
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Usage: npm run <command> or node dist/index.js <command>

Available commands:

  fetch        Fetch latest price updates for 20 assets from Hermes API
  decode       Decode binary price data into readable format  
  reencode     Re-encode selected 5 assets into new payload
  validate     Validate the complete processing pipeline
  all          Run the complete pipeline (fetch → decode → reencode → validate)
  help         Show this help message

Examples:

  npm run fetch          # Fetch price data
  npm run process-all    # Run complete pipeline
  node dist/index.js all # Run from compiled JavaScript

Environment Variables:

  DEBUG=1                # Enable debug logging
  RUN_INTEGRATION_TESTS=true  # Enable integration tests

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