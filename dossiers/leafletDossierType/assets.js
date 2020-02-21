$$.assets.describe("leaflet",{
    public:{
        alias:"string",
        productName:"String",
        productUID:"String",
        description:"String",
        sideEffects:"String",
        applications:"String",
        approvalDate:"Date",
        approverSignature:"Signature"
    },
    init: function(productUID, description){
        this.productUID = productUID;
        this.alias      = productUID;
        this.description = description;
    },
    update: function(description){
        this.description = description;
    }
});
console.log("Loading assets types");