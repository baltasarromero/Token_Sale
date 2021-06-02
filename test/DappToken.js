const DappToken = artifacts.require('./DappToken');

contract('DappToken', (accounts) => {

    it('initializes the contract with the correct values', async () => {
        const deployed = await DappToken.deployed();
        const name = await deployed.name.call();
        const symbol = await deployed.symbol.call();
        const standard = await deployed.standard.call();

        assert.equal('DApp Token', name, 'has the correct name');
        assert.equal('DAPP', symbol, 'has the correct symbol');
        assert.equal('DApp Token v1.0', standard, 'has the correct standard');
    });

    it('allocates initial supply upon deployment', async () => {
        const tokenInstance = await DappToken.deployed();
        const totalSupply = await tokenInstance.totalSupply.call();
        const adminBalance = await tokenInstance.balanceOf.call(accounts[0]);
        
        assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
        assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin');
    });

    it('transfers token ownership', async () => {
        const tokenInstance = await DappToken.deployed();

        try {
            const result = await tokenInstance.transfer(accounts[1], 999999999999999);
            assert(false);
        } catch(error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain rever');
        }

        // Get result value
        const result = await tokenInstance.transfer.call(accounts[1], 250000);
        assert(result, 'it returns false');

        // Transfer tokens
        const receipt = await tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] }); 
        // Check balances
        const recipientBalance = await tokenInstance.balanceOf.call(accounts[1]);
        assert.equal(250000, recipientBalance.toNumber(), 'adds the amount to the receiving account');
        const adminBalance = await tokenInstance.balanceOf.call(accounts[0]);
        assert.equal(750000, adminBalance.toNumber(), 'deducts  the amount to the receiving account');

        // Check for the event
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal('Transfer', receipt.logs[0].event, 'should be the "Transfer" event');
        assert.equal(accounts[0], receipt.logs[0].args._from, 'logs the account the tokens are transferred from');
        assert.equal(accounts[1], receipt.logs[0].args._to, 'logs the account the tokens are transferred to');
        assert.equal(250000, receipt.logs[0].args._value, 'logs the transfer amount');
    });

    it('approves tokens for delegated transfer', async () => {
        const tokenInstance = await DappToken.deployed();

        const result = tokenInstance.approve.call(accounts[0], 100);
        assert(result, 'it returns true');

        const receipt = await tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal('Approval', receipt.logs[0].event, 'should be the "Approval" event');
        assert.equal(accounts[0], receipt.logs[0].args._owner, 'logs the account the tokens are authorized by');
        assert.equal(accounts[1], receipt.logs[0].args._spender, 'logs the account the tokens are authorized to');
        assert.equal(100, receipt.logs[0].args._value, 'logs the allowance amount');

        const allowance = await tokenInstance.allowance(accounts[0], accounts[1]);
        assert.equal(100, allowance, 'stores the allowance for delegated transfer');

    });

    it('handles delegated transfer', async () => {
        const tokenInstance = await DappToken.deployed();
        const fromAccount = accounts[2];
        const toAccount = accounts[3];
        const spendingAccount = accounts[4];
        const fromAcccountInitialBalance = 100;
        const allowedAmount = 10;
        
        // Transfer some tokens to account
        await tokenInstance.transfer(fromAccount, fromAcccountInitialBalance, { from: accounts[0] });

        const approvalReceipt = await tokenInstance.approve(spendingAccount, allowedAmount, { from: fromAccount });
        
        // Try transferring something larger than the sender's balance
        try {
            const transferReceipt = await tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
            assert.fail();
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
        }    

        try {
            const transferReceipt2 = await tokenInstance.transferFrom(fromAccount, toAccount, allowedAmount * 2, { from: spendingAccount });
            assert.fail();
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than the approved amount');
        } 

        // Test return with valid parameter    
        const success = await tokenInstance.transferFrom.call(fromAccount, toAccount, allowedAmount, { from: spendingAccount });
        assert(success);

        // Actually test a trasnfer transaction
        const receipt = await tokenInstance.transferFrom(fromAccount, toAccount, allowedAmount, { from: spendingAccount });
        // Validate event
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal('Transfer', receipt.logs[0].event, 'should be the "Transfer" event');
        assert.equal(fromAccount, receipt.logs[0].args._from, 'logs the account the tokens are transferred from');
        assert.equal(toAccount, receipt.logs[0].args._to, 'logs the account the tokens are transferred to');
        assert.equal(10, receipt.logs[0].args._value, 'logs the transfer amount');
        // Validate balances
        const fromAccountBalance = await tokenInstance.balanceOf(fromAccount);
        const toAccountBalance = await tokenInstance.balanceOf(toAccount);

        assert.equal(fromAcccountInitialBalance - allowedAmount, fromAccountBalance.toNumber(), 'deducts value from from balance');
        assert.equal(allowedAmount, toAccountBalance.toNumber(), 'to balance is increased');    

        // validate allowance
        const spendingAccountAllowance = await tokenInstance.allowance(fromAccount, spendingAccount);

        assert.equal(0, spendingAccountAllowance.toNumber(), 'spending account allowance is updated');

    });
});