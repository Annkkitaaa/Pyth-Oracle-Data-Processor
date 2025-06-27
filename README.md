# Pyth Oracle Data Processor

A TypeScript application for fetching, processing, and preparing Pyth Network oracle price data for on-chain submission. This tool provides comprehensive oracle data management capabilities with both educational demonstrations and production-ready implementations.

## Overview

The Pyth Oracle Data Processor interacts with the Pyth Network's Hermes API to fetch real-time price data for multiple asset classes, processes the data through various encoding/decoding pipelines, and generates valid calldata for smart contract integration. The system supports both individual feed processing and batch operations optimized for gas efficiency.

## Architecture

The application implements a dual-pipeline architecture:

### Demo Pipeline
An educational implementation that demonstrates oracle data processing concepts including binary format exploration, API integration patterns, and data validation techniques.

### Production Pipeline  
A production-ready implementation that fetches individual Wormhole-signed VAAs (Verified Action Approvals) suitable for direct submission to Pyth smart contracts across all supported blockchain networks.

## Features

### Core Functionality
- Fetches price updates for 20 diverse assets across multiple asset classes
- Processes and validates oracle data through multiple encoding/decoding stages
- Generates production-ready VAAs with Wormhole guardian signatures
- Creates optimized calldata for smart contract `updatePriceFeeds()` functions
- Implements comprehensive error handling with multiple fallback mechanisms
- Provides detailed validation and gas estimation

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
The demo pipeline demonstrates oracle data processing concepts and binary format exploration:

```bash
# Individual steps
npm run fetch       # Fetch price updates from Hermes API
npm run decode      # Decode binary data structures  
npm run reencode    # Re-encode selected feeds for demonstration
npm run validate    # Validate processing pipeline

# Complete pipeline
npm run process-all # Execute all demo steps sequentially
```

**Output**: Educational demonstration of oracle data processing with conceptual encoding/decoding.

### Production Pipeline  
The production pipeline generates deployment-ready VAAs for smart contract integration:

```bash
# Individual steps
npm run fetch-production     # Fetch individual VAAs for all assets
npm run select-production    # Select 5 feeds for optimization
npm run validate-production  # Comprehensive VAA validation

# Complete pipeline
npm run production-pipeline  # Execute all production steps
```

**Output**: Production-ready VAAs with Wormhole signatures suitable for direct smart contract submission.

### Additional Commands
```bash
# Development
npm run dev         # Start development server with hot reload
npm run lint        # Run ESLint code analysis
npm run lint:fix    # Fix ESLint issues automatically

# Testing
npm test                    # Run test suite
npm run test:integration    # Run integration tests
npm run test:production     # Test production components

# Utilities
npm run clean       # Remove build artifacts and data files
npm run reset       # Clean and reinstall dependencies
```

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
│   │   ├── decoder.ts            # Binary data decoder (educational)
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
| **Purpose** | Educational demonstration | Production deployment |
| **Output Format** | Conceptual encoding | Wormhole-signed VAAs |
| **Smart Contract Compatibility** | Demonstration only | Direct submission ready |
| **Cryptographic Signatures** | None | Wormhole guardian signatures |
| **Gas Estimation** | Conceptual | Accurate on-chain estimates |
| **Validation Level** | Structure validation | Cryptographic verification |
| **Use Case** | Learning and exploration | Real-world deployment |

## API Reference

### Core Classes

#### `HermesApiClient`
Demo API client for educational oracle data exploration.

```typescript
const client = new HermesApiClient({
  baseUrl: 'https://hermes.pyth.network',
  timeout: 30000,
  retryAttempts: 3
});

const result = await client.fetchLatestPriceUpdates(priceIds);
```

#### `ProductionPythClient`  
Production API client for VAA generation and smart contract integration.

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

## Smart Contract Integration

### Solidity Implementation
```solidity
pragma solidity ^0.8.0;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract PriceConsumer {
    IPyth pyth;
    
    constructor(address _pythContract) {
        pyth = IPyth(_pythContract);
    }
    
    function updatePrices(bytes[] calldata updateData) external payable {
        uint fee = pyth.getUpdateFee(updateData);
        require(msg.value >= fee, "Insufficient fee");
        
        pyth.updatePriceFeeds{value: fee}(updateData);
    }
    
    function getPrice(bytes32 priceId) external view returns (PythStructs.Price memory) {
        return pyth.getPrice(priceId);
    }
}
```

### JavaScript Integration
```javascript
import { ethers } from 'ethers';

// Load production VAAs
const updateData = [
    "0x504e41550100000003...", // BTC/USD VAA
    "0x504e41550100000003...", // ADA/USD VAA
    // ... additional VAAs
];

// Submit to Pyth contract
const pythContract = new ethers.Contract(pythAddress, pythABI, signer);
const fee = await pythContract.getUpdateFee(updateData);
const tx = await pythContract.updatePriceFeeds(updateData, { value: fee });
await tx.wait();
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

## Error Handling

### Common Issues

#### Invalid Price Feed IDs
```bash
Error: Price ids not found: 0x...
```
**Solution**: Verify price feed IDs at https://pyth.network/developers/price-feed-ids

#### API Rate Limiting
```bash
Error: Request failed with status code 429
```
**Solution**: Implement exponential backoff or reduce request frequency

#### Network Timeouts
```bash
Error: timeout of 30000ms exceeded
```
**Solution**: Increase timeout in configuration or check network connectivity

### Debugging

Enable debug logging:
```bash
DEBUG=true npm run production-pipeline
```

Increase API timeout:
```bash
API_TIMEOUT=60000 npm run fetch-production
```

## Development

### Code Style
- TypeScript with strict type checking
- ESLint configuration with recommended rules  
- Prettier formatting for consistent code style
- Comprehensive error handling and logging

### Testing
```bash
npm test                    # Unit tests
npm run test:integration    # API integration tests  
npm run test:production     # Production pipeline tests
```

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/enhancement`)
3. Implement changes with tests
4. Ensure linting passes (`npm run lint`)
5. Submit pull request with detailed description

## Performance Metrics

### Typical Processing Times
- **Demo Pipeline**: ~10-15 seconds for 20 feeds
- **Production Pipeline**: ~5-8 seconds for VAA generation
- **Individual Feed Fetch**: ~200ms per feed
- **Batch Processing**: ~2-4 seconds per 10-feed batch

### Data Sizes
- **Individual VAA**: ~8,488 characters (~4,244 bytes)
- **5 Selected VAAs**: ~42,440 characters (~21,220 bytes)
- **Complete Dataset**: ~169,760 characters (~84,880 bytes)

## Security Considerations

### VAA Verification
- All production VAAs include Wormhole guardian signatures
- Smart contracts verify cryptographic signatures on-chain
- Invalid or tampered VAAs are rejected by Pyth contracts

### API Security
- HTTPS-only connections to Hermes API
- Request timeout and retry limits prevent resource exhaustion
- Input validation for all price feed identifiers

## Troubleshooting

### Build Issues
```bash
# Clear build cache
npm run clean
npm install
npm run build
```

### API Connection Problems
```bash
# Test API connectivity
curl https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
```

### TypeScript Compilation Errors
```bash
# Verify TypeScript configuration
npx tsc --noEmit
```

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

## License

MIT License - see LICENSE file for details.

