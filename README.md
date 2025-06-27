# Pyth Oracle Data Processor

A TypeScript application for fetching, processing, and preparing Pyth Network oracle price data for on-chain submission. This tool provides comprehensive oracle data management capabilities with both demo and production implementations.

## Overview

The Pyth Oracle Data Processor interacts with the Pyth Network's Hermes API to fetch real-time price data for multiple asset classes, processes the data through various encoding/decoding pipelines, and generates valid calldata for smart contract integration. The system supports both individual feed processing and batch operations optimized for gas efficiency.

## Architecture

The application implements a dual-pipeline architecture:

### Demo Pipeline
Demonstrates oracle data processing concepts by fetching price updates, decoding binary data structures, and re-encoding selected feeds. This pipeline shows the fundamental workflows of oracle data manipulation and validation.

### Production Pipeline  
Provides production-ready implementation with additional features including individual Wormhole-signed VAAs (Verified Action Approvals), cryptographic validation, and direct smart contract compatibility across all supported blockchain networks.

## Features

### Core Functionality
- Fetches price updates for 20 diverse assets across multiple asset classes
- Processes and validates oracle data through multiple encoding/decoding stages
- Generates optimized calldata for smart contract `updatePriceFeeds()` functions
- Implements comprehensive error handling with multiple fallback mechanisms
- Provides detailed validation and gas estimation

### Production Features
- **Wormhole-signed VAAs**: Individual VAAs with guardian signatures
- **Cryptographic Verification**: Full validation of VAA authenticity
- **Direct Smart Contract Submission**: Ready for on-chain deployment
- **Gas Optimization**: Accurate cost estimation and efficiency
- **Cross-chain Compatibility**: Works on all Pyth-supported networks

### Asset Coverage
- **Cryptocurrencies (11)**: BTC, ETH, SOL, USDT, USDC, ADA, LINK, UNI, DOGE, AVAX, BNB
- **US Equities (5)**: AAPL, TSLA, MSFT, NVDA, AMZN  
- **Commodities (2)**: Gold (XAU), Silver (XAG)
- **Forex (2)**: EUR/USD, GBP/USD

### Technical Capabilities
- TypeScript implementation with comprehensive type safety
- Axios-based HTTP client with retry logic and timeout handling
- Modular architecture with clean separation of concerns
- Extensive validation and error reporting
- Gas optimization for on-chain operations
- Cross-chain compatibility

## Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn package manager
- TypeScript compiler

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd pyth-oracle-data-processor

# Install dependencies
npm install

# Build the project
npm run build
```

### Environment Configuration
Create a `.env` file in the root directory:
```bash
# API Configuration
HERMES_API_URL=https://hermes.pyth.network
API_TIMEOUT=30000
RETRY_ATTEMPTS=3

# Debug and Logging
DEBUG=false
LOG_LEVEL=info

# Processing Configuration
SELECTED_INDICES=0,5,11,15,18
MAX_FEEDS=20
```

## Usage

### Demo Pipeline
Demonstrates oracle data processing workflows and binary format handling:

```bash
# Individual steps
npm run fetch       # Fetch price updates from Hermes API
npm run decode      # Decode binary data structures  
npm run reencode    # Re-encode selected feeds for demonstration
npm run validate    # Validate processing pipeline

# Complete pipeline
npm run process-all # Execute all demo steps sequentially
```

**Output**: Processed oracle data with demonstration of encoding/decoding workflows.

### Production Pipeline  
Generates deployment-ready VAAs with additional production features:

```bash
# Individual steps
npm run fetch-production     # Fetch individual VAAs for all assets
npm run select-production    # Select 5 feeds for optimization
npm run validate-production  # Comprehensive VAA validation

