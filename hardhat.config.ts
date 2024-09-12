import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
      accounts: [
        "39b9dfab520457e0514a1996f07ae5100c373174d178124832a301684caaffcb",
      ],
    },
    assetchain_test: {
      url: "https://enugu-rpc.assetchain.org/",

      chainId: 42421,
      accounts: [
        "39b9dfab520457e0514a1996f07ae5100c373174d178124832a301684caaffcb",
      ],
    },
  },
  etherscan: {
    apiKey: {
      assetchain_test: "abc",
    },
    customChains: [
      {
        network: "assetchain_test",
        chainId: 42421,
        urls: {
          apiURL: "https://scan-testnet.assetchain.org/api",
          browserURL: "https://scan-testnet.assetchain.org/",
        },
      },
    ],
  },
};
//0x9342Cf5Ba90e2aECD2E809956870Add0Da2E6021
export default config;
