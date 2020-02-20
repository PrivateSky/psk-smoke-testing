require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require("callflow").initialise();

var assert= require("double-check").assert;

var f = $$.flow.describe("FlowExample", {
    private:{
        a1:"int",
        a2:"int"
    },
    public:{
        result:"int"
    },
    begin:function(a1,a2){
        this.result = a1 + a2;
    }
})();

assert.callback("BasicTest", function(callback){
    f.begin(1, 2);
    assert.equal(f.result,3,"Results don't match");
    callback();
})