# Complete pipeline
npm run production-pipeline  # Execute all production steps
```

**Output**: Production-ready VAAs with Wormhole signatures suitable for direct smart contract submission.

## Project Structure

```
pyth-oracle-data-processor/
├── src/                           # Source code
│   ├── config/                    # Configuration and constants
│   │   ├── constants.ts          # API endpoints and processing constants
│   │   └── priceFeeds.ts         # Price feed definitions and mappings
│   ├── scripts/                   # Executable processing scripts
│   │   ├── fetchPriceUpdates.ts       # Demo: API integration demonstration
│   │   ├── decodePriceData.ts         # Demo: Binary data decoding
│   │   ├── reencodeSelected.ts        # Demo: Selective re-encoding
│   │   ├── validateUpdate.ts          # Demo: Pipeline validation
│   │   ├── fetchProductionUpdates.ts  # Production: VAA fetching
│   │   ├── selectProductionFeeds.ts   # Production: Feed selection
│   │   └── validateProduction.ts      # Production: Comprehensive validation
│   ├── utils/                     # Core business logic
│   │   ├── api.ts                # Demo API client with retry logic
│   │   ├── decoder.ts            # Binary data decoder
│   │   ├── encoder.ts            # Demo re-encoder for concepts
│   │   └── productionApi.ts      # Production VAA client
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts              # Shared interfaces and types
│   └── index.ts                   # Main application entry point
├── data/                          # Output data directory
│   ├── raw_price_updates.json             # Demo: Fetched price data
│   ├── decoded_data.json                  # Demo: Decoded structures
│   ├── reencoded_data.json                # Demo: Re-encoded data
│   ├── raw_price_updates_production.json  # Production: Individual VAAs
│   ├── reencoded_data_production.json     # Production: Selected feeds
│   └── validation_report_production.json  # Production: Validation results
├── tests/                         # Test suite
├── dist/                          # Compiled JavaScript output
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.js                  # ESLint configuration
├── jest.config.js                # Jest testing configuration
├── .env.example                  # Environment variables template
└── README.md                     # Project documentation
```

## Pipeline Comparison

| Aspect | Demo Pipeline | Production Pipeline |
|--------|---------------|-------------------|
| **Purpose** | Workflow demonstration | Production deployment |
| **Output Format** | Processed data | Wormhole-signed VAAs |
| **Smart Contract Compatibility** | Basic compatibility | Direct submission ready |
| **Cryptographic Signatures** | None | Wormhole guardian signatures |
| **Gas Estimation** | Basic estimates | Accurate on-chain estimates |
| **Validation Level** | Structure validation | Cryptographic verification |
| **Use Case** | Process exploration | Real-world deployment |

## API Reference

### Core Classes

#### `HermesApiClient`
Demo API client for oracle data processing workflows.

```typescript
const client = new HermesApiClient({
  baseUrl: 'https://hermes.pyth.network',
  timeout: 30000,
  retryAttempts: 3
});

const result = await client.fetchLatestPriceUpdates(priceIds);
```

#### `ProductionPythClient`  
Production API client with additional features for VAA generation and smart contract integration.

```typescript
const client = new ProductionPythClient();
const updates = await client.fetchIndividualPriceUpdates(priceIds);
const calldata = ProductionPythClient.createUpdatePriceFeedsCalldata(selectedUpdates);
```

### Configuration

#### Selected Asset Indices
The system selects 5 assets from the 20 available feeds:
```typescript
// Current selection (indices 0-19)
export const SELECTED_ASSET_INDICES = [0, 5, 11, 15, 18];
// Represents: BTC/USD, ADA/USD, TSLA/USD, XAU/USD, EUR/USD
```

#### Price Feed Configuration
Each price feed includes comprehensive metadata:
```typescript
interface PriceFeedInfo {
  id: string;        // 64-character hex identifier from Pyth Network
  symbol: string;    // Human-readable trading pair  
  description: string; // Asset description
  assetType: string; // Category: crypto|equity|commodity|forex
}
```

## Gas Optimization

### Cost Structure
- **Base Cost**: ~100,000 gas (VAA verification overhead)
- **Per Feed**: ~50,000 gas (individual VAA processing)
- **5 Feeds Total**: ~350,000 gas

### Optimization Strategies
- **Selective Updates**: Process only required price feeds
- **Batch Processing**: Submit multiple VAAs in single transaction
- **Fee Calculation**: Use `getUpdateFee()` for accurate fee estimation
- **Gas Limit**: Recommended 20% buffer above estimates

## Supported Networks

The production VAAs are compatible with all blockchain networks supporting Pyth contracts:

### EVM Networks
- Ethereum Mainnet
- Binance Smart Chain  
- Polygon
- Avalanche
- Arbitrum
- Optimism
- Fantom

### Non-EVM Networks
- Solana
- Aptos
- Sui
- Near Protocol

Contract addresses available at: https://docs.pyth.network/price-feeds/contract-addresses

## Resources

### External Documentation
- **Pyth Network**: https://pyth.network/
- **Hermes API Documentation**: https://hermes.pyth.network/docs
- **Price Feed IDs**: https://pyth.network/developers/price-feed-ids
- **Smart Contract Integration**: https://docs.pyth.network/price-feeds

### Technical References
- **Wormhole Protocol**: https://wormhole.com/
- **VAA Specification**: https://docs.wormhole.com/wormhole/
- **EVM Integration Guide**: https://docs.pyth.network/price-feeds/use-real-data/evm
