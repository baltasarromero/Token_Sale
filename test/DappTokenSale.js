const DappTokenSale = artifacts.require('./DappTokenSale');
const DappToken = artifacts.require('./DappToken');

contract('DappTokenSale', (accounts) => {
    var tokenSaleInstance;
    var tokenInstance;
    const admin = accounts[0];
    const buyer = accounts[1];
    const tokenSalePrice = 100000000000000; // in Wei
    const tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', async () => {
        tokenSaleInstance = await DappTokenSale.deployed();
        
        assert.notEqual(0x0, tokenSaleInstance.address, 'contract has a valid address');

        // 
        var tokenContract = await tokenSaleInstance.tokenContract.call();
        assert.notEqual(0x0, tokenContract.address, 'has a valid token contract address');

        // test price
        const deployedTokenSalePrice = await tokenSaleInstance.tokenPrice.call();
        assert.equal(tokenSalePrice, deployedTokenSalePrice, 'token price is correct');


    });

    it('facilitates buying tokens', async () => {
        tokenSaleInstance = await DappTokenSale.deployed();
        tokenInstance = await DappToken.deployed();
        // Provision 75% of the tokens for sale
        const transferReceipt = await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });

        //const ethTransferReceip = await buyer.transfer(web3.utils.toWei('80', 'ether'), { from: accounts[2] });
    
        numberOfTokens = 10;
        const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value:  numberOfTokens * tokenSalePrice });
        
        // Check for the event
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal('Sell', receipt.logs[0].event, 'should be the "Sell" event');
        assert.equal(accounts[1], receipt.logs[0].args._buyer, 'logs the buyer of the tokens');
        assert.equal(numberOfTokens, receipt.logs[0].args._amount, 'logs the amount of tokens purchased');
        
        const amount = await tokenSaleInstance.tokensSold.call();
        assert.equal(numberOfTokens, amount, 'increments the number of tokens sold');

        // Check balances
        const tokenSaleInstanceBalance = await tokenInstance.balanceOf(tokenSaleInstance.address);
        assert.equal(tokensAvailable - numberOfTokens, tokenSaleInstanceBalance.toNumber(), 'TokenSale balance should be decreased' );

        const buyerBalance = await tokenInstance.balanceOf(buyer);
        assert.equal(numberOfTokens, buyerBalance.toNumber(), 'Balance buyer must equal number of tokens bought' );


        // try to buy tokens with not enough eth+
        try {
            const failedReceipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value:  1 });
            assert.fail();
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
        }
        
        // try to buy more tokens than the available quantity
        try {
            await tokenSaleInstance.buyTokens(800000, { from: buyer, value:  800000 * tokenSalePrice });
            assert.fail();
        } catch (error) {
            console.log(error.message);
            assert(error.message.indexOf('revert') >= 0, 'Number of tokens must be equal or lower to the available quantity');
        }
    }); 

    it('ends token sale', async () => {
        tokenSaleInstance = await DappTokenSale.deployed();
        tokenInstance = await DappToken.deployed();

        // Try to end sale from account other than the admin
        try {
            await tokenSaleInstance.endSale({ from: buyer });
            assert.fail();
        } catch(error) {
            assert(error.message.indexOf('revert') >= 0, 'Only the admin can end the sale');
        }

        // Try to end sale from account other than the admin
        const endReceipt = await tokenSaleInstance.endSale({ from: admin });
        const adminBalance = await tokenInstance.balanceOf(admin);
        assert.equal(adminBalance.toNumber(), 999990, 'Remaining tokens transfered to the admin');
          
        // Check that the token price is reset after self destruct
        const tokenSaleCode = await web3.eth.getCode(tokenSaleInstance.address);

        console.log('This is the code ' + tokenSaleCode);
        assert.equal(tokenSaleCode, '0x', 'TokenSale code should be deleted');

    });
});