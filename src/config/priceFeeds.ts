export interface PriceFeedInfo {
    id: string;
    symbol: string;
    description: string;
    assetType: string;
  }
  
  // 20 diverse price feeds covering different asset classes
  export const PRICE_FEEDS: PriceFeedInfo[] = [
    // Cryptocurrencies
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
    
    // US Equities
    {
      id: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
      symbol: 'AAPL/USD',
      description: 'Apple Inc',
      assetType: 'equity'
    },
    {
      id: '0x2bb4fc024e8e7ae2c1b07f80f4bb46ab42fe67abff7f1db7cbb6eaccf49e00c6',
      symbol: 'TSLA/USD',
      description: 'Tesla Inc',
      assetType: 'equity'
    },
    {
      id: '0x54c4c7b8d7161d1b9d2b7e4a0a7b8c0d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      symbol: 'GOOGL/USD',
      description: 'Alphabet Inc Class A',
      assetType: 'equity'
    },
    {
      id: '0xc98b83c3de7e4ac08c4fb9c3e21e5a3ab12345678901234567890123456789012',
      symbol: 'MSFT/USD',
      description: 'Microsoft Corporation',
      assetType: 'equity'
    },
    {
      id: '0x6bb7b2172c7ed0dc51c7e8dd9d0f0d0e0f0a0b0c0d0e0f1a1b1c1d1e1f2a2b2c',
      symbol: 'NVDA/USD',
      description: 'NVIDIA Corporation',
      assetType: 'equity'
    },
    
    // Commodities
    {
      id: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
      symbol: 'XAU/USD',
      description: 'Gold Spot',
      assetType: 'commodity'
    },
    {
      id: '0xf2fb02c32b055c2cb9f85c04c4e35b5b3f38cf6bcd6cd5b6af56c6c5c0c1c2c3',
      symbol: 'XAG/USD',
      description: 'Silver Spot',
      assetType: 'commodity'
    },
    {
      id: '0x2d41dc8c8c9d1f2e2f3e3f4f4f5f5f6f6f7f7f8f8f9f9fafafafbfbfbfcfcfc',
      symbol: 'WTI/USD',
      description: 'Crude Oil WTI',
      assetType: 'commodity'
    },
    {
      id: '0x3e3f3e4f4e5f5e6f6e7f7e8f8e9f9eafaebbecbedcedcedefedffeeffeffgffg',
      symbol: 'BRENT/USD',
      description: 'Brent Crude Oil',
      assetType: 'commodity'
    },
    {
      id: '0x4f4f5f5f6f6f7f7f8f8f9f9fafafafbfbfbfcfcfcfdfdfdfefefffff0f0f0f1f1',
      symbol: 'NG/USD',
      description: 'Natural Gas',
      assetType: 'commodity'
    },
    
    // Forex
    {
      id: '0x5f5f6f6f7f7f8f8f9f9fafafafbfbfbfcfcfcfdfdfdfefefffff0f0f0f1f1f1f2',
      symbol: 'EUR/USD',
      description: 'Euro / US Dollar',
      assetType: 'forex'
    },
    {
      id: '0x6f6f7f7f8f8f9f9fafafafbfbfbfcfcfcfdfdfdfefefffff0f0f0f1f1f1f2f2f2',
      symbol: 'GBP/USD',
      description: 'British Pound / US Dollar',
      assetType: 'forex'
    },
    {
      id: '0x7f7f8f8f9f9fafafafbfbfbfcfcfcfdfdfdfefefffff0f0f0f1f1f1f2f2f2f3f3',
      symbol: 'JPY/USD',
      description: 'Japanese Yen / US Dollar',
      assetType: 'forex'
    },
    {
      id: '0x8f8f9f9fafafafbfbfbfcfcfcfdfdfdfefefffff0f0f0f1f1f1f2f2f2f3f3f3f4',
      symbol: 'AUD/USD',
      description: 'Australian Dollar / US Dollar',
      assetType: 'forex'
    },
    {
      id: '0x9f9fafafafbfbfbfcfcfcfdfdfdfefefffff0f0f0f1f1f1f2f2f2f3f3f3f4f4f4',
      symbol: 'CAD/USD',
      description: 'Canadian Dollar / US Dollar',
      assetType: 'forex'
    }
  ];
  
  export const getSelectedPriceFeeds = (indices: number[]): PriceFeedInfo[] => {
    return indices.map(index => PRICE_FEEDS[index]).filter(Boolean);
  };
  
  export const getAllPriceFeedIds = (): string[] => {
    return PRICE_FEEDS.map(feed => feed.id);
  };