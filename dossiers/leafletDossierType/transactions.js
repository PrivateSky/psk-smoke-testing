$$.transactions.describe("leaflets",{
    create: function(productUID, description){
        let agent = this.transaction.createAsset("leaflet", "init", productUID, description);
        this.onCommit(()=>{
            this.return(undefined, agent.asJSON());
        });
        this.commit();
    },
    update: function(productUID, description){
        let agent = this.transaction.lookup("leaflet", productUID);
        agent.update(description);
        //this.transaction.add(agent);
        this.onCommit(()=>{
            this.return(undefined, agent.asJSON());
        });
        this.commit();
    }
});
console.log("Loading transactions types ");