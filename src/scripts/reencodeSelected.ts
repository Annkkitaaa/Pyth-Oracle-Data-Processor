import fs from 'fs/promises';
import { PythDataEncoder } from '../utils/encoder';
import { getSelectedPriceFeeds } from '../config/priceFeeds';
import { SELECTED_ASSET_INDICES, OUTPUT_PATHS } from '../config/constants';

async function reencodeSelectedFeeds() {
  console.log('🔧 Starting selective re-encoding process...');
  console.log('='.repeat(50));

  try {
    // Read decoded data
    console.log(`📖 Reading decoded data from: ${OUTPUT_PATHS.DECODED_DATA}`);
    const decodedDataContent = await fs.readFile(OUTPUT_PATHS.DECODED_DATA, 'utf8');
    const decodedData = JSON.parse(decodedDataContent);

    if (!decodedData.decodedUpdates) {
      throw new Error('No decoded updates found in decoded data file');
    }

    const allUpdates = decodedData.decodedUpdates;
    console.log(`📊 Found ${allUpdates.length} decoded price updates`);

    // Display selection information
    const selectedFeeds = getSelectedPriceFeeds(SELECTED_ASSET_INDICES);
    console.log(`\n🎯 Selecting ${SELECTED_ASSET_INDICES.length} feeds for re-encoding:`);
    
    SELECTED_ASSET_INDICES.forEach((index, i) => {
      const update = allUpdates[index];
      if (update) {
        console.log(`   ${i + 1}. [${index}] ${update.symbol} (${update.assetType}) - $${update.readablePrice.toFixed(2)}`);
      } else {
        console.warn(`   ⚠️  Index ${index} not found in decoded data`);
      }
    });

    // Convert back to the format expected by encoder
    const updateObjects = allUpdates.map((update: any) => ({
      feedId: update.feedId,
      priceValue: BigInt(update.priceValue),
      confidence: BigInt(update.confidence),
      exponent: update.exponent,
      publishTime: update.publishTime,
      emaPrice: BigInt(update.emaPrice),
      emaConfidence: BigInt(update.emaConfidence),
      slot: update.slot
    }));

    // Re-encode selected feeds
    console.log('\n🔄 Re-encoding selected price feeds...');
    const encodeResult = PythDataEncoder.reencodeSelectedFeeds(
      updateObjects,
      SELECTED_ASSET_INDICES
    );

    if (!encodeResult.success) {
      throw new Error(`Failed to re-encode selected feeds: ${encodeResult.error}`);
    }

    const encodedData = encodeResult.data;

    // Validate the re-encoded data
    console.log('✅ Validating re-encoded data...');
    const validation = PythDataEncoder.validateReencodedData(
      updateObjects,
      encodedData.encodedData,
      SELECTED_ASSET_INDICES
    );

    if (!validation.isValid) {
      console.error('❌ Validation errors found:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️  Validation warnings:');
        validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
      }
      
      throw new Error('Re-encoded data validation failed');
    }

    // Create updatePriceFeeds calldata
    const calldata = PythDataEncoder.createUpdatePriceFeedsCalldata(encodedData.encodedData);
    
    // Create summary
    const summary = PythDataEncoder.createSummary(
      encodedData.originalCount,
      encodedData.selectedCount,
      SELECTED_ASSET_INDICES,
      encodedData.feedIds,
      encodedData.binaryData.length
    );

    // Prepare output data
    const outputData = {
      reencodeTimestamp: new Date().toISOString(),
      originalFeedCount: encodedData.originalCount,
      selectedFeedCount: encodedData.selectedCount,
      selectedIndices: SELECTED_ASSET_INDICES,
      selectedFeeds: encodedData.selectedUpdates.map((update: any, index: number) => {
        const originalUpdate = allUpdates[SELECTED_ASSET_INDICES[index]];
        return {
          index: SELECTED_ASSET_INDICES[index],
          feedId: update.feedId,
          symbol: originalUpdate?.symbol || 'Unknown',
          assetType: originalUpdate?.assetType || 'unknown',
          priceValue: update.priceValue.toString(),
          confidence: update.confidence.toString(),
          exponent: update.exponent,
          publishTime: update.publishTime,
          readablePrice: originalUpdate?.readablePrice || 0,
          readableConfidence: originalUpdate?.readableConfidence || 0
        };
      }),
      encodedData: {
        hex: encodedData.encodedData,
        size: encodedData.binaryData.length,
        calldata: calldata
      },
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        metadata: validation.metadata
      },
      gasEstimate: PythDataEncoder.estimateGasCost(encodedData.selectedCount),
      summary,
      metadata: {
        reencodedAt: encodeResult.timestamp,
        processingTime: encodeResult.metadata?.processingTime,
        encoder: 'PythDataEncoder v1.0',
        targetFormat: 'updatePriceFeeds compatible'
      }
    };

    // Save re-encoded data
    await fs.writeFile(
      OUTPUT_PATHS.REENCODED_DATA,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );

    // Display results
    console.log('✅ Selective re-encoding completed successfully!');
    console.log(`📁 Re-encoded data saved to: ${OUTPUT_PATHS.REENCODED_DATA}`);
    console.log(`⏱️  Processing time: ${encodeResult.metadata?.processingTime}ms`);
    console.log(`📊 Re-encoded ${encodedData.selectedCount} of ${encodedData.originalCount} feeds`);

    // Display selected feeds summary
    console.log('\n📋 Re-encoded feeds summary:');
    outputData.selectedFeeds.forEach((feed, index) => {
      console.log(`   ${index + 1}. ${feed.symbol} = $${feed.readablePrice.toFixed(2)} (±$${feed.readableConfidence.toFixed(2)})`);
    });

    // Display technical details
    console.log('\n🔧 Technical details:');
    console.log(`   - Original size: ${decodedData.originalBinarySize / 2} bytes`);
    console.log(`   - Re-encoded size: ${encodedData.binaryData.length} bytes`);
    console.log(`   - Size reduction: ${((1 - encodedData.binaryData.length / (decodedData.originalBinarySize / 2)) * 100).toFixed(1)}%`);
    console.log(`   - Gas estimate: ${outputData.gasEstimate.toLocaleString()} gas`);
    console.log(`   - Validation: ${validation.isValid ? 'Passed' : 'Failed'}`);

    // Display the calldata for contract interaction
    console.log('\n📝 Contract interaction data:');
    console.log(`   Function: updatePriceFeeds(bytes calldata updateData)`);
    console.log(`   Calldata: ${calldata.slice(0, 20)}...${calldata.slice(-20)} (${calldata.length} chars)`);

    console.log('\n🎯 Next step: Run `npm run validate` to perform final validation');
    
  } catch (error) {
    console.error('❌ Error re-encoding selected feeds:', error);
    
    // Check if the error is due to missing decoded data file
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log('\n💡 Tip: Run `npm run decode` first to decode the price data');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  reencodeSelectedFeeds();
}

export default reencodeSelectedFeeds;