export interface PriceFeedInfo {
    id: string;
    symbol: string;
    description: string;
    assetType: string;
  }
  
  // 20 price feeds - using verified crypto feeds for reliable demo
  // Note: For production, use appropriate price feed IDs for each asset type
  export const PRICE_FEEDS: PriceFeedInfo[] = [
    // Primary crypto feeds (verified working)
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
      id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      symbol: 'USDT/USD',
      description: 'Tether / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      symbol: 'SOL/USD',
      description: 'Solana / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x150ac9b959aee0da7793b28c39a8b7ad112f5d8c58f2e03a5b3db05e49a0c3a8',
      symbol: 'ADA/USD',
      description: 'Cardano / US Dollar',
      assetType: 'crypto'
    },
    
    // Additional crypto feeds for demo (20 total)
    {
      id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      symbol: 'AAPL/USD',
      description: 'Apple Inc (Demo - using BTC feed)',
      assetType: 'equity'
    },
    {
      id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      symbol: 'TSLA/USD',
      description: 'Tesla Inc (Demo - using ETH feed)',
      assetType: 'equity'
    },
    {
      id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      symbol: 'GOOGL/USD',
      description: 'Alphabet Inc (Demo - using USDT feed)',
      assetType: 'equity'
    },
    {
      id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      symbol: 'MSFT/USD',
      description: 'Microsoft Corp (Demo - using SOL feed)',
      assetType: 'equity'
    },
    {
      id: '0x150ac9b959aee0da7793b28c39a8b7ad112f5d8c58f2e03a5b3db05e49a0c3a8',
      symbol: 'NVDA/USD',
      description: 'NVIDIA Corp (Demo - using ADA feed)',
      assetType: 'equity'
    },
    
    {
      id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      symbol: 'AMZN/USD',
      description: 'Amazon.com Inc (Demo)',
      assetType: 'equity'
    },
    {
      id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      symbol: 'META/USD',
      description: 'Meta Platforms (Demo)',
      assetType: 'equity'
    },
    {
      id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      symbol: 'XAU/USD',
      description: 'Gold Spot (Demo)',
      assetType: 'commodity'
    },
    {
      id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      symbol: 'XAG/USD',
      description: 'Silver Spot (Demo)',
      assetType: 'commodity'
    },
    {
      id: '0x150ac9b959aee0da7793b28c39a8b7ad112f5d8c58f2e03a5b3db05e49a0c3a8',
      symbol: 'WTI/USD',
      description: 'Crude Oil WTI (Demo)',
      assetType: 'commodity'
    },
    
    {
      id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      symbol: 'BRENT/USD',
      description: 'Brent Crude Oil (Demo)',
      assetType: 'commodity'
    },
    {
      id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      symbol: 'NG/USD',
      description: 'Natural Gas (Demo)',
      assetType: 'commodity'
    },
    {
      id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
      symbol: 'EUR/USD',
      description: 'Euro / US Dollar (Demo)',
      assetType: 'forex'
    },
    {
      id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      symbol: 'GBP/USD',
      description: 'British Pound / US Dollar (Demo)',
      assetType: 'forex'
    },
    {
      id: '0x150ac9b959aee0da7793b28c39a8b7ad112f5d8c58f2e03a5b3db05e49a0c3a8',
      symbol: 'JPY/USD',
      description: 'Japanese Yen / US Dollar (Demo)',
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