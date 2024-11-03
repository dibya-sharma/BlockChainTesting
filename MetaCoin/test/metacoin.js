const MetaCoin = artifacts.require("MetaCoin");

contract('MetaCoin', (accounts) => {
  it('should put 10000 MetaCoin in the first account', async () => {
    const metaCoinInstance = await MetaCoin.deployed();
    const balance = await metaCoinInstance.getBalance.call(accounts[0]);

    assert.equal(balance.valueOf(), 20000, "10000 wasn't in the first account");
  });
  it('should call a function that depends on a linked library', async () => {
    const metaCoinInstance = await MetaCoin.deployed();
    const metaCoinBalance = (await metaCoinInstance.getBalance.call(accounts[0])).toNumber();
    const metaCoinEthBalance = (await metaCoinInstance.getBalanceInEth.call(accounts[0])).toNumber();

    assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, 'Library function returned unexpected function, linkage may be broken');
  });
  it('should send coin correctly', async () => {
    const metaCoinInstance = await MetaCoin.deployed();

    // Setup 2 accounts.
    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    // Get initial balances of first and second account.
    const accountOneStartingBalance = (await metaCoinInstance.getBalance.call(accountOne)).valueOf();
    const accountTwoStartingBalance = (await metaCoinInstance.getBalance.call(accountTwo)).toNumber();

    // Make transaction from first account to second.
    const amount = 10;
    await metaCoinInstance.sendCoin(accountTwo, amount, { from: accountOne });

    // Get balances of first and second account after the transactions.
    const accountOneEndingBalance = (await metaCoinInstance.getBalance.call(accountOne)).toNumber();
    const accountTwoEndingBalance = (await metaCoinInstance.getBalance.call(accountTwo)).toNumber();

    assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });
  it('should recive money correctly', async () =>{
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
  }
  )
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
});
