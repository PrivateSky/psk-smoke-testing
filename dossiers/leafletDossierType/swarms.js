$$.swarms.describe("transactionHandler",{
    start: function(identity, transactionName, methodName, ...args){
        $$.blockchain.startTransactionAs(identity,transactionName, methodName, ...args);
    }
});


console.log("Loading swarm echo description");