# Pyth Oracle Data Processor

A comprehensive tool for fetching, decoding, and re-encoding Pyth Network oracle price data. This project demonstrates how to work with Pyth's Hermes API to create custom price update payloads for on-chain consumption.

## 🎯 Project Overview

This project fetches price updates for 20 different assets from Pyth's Hermes API, decodes the binary accumulator data, and re-encodes it to create a valid `updatePriceFeeds` payload containing only 5 selected assets.

### Key Features

- **Multi-Asset Fetching**: Retrieves real-time price data for 20 diverse assets (crypto, equities, commodities, forex)
- **Binary Data Decoding**: Parses Pyth's proprietary accumulator update format
- **Selective Re-encoding**: Creates new payloads with only selected price feeds
- **Validation Pipeline**: Comprehensive validation including round-trip testing
- **Gas Optimization**: Estimates gas costs and provides optimized calldata
- **Clean Architecture**: Well-structured TypeScript codebase with clear separation of concerns

## 📊 Supported Assets

The project fetches data for 20 carefully selected price feeds across different asset classes:

### Cryptocurrencies (5)
- BTC/USD, ETH/USD, USDT/USD, SOL/USD, ADA/USD

### US Equities (5) 
- AAPL, TSLA, GOOGL, MSFT, NVDA

### Commodities (5)
- Gold (XAU/USD), Silver (XAG/USD), WTI Oil, Brent Oil, Natural Gas

### Forex (5)
- EUR/USD, GBP/USD, JPY/USD, AUD/USD, CAD/USD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript knowledge (helpful but not required)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pyth-oracle-processor

# Install dependencies
npm install

# Create data directory
mkdir -p data
```

### Usage

The project provides a complete pipeline that can be run step-by-step or all at once:

#### Option 1: Run Complete Pipeline
```bash
npm run process-all
```

#### Option 2: Run Step-by-Step
```bash
# Step 1: Fetch price updates for 20 assets
npm run fetch

# Step 2: Decode binary data
npm run decode

# Step 3: Re-encode for 5 selected assets
npm run reencode

# Step 4: Validate the final output
npm run validate
```

### Output Files

After completion, you'll find these files in the `data/` directory:

- `raw_price_updates.json` - Original Hermes API response
- `decoded_data.json` - Decoded binary data with readable prices
- `reencoded_data.json` - Final payload for 5 selected assets
- `validation_report.json` - Comprehensive validation results

## 🔧 Technical Implementation

### Architecture

```
src/
├── config/          # Configuration and constants
├── utils/           # Core business logic
├── scripts/         # Executable scripts
└── types/           # TypeScript definitions
```

### Key Components

#### 1. Hermes API Client (`src/utils/api.ts`)
- Handles HTTP requests to Pyth's Hermes API
- Implements retry logic and error handling
- Validates price feed ID formats

#### 2. Binary Data Decoder (`src/utils/decoder.ts`)
- Parses Pyth's proprietary accumulator update format
- Extracts price, confidence, exponent, and metadata
- Validates data structure integrity

#### 3. Selective Encoder (`src/utils/encoder.ts`)
- Re-constructs accumulator updates with fewer feeds
- Creates EVM-compatible calldata
- Estimates gas costs for on-chain transactions

#### 4. Processing Scripts
- **Fetch**: Retrieves latest price updates from Hermes
- **Decode**: Parses binary data into readable format
- **Re-encode**: Creates new payload with 5 selected assets
- **Validate**: Performs comprehensive validation tests

### Data Flow

```
[Hermes API] → [Binary Data] → [Decoded Prices] → [Selected 5] → [Re-encoded] → [Calldata]
     ↓              ↓              ↓                ↓              ↓              ↓
   20 feeds    Hex string    Human readable    Asset selection  Binary format  Contract call
```

## 📖 How It Works

### 1. Price Data Fetching

The system fetches price updates using Hermes API's `/v2/updates/price/latest` endpoint:

```typescript
const response = await client.fetchLatestPriceUpdates([
  '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
  // ... 18 more feeds
]);
```

### 2. Binary Data Structure

Pyth price updates use a proprietary binary format:

```
Header (11 bytes):
- Magic: "PNAU" (4 bytes)
- Version: major.minor (4 bytes)
- Trailing header size (2 bytes)
- Update type (1 byte)

Price Updates:
- Number of updates (2 bytes)
- For each update:
  - Message size (2 bytes)
  - Message type (1 byte)
  - Feed ID (32 bytes)
  - Price (8 bytes)
  - Confidence (8 bytes)
  - Exponent (4 bytes)
  - Publish time (8 bytes)
  - Previous publish time (8 bytes)
  - EMA price (8 bytes)
  - EMA confidence (8 bytes)
