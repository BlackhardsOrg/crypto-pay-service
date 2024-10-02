import { ethers, network } from "hardhat";
import erc20Abi from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { USDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export default async function impersonateFundTransfer(
  sender: HardhatEthersSigner,
  usdtToken: USDT,
  addressWithToken: string,
  tokenAddress: string,
  amount: string,
  receiverAddress?: string
) {
  const [signer] = await ethers.getSigners();

  // impersonate account; replace with an address that actually has your token
//   const addressWithTokens = addressWithToken;
//   await network.provider.send("hardhat_impersonateAccount", [
//     addressWithTokens,
//   ]);

  // create the token instance

  // const token = await ethers.getContractFactory("ERC20");

  // connect it to the impersonated signer and send it to your signer
  const tokenTrans = await usdtToken
    .connect(sender)
    .transfer(
      receiverAddress ? receiverAddress : signer.address,
      ethers.parseUnits(amount, 6)
    );

  await tokenTrans.wait();
  let balance = await usdtToken.balanceOf(signer.address);
}
