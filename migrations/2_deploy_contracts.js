const DappToken = artifacts.require("./DappToken.sol");
const DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports =  async (deployer) => {
  // Token price is 0.001 Eth
  const tokenSalePrice = 100000000000000; // in Wei

  await deployer.deploy(DappToken, 1000000);
  await deployer.deploy(DappTokenSale, DappToken.address,tokenSalePrice);
};
