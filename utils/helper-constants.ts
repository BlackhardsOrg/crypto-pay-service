export interface networkConfigItem {
    ethUsdPriceFeed?: string
    blockConfirmations?: number
  }
  
  export interface networkConfigInfo {
    [key: string]: networkConfigItem
  }
  
  export const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    polygon: {
      blockConfirmations: 6,
    },
    mumbai:{
      blockConfirmations: 6,
    },
    fuji:{
      blockConfirmations: 6,
    }
  }
  
  export const developmentChains = ["hardhat", "localhost"]