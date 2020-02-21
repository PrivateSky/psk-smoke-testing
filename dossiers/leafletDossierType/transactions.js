$$.transactions.describe("leaflets",{
    create: function(productUID, description){
        let agent = this.transaction.createAsset("leaflet", "init", productUID, description);
        this.commit();
    },
    update: function(productUID, description){
        let agent = this.transaction.lookup("leaflet", productUID);
        agent.update(description);
        //this.transaction.add(agent);
        this.transaction.commit();
    }
});
console.log("Loading transactions types ");