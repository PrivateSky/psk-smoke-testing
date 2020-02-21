$$.swarms.describe("transactionHandler",{
    start: function(identity, transactionName, methodName, ...args){
        let transaction = $$.blockchain.startTransactionAs(identity, transactionName, methodName, ...args);
        transaction.onReturn((err, result)=>{
            this.return(err, result);
        });
    }
});

console.log("Loading swarm types");