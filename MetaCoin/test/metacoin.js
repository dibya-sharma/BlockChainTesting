const MetaCoin = artifacts.require("MetaCoin");

contract('MetaCoin', (accounts) => {
  const GAS_PRICE = web3.utils.toWei('2', 'gwei');

  it('should put 20000 MetaCoin in the first account', async () => {
    const metaCoinInstance = await MetaCoin.deployed();
    const balance = await metaCoinInstance.getBalance.call(accounts[0]);

    assert.equal(balance.valueOf(), 20000, "20000 wasn't in the first account");
  });
  it('should call a function that depends on a linked library', async () => {
    const metaCoinInstance = await MetaCoin.deployed();
    const metaCoinBalance = (await metaCoinInstance.getBalance.call(accounts[0])).toNumber();
    console.log(`Balance of account 0 : ${metaCoinBalance} `);
    const metaCoinEthBalance = (await metaCoinInstance.getBalanceInEth.call(accounts[0])).toNumber();
    console.log(`EthBalance of account 0 : ${metaCoinEthBalance} `);
    assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, 'Library function returned unexpected function, linkage may be broken');
  });

  it('should measure gas for initial deployment', async() => {

    //Deploy the contract and get the transaction object 
    const tx = await MetaCoin.new();
    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
    console.log('\nDeployment Gas Consumption:');
    console.log(`Gas Used: ${receipt.gasUsed}`);
    console.log(`Gas Cost (in wei): ${receipt.gasUsed * GAS_PRICE}`); 
    assert.isTrue(receipt.gasUsed>0, "Deployment should consume enough gas")
  })

  it('should transfer tokens correctly', async () => {
    const metaCoinInstance = await MetaCoin.deployed();

    // Setup 2 accounts.
    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    // Get initial balances of first and second account.
    const accountOneStartingBalance = (await metaCoinInstance.getBalance.call(accountOne)).valueOf();
    const accountTwoStartingBalance = (await metaCoinInstance.getBalance.call(accountTwo)).toNumber();

    // Make transaction from first account to second.
    const amount = 10;
    const result = await metaCoinInstance.sendCoin(accountTwo, amount, { from: accountOne });
    assert.isTrue(result.receipt.status, "Transaction should succeed");

    // Get balances of first and second account after the transactions.
    const accountOneEndingBalance = (await metaCoinInstance.getBalance.call(accountOne)).toNumber();
    const accountTwoEndingBalance = (await metaCoinInstance.getBalance.call(accountTwo)).toNumber();

    assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });

  it('should measure gas for transfers', async () => {
    const metaCoinInstance = await MetaCoin.deployed();
    const sender = accounts[0];
    const receiver = accounts[1];
    const amount = 100;
    const amount1 = 300;

    // First transfer
    const firstTransfer = await metaCoinInstance.sendCoin(
      receiver, 
      amount, 
      { from: sender, gasPrice: GAS_PRICE }
    );
    
    // Second transfer
    const secondTransfer = await metaCoinInstance.sendCoin(
      receiver, 
      amount1, 
      { from: sender, gasPrice: GAS_PRICE }
    );

    console.log('\nTransfer Gas Consumption:');
    console.log(`First Transfer Gas Used: ${firstTransfer.receipt.gasUsed}`);
    console.log(`Second Transfer Gas Used: ${secondTransfer.receipt.gasUsed}`);
    
    assert.isTrue(
      Math.abs(firstTransfer.receipt.gasUsed - secondTransfer.receipt.gasUsed) < 1000,
      "Gas consumption should be relatively consistent between transfers"
    );
  });

  it('should send money correctly while checking for enough available balance', async () =>{
    const metaCoinInstance = await MetaCoin.deployed();
    const accountZero = accounts[0];
    const accountFour = accounts[4];
    const accountZeroStartingBalance = (await metaCoinInstance.getBalance.call(accountZero)).toNumber();
    const accountFourStartingBalance = (await metaCoinInstance.getBalance.call(accountFour)).toNumber();
    const totalStartingBalance = accountZeroStartingBalance + accountFourStartingBalance;
    const amount = 20;
    console.log(`accountZeroBalance before transaction: ${accountZeroStartingBalance}`);
    console.log(`accountFourBalance before transaction: ${accountFourStartingBalance}`);
    await metaCoinInstance.sendCoin(accountFour,amount,{from:accountZero});
    const accountZeroEndingBalance = (await metaCoinInstance.getBalance.call(accountZero)).toNumber();
    const accountFourEndingBalance = (await metaCoinInstance.getBalance.call(accountFour)).toNumber();
    const totalEndingBalance = accountZeroEndingBalance + accountFourEndingBalance;
    assert.equal(totalStartingBalance.valueOf(),totalEndingBalance, `transaction not happend correctly ${amount}`);
    console.log(`accountZeroBalance after transaction: ${accountZeroEndingBalance}`);
    console.log(`accountFourBalance after transaction: ${accountFourEndingBalance}`);
  })


  it('should restrict to recive money', async()=>{
    const metaCoinInstance = await MetaCoin.deployed();
    const accountZero = accounts[0];
    const accountFour = accounts[4];
    const accountThree = accounts[3];
    const accountZeroStartingBalance = (await metaCoinInstance.getBalance.call(accountZero)).toNumber();
    const accountThreeStartingBalance = (await metaCoinInstance.getBalance.call(accountThree)).toNumber();
    const accountFourStartingBalance = (await metaCoinInstance.getBalance.call(accountFour)).toNumber();
    const totalStartingBalance = accountZeroStartingBalance + accountFourStartingBalance +accountThreeStartingBalance; 
    console.log(`accountZeroBalance before transaction: ${accountZeroStartingBalance}`);
    console.log(`accountThreeBalance before transaction: ${accountThreeStartingBalance}`);
    console.log(`accountFourBalance before transaction: ${accountFourStartingBalance}`);
    const amount = 9000; 
    let shortage = 0;
    if (accountThreeStartingBalance < amount) {
      shortage = amount - accountThreeStartingBalance;
      console.log(`account 3 need ${shortage} to lend account 4`);
    
    assert(accountZeroStartingBalance >= shortage,`account 0 does not have enough shortage amount of ${shortage}`);
    }
    console.log(`transferring ${shortage} to account 3`);
    await metaCoinInstance.sendCoin(accountThree,amount,{from:accountZero});
    const accountZeroEndingBalance = (await metaCoinInstance.getBalance.call(accountZero)).toNumber();
    console.log(`accountZeroBalance after transferring: ${accountZeroEndingBalance}`);
    console.log(`accountThreeBalance after loaning from Zero: ${(await metaCoinInstance.getBalance.call(accountThree)).toNumber()}`);
    console.log(`transferring ${amount} to account 4`);
    await metaCoinInstance.sendCoin(accountFour,amount,{from:accountThree});
    const accountFourEndingBalance = (await metaCoinInstance.getBalance.call(accountFour)).toNumber();
    console.log(`accountFourBalance after transaction: ${(await metaCoinInstance.getBalance.call(accountFour)).toNumber()}`);
  })


it('should handle transfer to self', async() => {
  const metaCoinInstance = await MetaCoin.deployed();
  const selfaccount = accounts[0];
  const amount = 100;
  const accountZeroStartingBalance = (await metaCoinInstance.getBalance.call(selfaccount)).toNumber();
  console.log(`accountZeroBalance before transferring: ${accountZeroStartingBalance}`);
  await metaCoinInstance.sendCoin(selfaccount, amount, { from:selfaccount });
  const accountZeroEndingBalance = (await metaCoinInstance.getBalance.call(selfaccount)).toNumber();
  console.log(`accountZeroBalance after selftransfer: ${accountZeroEndingBalance}`);
  assert.equal(accountZeroStartingBalance, accountZeroEndingBalance, "balance should remain unchanged while transferring to self");
})


it('should emit Transfer event on successful transfer', async () => {
  const metaCoinInstance = await MetaCoin.deployed();
  const sender = accounts[0];
  const receiver = accounts[1]; 
  const amount = 100;
  const result = await metaCoinInstance.sendCoin(receiver, amount, { from: sender });
  
  console.log("Number of events emitted:", result.logs.length);
  assert.equal(result.logs.length, 1, "Should emit one event");

  console.log("Event name:", result.logs[0].event);
  assert.equal(result.logs[0].event, "Transfer", "Should emit Transfer event");

  console.log("Sender address in event:", result.logs[0].args._from);
  assert.equal(result.logs[0].args._from, sender, "Should log sender address");

  console.log("Receiver address in event:", result.logs[0].args._to);
  assert.equal(result.logs[0].args._to, receiver, "Should log receiver address");

  console.log("Transfer amount in event:", result.logs[0].args._value.toNumber());
  assert.equal(result.logs[0].args._value.toNumber(), amount, "Should log transfer amount");
});
 });
