// backend/src/config/tokens.ts
export interface Token {
  symbol: string;
  name: string;
  address: string | null;
  decimals: number;
  logoURI?: string;
}

export const tokenList: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: null,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    logoURI:
      "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    symbol: "AAVE",
    name: "Aave",
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
  },
  {
    symbol: "MKR",
    name: "Maker",
    address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png",
  },
  {
    symbol: "COMP",
    name: "Compound",
    address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/10775/small/COMP.png",
  },
];
