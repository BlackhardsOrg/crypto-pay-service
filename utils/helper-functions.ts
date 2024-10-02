import { run, ethers } from "hardhat"

const verify = async (contractAddress: string, args: any[]) => {
  console.log("Verifying contract...")
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!")
    } else {
      console.log(e)
    }
  }
}


export async function checkAddressType(addressToCheck: string) {
  try {
    
    // Get the code at the address
    const code = await ethers.provider.getCode(addressToCheck);
    // Check if the code is empty (EOA) or not (Contract)
    if (code === '0x') {
      console.log(`${addressToCheck} is an Externally Owned Account (EOA).`);
      return false
    } else {
      console.log(`${addressToCheck} is a contract address.`);
      return true
    }

  } catch (error) {
    if (error instanceof Error){
      console.error(`Error checking address type: ${error.message}`);
    }

    return false
  }
}

export default verify;