import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JAN_1ST_2030 = 1893456000;
const ONE_GWEI: bigint = 1_000_000_000n;

const PaymentModule = buildModule("PaymentModule", (m) => {
  const usdtTokenAddress = m.getParameter(
    "usdtTokenAddress",
    "0x04f868C5b3F0A100a207c7e9312946cC2c48a7a3"
  );
  const marketplaceEO = m.getParameter(
    "marketplaceEOA",
    "0x97Da4bA4Cc43FD8011bEB7A71978d8c8c87a5287"
  );

  const payment = m.contract("Payment", [usdtTokenAddress, marketplaceEO]);

  return { payment };
});

export default PaymentModule;
