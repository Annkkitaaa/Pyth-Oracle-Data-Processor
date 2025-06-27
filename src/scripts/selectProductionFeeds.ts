import fs from 'fs/promises';
import { ProductionPythClient, IndividualPriceUpdate } from '../utils/productionApi';
import { getSelectedPriceFeeds } from '../config/priceFeeds';
import { SELECTED_ASSET_INDICES, OUTPUT_PATHS } from '../config/constants';

async function selectProductionFeeds() {
  console.log('🎯 Starting PRODUCTION feed selection process...');
  console.log('='.repeat(60));

  try {
    // Read production data
    const productionFile = OUTPUT_PATHS.RAW_DATA.replace('.json', '_production.json');
    console.log(`📖 Reading production data from: ${productionFile}`);
    
    const productionDataContent = await fs.readFile(productionFile, 'utf8');
    const productionData = JSON.parse(productionDataContent);

    if (!productionData.productionData?.individualUpdates) {
      throw new Error('No individual updates found in production data file');
    }

    const allUpdates: IndividualPriceUpdate[] = productionData.productionData.individualUpdates;
    console.log(`📊 Found ${allUpdates.length} individual price updates with VAAs`);

    // Display selection information
    const selectedFeeds = getSelectedPriceFeeds(SELECTED_ASSET_INDICES);
    console.log(`\n🎯 Selecting ${SELECTED_ASSET_INDICES.length} feeds for PRODUCTION update:`);
    
    SELECTED_ASSET_INDICES.forEach((index, i) => {
      const update = allUpdates[index];
      if (update) {
        const vaaSize = update.updateData.length;
        const isValid = ProductionPythClient.validateUpdateData(update.updateData);
        console.log(`   ${i + 1}. [${index}] ${update.symbol} - $${update.priceInfo.price.toFixed(2)} (VAA: ${vaaSize} chars) ${isValid ? '✅' : '❌'}`);
      } else {
        console.warn(`   ⚠️  Index ${index} not found in production data`);
      }
    });

    // Select the feeds using production client
    console.log('\n🔄 Creating production-ready price update batch...');
    const selectionResult = ProductionPythClient.selectPriceUpdates(
      allUpdates,
      SELECTED_ASSET_INDICES
    );

    if (!selectionResult.success) {
      throw new Error(`Failed to select production feeds: ${selectionResult.error}`);
    }

    const {
      selectedUpdates,
      batchUpdateData,
      individualUpdateData,
      originalCount,
      selectedCount,
      feedIds
    } = selectionResult.data;

    // Create EVM calldata for on-chain submission
    console.log('🔧 Creating EVM calldata for updatePriceFeeds...');
    const calldata = ProductionPythClient.createUpdatePriceFeedsCalldata(selectedUpdates);
    
    // Validate all selected updates
    const validation = {
      allValid: selectedUpdates.every(u => ProductionPythClient.validateUpdateData(u.updateData)),
      validCount: selectedUpdates.filter(u => ProductionPythClient.validateUpdateData(u.updateData)).length,
      totalCount: selectedUpdates.length
    };

    // Calculate total size and gas estimates
    const totalVAASize = selectedUpdates.reduce((sum, u) => sum + u.updateData.length, 0);
    const estimatedGas = ProductionPythClient.estimateGasCost(selectedCount);

    // Prepare comprehensive output data
    const outputData = {
      selectionTimestamp: new Date().toISOString(),
      originalFeedCount: originalCount,
      selectedFeedCount: selectedCount,
      selectedIndices: SELECTED_ASSET_INDICES,
      
      // Production-ready data
      productionUpdates: {
        selectedFeeds: selectedUpdates.map((update, index) => ({
          index: SELECTED_ASSET_INDICES[index],
          feedId: update.feedId,
          symbol: update.symbol,
          price: update.priceInfo.price,
          confidence: update.priceInfo.confidence,
          publishTime: update.priceInfo.publishTime,
          vaaData: update.updateData,
          vaaSize: update.updateData.length,
          isValidVAA: ProductionPythClient.validateUpdateData(update.updateData)
        })),
        
        // On-chain submission data
        onChainData: {
          updatePriceFeedsCalldata: calldata,
          individualVAAs: individualUpdateData,
          batchUpdateData: batchUpdateData,
          gasEstimate: estimatedGas,
          totalVAASize: totalVAASize
        },
        
        // Validation results
        validation: {
          allVAAsValid: validation.allValid,
          validVAACount: validation.validCount,
          totalVAACount: validation.totalCount,
          readyForOnChainSubmission: validation.allValid
        }
      },
      
      // Contract interaction examples
      contractExamples: {
        solidity: {
          functionCall: 'updatePriceFeeds(bytes[] calldata updateData)',
          gasLimit: Math.ceil(estimatedGas * 1.2),
          description: 'Submit all 5 VAAs in a single transaction'
        },
        javascript: {
          example: `
// Using ethers.js
const pythContract = new ethers.Contract(pythAddress, pythABI, signer);
const updateData = ${JSON.stringify(individualUpdateData, null, 2)};
const fee = await pythContract.getUpdateFee(updateData);
await pythContract.updatePriceFeeds(updateData, { value: fee });
          `.trim()
        }
      },
      
      metadata: {
        selectedAt: selectionResult.timestamp,
        processingTime: selectionResult.metadata?.processingTime,
        format: 'Production Pyth VAAs',
        compatibility: 'All EVM chains with Pyth contracts',
        note: 'These VAAs are signed by Wormhole guardians and ready for on-chain submission'
      }
    };

    // Save production selection data
    const outputFile = OUTPUT_PATHS.REENCODED_DATA.replace('.json', '_production.json');
    await fs.writeFile(
      outputFile,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );

    // Display comprehensive results
    console.log('✅ PRODUCTION feed selection completed successfully!');
    console.log(`📁 Production data saved to: ${outputFile}`);
    console.log(`⏱️  Processing time: ${selectionResult.metadata?.processingTime}ms`);
    console.log(`📊 Selected ${selectedCount} of ${originalCount} feeds`);

    // Display validation results
    console.log('\n🔍 Validation Results:');
    console.log(`   VAA Validation: ${validation.validCount}/${validation.totalCount} valid`);
    console.log(`   Ready for on-chain: ${validation.allValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Total VAA size: ${totalVAASize} characters (${totalVAASize / 2} bytes)`);
    console.log(`   Estimated gas: ${estimatedGas.toLocaleString()}`);

    // Display selected feeds with details
    console.log('\n📋 Selected production feeds:');
    selectedUpdates.forEach((update, index) => {
      const vaaValid = ProductionPythClient.validateUpdateData(update.updateData);
      console.log(`   ${index + 1}. ${update.symbol}: $${update.priceInfo.price.toFixed(2)} ${vaaValid ? '✅' : '❌'}`);
      console.log(`      VAA size: ${update.updateData.length} chars`);
      console.log(`      Publish time: ${new Date(update.priceInfo.publishTime * 1000).toISOString()}`);
    });

    // Display on-chain usage instructions
    console.log('\n🚀 On-Chain Usage Instructions:');
    console.log('1. Deploy or connect to a Pyth contract on your target chain');
    console.log('2. Call updatePriceFeeds with the VAA array:');
    console.log(`   updatePriceFeeds([${individualUpdateData.length} VAAs])`);
    console.log('3. Pay the update fee (calculate with getUpdateFee)');
    console.log('4. The contract will verify and update prices for all 5 feeds');

    // Display key production advantages
    console.log('\n🏆 PRODUCTION Advantages:');
    console.log('   ✅ Wormhole Guardian Signatures: All VAAs are cryptographically signed');
    console.log('   ✅ Individual Feed Updates: Each feed has its own VAA');
    console.log('   ✅ On-Chain Verification: Pyth contracts will verify VAA authenticity');
    console.log('   ✅ Gas Optimized: Only update the feeds you need');
    console.log('   ✅ Cross-Chain Compatible: Works on all chains with Pyth contracts');

    console.log('\n🎯 Next step: Run `npm run validate-production` for final validation');
    
  } catch (error) {
    console.error('❌ Error selecting production feeds:', error);
    
    // Check if the error is due to missing production data file
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log('\n💡 Tip: Run `npm run fetch-production` first to fetch production data');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  selectProductionFeeds();
}

export default selectProductionFeeds;