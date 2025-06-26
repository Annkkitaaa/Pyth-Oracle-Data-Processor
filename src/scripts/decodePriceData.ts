import fs from 'fs/promises';
import { PythDataDecoder } from '../utils/decoder';
import { OUTPUT_PATHS } from '../config/constants';
import { PRICE_FEEDS } from '../config/priceFeeds';

async function decodePriceData() {
  console.log('🔍 Starting price data decoding process...');
  console.log('='.repeat(50));

  try {
    // Read raw data
    console.log(`📖 Reading raw data from: ${OUTPUT_PATHS.RAW_DATA}`);
    const rawDataContent = await fs.readFile(OUTPUT_PATHS.RAW_DATA, 'utf8');
    const rawData = JSON.parse(rawDataContent);

    if (!rawData.hermesResponse) {
      throw new Error('No Hermes response data found in raw data file');
    }

    const hermesResponse = rawData.hermesResponse;
    
    // Display input information
    console.log(`📊 Input data contains ${hermesResponse.parsed?.length || 0} price feeds`);
    if (hermesResponse.binary?.data?.[0]) {
      const binarySize = hermesResponse.binary.data[0].length;
      console.log(`💾 Binary data size: ${binarySize} characters (${binarySize / 2} bytes)`);
    }

    // Decode the binary data
    console.log('\n🔄 Decoding binary price update data...');
    const decodeResult = PythDataDecoder.decodePriceUpdates(hermesResponse);

    if (!decodeResult.success) {
      throw new Error(`Failed to decode price data: ${decodeResult.error}`);
    }

    const decodedData = decodeResult.data;
    
    // Validate decoded data
    console.log('✅ Validating decoded data structure...');
    const validation = PythDataDecoder.validateDecodedData(decodedData.decodedUpdates);
    
    if (!validation.isValid) {
      console.error('❌ Validation errors found:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      throw new Error('Decoded data validation failed');
    }

    // Prepare output data with enriched information
    const outputData = {
      decodeTimestamp: new Date().toISOString(),
      originalBinarySize: hermesResponse.binary.data[0].length,
      decodedFeedCount: decodedData.decodedUpdates.length,
      processingTime: decodeResult.metadata?.processingTime,
      originalData: {
        fetchTimestamp: rawData.fetchTimestamp,
        binaryData: hermesResponse.binary.data[0]
      },
      decodedUpdates: decodedData.decodedUpdates.map((update: any, index: number) => {
        const feedInfo = PRICE_FEEDS.find(f => f.id === update.feedId);
        return {
          index,
          feedId: update.feedId,
          symbol: feedInfo?.symbol || 'Unknown',
          assetType: feedInfo?.assetType || 'unknown',
          priceValue: update.priceValue.toString(),
          confidence: update.confidence.toString(),
          exponent: update.exponent,
          publishTime: update.publishTime,
          emaPrice: update.emaPrice.toString(),
          emaConfidence: update.emaConfidence.toString(),
          slot: update.slot,
          // Human readable price
          readablePrice: parseFloat(update.priceValue.toString()) / Math.pow(10, Math.abs(update.exponent)),
          readableConfidence: parseFloat(update.confidence.toString()) / Math.pow(10, Math.abs(update.exponent))
        };
      }),
      metadata: {
        decodedAt: decodeResult.timestamp,
        validationPassed: validation.isValid,
        decoder: 'PythDataDecoder v1.0'
      }
    };

    // Save decoded data
    await fs.writeFile(
      OUTPUT_PATHS.DECODED_DATA,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );

    // Display results
    console.log('✅ Price data decoding completed successfully!');
    console.log(`📁 Decoded data saved to: ${OUTPUT_PATHS.DECODED_DATA}`);
    console.log(`⏱️  Processing time: ${decodeResult.metadata?.processingTime}ms`);
    console.log(`📊 Successfully decoded ${decodedData.decodedUpdates.length} price updates`);

    // Display summary of decoded feeds
    console.log('\n📋 Decoded price feeds summary:');
    outputData.decodedUpdates.forEach((update: any, index: number) => {
      console.log(`   ${index}: ${update.symbol} = ${update.readablePrice.toFixed(2)} (±${update.readableConfidence.toFixed(2)})`);
    });

    // Display technical details
    console.log('\n🔧 Technical details:');
    console.log(`   - Binary format: Pyth Accumulator Update`);
    console.log(`   - Original size: ${hermesResponse.binary.data[0].length / 2} bytes`);
    console.log(`   - Feeds decoded: ${decodedData.decodedUpdates.length}`);
    console.log(`   - Validation: ${validation.isValid ? 'Passed' : 'Failed'}`);

    console.log('\n🎯 Next step: Run `npm run reencode` to re-encode selected feeds');
    
  } catch (error) {
    console.error('❌ Error decoding price data:', error);
    
    // Check if the error is due to missing raw data file
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log('\n💡 Tip: Run `npm run fetch` first to fetch the raw price data');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  decodePriceData();
}

export default decodePriceData;