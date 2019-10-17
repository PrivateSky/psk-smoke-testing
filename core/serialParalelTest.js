require("../../../psknode/bundles/pskruntime");
var assert = require("double-check").assert;

var worker = $$.flow.describe("worker", {
    makeSerialTask:function(value, bag, callback){
        this.bag = bag;
        var serialExecution = this.serial(callback);

        serialExecution.__mkOneStep(value, serialExecution.progress);
        for(var i = 1; i < 3; i++){
            serialExecution.__mkOneStep(value + i, serialExecution.progress);
        }
    },
    makeParallelTask: function(value, bag, callback){
        bag.result += value;
        setTimeout(callback,2);
    },
    __mkOneStep:function(value, callback){
        this.bag.result += value;
        setTimeout(callback,3);
    }
});


var f = $$.callflow.describe("paralelSerialExample", {
    public:{
      result:"int"
    },
    doSerial:function(callback){
        this.result = 0;
        this.callback=callback;
        var serial = this.serial(this.doParallel);
        worker().makeSerialTask(10, this, serial.progress);
        worker().makeSerialTask(20, this, serial.progress);
    },
    __dummy:function(number, callback){
        this.result += number;
        //throw new Error("__dummy paralel");
        setTimeout(callback,5);
    },
    doParallel:function(err, res){
        var parallel = this.parallel(this.checkResults);
        parallel.__dummy(1, parallel.progress);
        parallel.__dummy(2, parallel.progress);
        parallel.__dummy(3, parallel.progress);
        worker().makeParallelTask(1, this, parallel.progress);
        worker().makeParallelTask(2, this, parallel.progress);
    },
    checkResults:function(err){
        assert.equal(err,null,"Error");
        assert.equal(this.result,105,"Failed in callback sequence");
        this.callback();
    }
})();

assert.callback("Serial Parallel Test",function(callback){
    f.doSerial(callback);
})