```

### 3. Asset Selection Strategy

The project selects 5 assets from different categories using indices `[0, 4, 8, 12, 16]`:

- Index 0: BTC/USD (crypto)
- Index 4: ADA/USD (crypto)
- Index 8: GOOGL/USD (equity)
- Index 12: BRENT/USD (commodity)
- Index 16: EUR/USD (forex)

This ensures diversity across asset classes while demonstrating the flexibility of the approach.

### 4. Re-encoding Process

The re-encoding process:

1. **Extract Selected Updates**: Pull the 5 chosen price updates
2. **Reconstruct Header**: Create new accumulator header
3. **Serialize Updates**: Convert back to binary format
4. **Generate Calldata**: Create EVM-compatible function call data

## 🛠 Configuration

### Modifying Selected Assets

To change which assets are re-encoded, edit `src/config/constants.ts`:

```typescript
export const SELECTED_ASSET_INDICES = [0, 4, 8, 12, 16]; // Change these indices
```

### Adding New Price Feeds

To add more price feeds, update `src/config/priceFeeds.ts`:

```typescript
export const PRICE_FEEDS: PriceFeedInfo[] = [
  // Add new feeds here
  {
    id: '0x...', // 64-character hex string
    symbol: 'SYMBOL/USD',
    description: 'Asset Description',
    assetType: 'crypto|equity|commodity|forex'
  }
];
```

### API Configuration

Modify API settings in `src/config/constants.ts`:

```typescript
export const REQUEST_CONFIG = {
  TIMEOUT: 30000,        // Request timeout
  RETRY_ATTEMPTS: 3,     // Number of retries
  RETRY_DELAY: 1000      // Delay between retries
};
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- api.test.ts
```

## 📈 Gas Optimization

The project includes gas estimation for the re-encoded payload:

- **Base Cost**: ~50,000 gas
- **Per Feed**: ~30,000 gas
- **5 Feeds Total**: ~200,000 gas

Recommendations:
- Use gas limit of 240,000 (20% buffer)
- Consider batching multiple updates
- Monitor gas prices for optimal timing

## 🔍 Validation & Quality Assurance

The validation pipeline includes:

1. **Data Integrity**: Ensures no data loss during processing
2. **Round-trip Testing**: Verifies re-encoded data can be decoded
3. **Format Validation**: Checks calldata format and function selectors
4. **Price Sanity Checks**: Validates price ranges and confidence intervals
5. **Structural Validation**: Ensures correct binary format structure

## 🔧 Troubleshooting

### Common Issues

#### "ENOENT: no such file or directory"
**Solution**: Run the previous steps in order:
```bash
npm run fetch  # Must run first
npm run decode # Then this
npm run reencode # Then this
npm run validate # Finally this
```

#### "Invalid price feed ID format"
**Solution**: Ensure all price feed IDs are 64-character hex strings starting with `0x`

#### "Failed to fetch price updates"
**Solution**: 
- Check internet connection
- Verify Hermes API is accessible
- Try again (includes automatic retry logic)

#### "Validation failed"
**Solution**: 
- Check the validation report in `data/validation_report.json`
- Ensure all processing steps completed successfully
- Verify price feed IDs are valid

### Debug Mode

Enable detailed logging by setting environment variable:

```bash
DEBUG=1 npm run process-all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite: `npm test`
6. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Lint code
npm run lint:fix
```

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related Resources

- [Pyth Network Documentation](https://docs.pyth.network/)
- [Hermes API Reference](https://hermes.pyth.network/docs)
- [Pyth Price Feed IDs](https://pyth.network/developers/price-feed-ids)
- [Pyth Contracts on GitHub](https://github.com/pyth-network/pyth-crosschain)

## 💡 Use Cases

This project demonstrates patterns useful for:

- **DeFi Protocols**: Custom price feed aggregation
- **Risk Management**: Selective asset monitoring
- **Gas Optimization**: Reducing on-chain update costs
- **Data Analysis**: Understanding oracle data structures
- **Integration Testing**: Validating oracle integrations

## 🏆 Key Achievements

- ✅ Successfully fetches 20 diverse price feeds
- ✅ Correctly decodes Pyth's binary format
- ✅ Re-encodes valid accumulator updates
- ✅ Creates EVM-compatible calldata
- ✅ Includes comprehensive validation
- ✅ Estimates accurate gas costs
- ✅ Maintains type safety throughout
- ✅ Provides clear documentation and examples

---

**Ready to process some oracle data?** Run `npm run process-all` and watch the magic happen! 🚀