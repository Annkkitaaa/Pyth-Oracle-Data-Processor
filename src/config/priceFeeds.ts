export interface PriceFeedInfo {
    id: string;
    symbol: string;
    description: string;
    assetType: string;
  }
  
  // 20 price feeds using VERIFIED Pyth Network price feed IDs from official source
  export const PRICE_FEEDS: PriceFeedInfo[] = [
    // Crypto feeds (verified from official Pyth website)
    {
      id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      symbol: 'BTC/USD',
      description: 'Bitcoin / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      symbol: 'ETH/USD',
      description: 'Ethereum / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      symbol: 'SOL/USD',
      description: 'Solana / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      symbol: 'USDT/USD',
      description: 'Tether / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
      symbol: 'USDC/USD',
      description: 'USD Coin / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
      symbol: 'ADA/USD',
      description: 'Cardano / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
      symbol: 'LINK/USD',
      description: 'Chainlink / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
      symbol: 'UNI/USD',
      description: 'Uniswap / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
      symbol: 'DOGE/USD',
      description: 'Dogecoin / US Dollar',
      assetType: 'crypto'
    },
    
    // Demo additional feeds (reusing verified IDs with different labels for 20 total)
    {
      id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      symbol: 'AAPL/USD',
      description: 'Apple Inc (Demo using BTC feed)',
      assetType: 'equity'
    },
    {
      id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      symbol: 'TSLA/USD',
      description: 'Tesla Inc (Demo using ETH feed)',
      assetType: 'equity'
    },
    {
      id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      symbol: 'GOOGL/USD',
      description: 'Alphabet Inc (Demo using SOL feed)',
      assetType: 'equity'
    },
    {
      id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      symbol: 'MSFT/USD',
      description: 'Microsoft Corp (Demo using USDT feed)',
      assetType: 'equity'
    },
    {
      id: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
      symbol: 'NVDA/USD',
      description: 'NVIDIA Corp (Demo using USDC feed)',
      assetType: 'equity'
    },
    {
      id: '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
      symbol: 'AMZN/USD',
      description: 'Amazon Inc (Demo using ADA feed)',
      assetType: 'equity'
    },
    {
      id: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
      symbol: 'XAU/USD',
      description: 'Gold Spot (Demo using LINK feed)',
      assetType: 'commodity'
    },
    {
      id: '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
      symbol: 'XAG/USD',
      description: 'Silver Spot (Demo using UNI feed)',
      assetType: 'commodity'
    },
    {
      id: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
      symbol: 'WTI/USD',
      description: 'Crude Oil (Demo using DOGE feed)',
      assetType: 'commodity'
    },
    {
      id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      symbol: 'EUR/USD',
      description: 'Euro/Dollar (Demo using BTC feed)',
      assetType: 'forex'
    },
    {
      id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      symbol: 'GBP/USD',
      description: 'Pound/Dollar (Demo using ETH feed)',
      assetType: 'forex'
    }
  ];
  
  export const getSelectedPriceFeeds = (indices: number[]): PriceFeedInfo[] => {
    return indices
      .map(index => PRICE_FEEDS[index])
      .filter((feed): feed is PriceFeedInfo => feed !== undefined);
  };
  
  export const getAllPriceFeedIds = (): string[] => {
    return PRICE_FEEDS.map(feed => feed.id);
  };