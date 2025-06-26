export interface PriceFeedInfo {
    id: string;
    symbol: string;
    description: string;
    assetType: string;
  }
  
  // 20 price feeds using REAL Pyth Network price feed IDs
  export const PRICE_FEEDS: PriceFeedInfo[] = [
    // Cryptocurrencies (verified working IDs)
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
      id: '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
      symbol: 'ADA/USD',
      description: 'Cardano / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
      symbol: 'AVAX/USD',
      description: 'Avalanche / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
      symbol: 'LINK/USD',
      description: 'Chainlink / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
      symbol: 'MATIC/USD',
      description: 'Polygon / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
      symbol: 'DOGE/USD',
      description: 'Dogecoin / US Dollar',
      assetType: 'crypto'
    },
    {
      id: '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
      symbol: 'UNI/USD',
      description: 'Uniswap / US Dollar',
      assetType: 'crypto'
    },
    
    // US Equities (real equity feed IDs)
    {
      id: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
      symbol: 'AAPL/USD',
      description: 'Apple Inc',
      assetType: 'equity'
    },
    {
      id: '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
      symbol: 'TSLA/USD',
      description: 'Tesla Inc',
      assetType: 'equity'
    },
    {
      id: '0xe65ff435be42630439c96396653a342829e877e2aafaeaf1a10d0ee5fd2cf3f2',
      symbol: 'GOOGL/USD',
      description: 'Alphabet Inc Class A',
      assetType: 'equity'
    },
    {
      id: '0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1',
      symbol: 'MSFT/USD',
      description: 'Microsoft Corporation',
      assetType: 'equity'
    },
    {
      id: '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
      symbol: 'NVDA/USD',
      description: 'NVIDIA Corporation',
      assetType: 'equity'
    },
    
    // Commodities (real commodity feed IDs)
    {
      id: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
      symbol: 'XAU/USD',
      description: 'Gold Spot',
      assetType: 'commodity'
    },
    {
      id: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
      symbol: 'XAG/USD',
      description: 'Silver Spot',
      assetType: 'commodity'
    },
    
    // Forex (real forex feed IDs)
    {
      id: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
      symbol: 'EUR/USD',
      description: 'Euro / US Dollar',
      assetType: 'forex'
    },
    {
      id: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
      symbol: 'GBP/USD',
      description: 'British Pound / US Dollar',
      assetType: 'forex'
    },
    {
      id: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52',
      symbol: 'USD/JPY',
      description: 'US Dollar / Japanese Yen',
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