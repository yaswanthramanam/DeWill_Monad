// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeWillModule = buildModule("DeWillModule", (m) => {

const DeWill = m.contract("DeWill");

  return { DeWill };
});

export default DeWillModule;
