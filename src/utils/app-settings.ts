export const DEFAULT_SETTINGS = {
  ELEMENTS_PER_PAGE: 10,
  NFTS_PER_CHUNK: 200,
  EXPECTED_PONG_BACK: 15000,
  KEEP_ALIVE_CHECK_INTERVAL: 7500,
};

export const ELEMENTS_PER_PAGE = 20;
export const NFTS_PER_CHUNK = 200;
export const EXPECTED_PONG_BACK = 15000;
export const KEEP_ALIVE_CHECK_INTERVAL = 7500;

export enum CHAIN_ID {
  ETH = "ETH",
  BSC = "BSC",
  POLYGON = "POLYGON",
  ARBITRUM = "ARBITRUM",
  OPTIMISM = "OPTIMISM",
}

export type CHAIN = {
  ID: number;
  NAME: string;
  NODE: string;
  SYMBOL: string;
};

// Chain nodes from enviroment
export type CHAIN_TYPE = {
  [key in CHAIN_ID]: CHAIN;
};
