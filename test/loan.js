const Loan = artifacts.require("./Loan.sol");

contract('Loan', accounts => {
    it('1. deploys a greeting contract', async () => {
        const simpleStorageInstance = await SimpleStorage.deployed();
        console.log(simpleStorageInstance);
    });

    /*it('2. has a default message', async () => {
        const message = await greetings.methods.message().call();
        assert.equal(message, 'Hello');
    });

    it('3. can change the message', async () => {
        await greetings.methods.setMessage('Hello Changes').send({from:accounts[0]});
        const message = await greetings.methods.message().call();
        assert.equal(message, 'Hello Changes');
    });*/

});

