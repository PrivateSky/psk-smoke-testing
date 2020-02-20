require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require("callflow").initialise();

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
    doSerialOne:function(callback){
        this.result = 0;
        this.callback=callback;
        var serial = this.serial(this.doParallelOne);
        worker().makeSerialTask(10, this, serial.progress);
        worker().makeSerialTask(20, this, serial.progress);
    },
    doSerialTwo:function () {
        var serial = this.serial(this.doParallelTwo);
        worker().makeSerialTask(30, this, serial.progress);
        worker().makeSerialTask(40, this, serial.progress);
    },
    __dummy:function(number, callback){
        this.result += number;
        //throw new Error("__dummy paralel");
        setTimeout(callback,5);
    },
    doParallelOne:function(err, res){
        var parallel = this.parallel(this.doSerialTwo);
        parallel.__dummy(1, parallel.progress);
        parallel.__dummy(2, parallel.progress);
        parallel.__dummy(3, parallel.progress);
        worker().makeParallelTask(1, this, parallel.progress);
        worker().makeParallelTask(2, this, parallel.progress);
    },
    doParallelTwo:function () {
        var parallel = this.parallel(this.checkResults);
        parallel.__dummy(1, parallel.progress);
        parallel.__dummy(2, parallel.progress);
        parallel.__dummy(3, parallel.progress);
        worker().makeParallelTask(10, this, parallel.progress);
        worker().makeParallelTask(20, this, parallel.progress);
    },
    checkResults:function(err){
        assert.equal(err,null,"Error");
        assert.equal(this.result,357,"Failed in callback sequence");
        this.callback();
    }
})();

assert.callback("Multiple Serial Parallel Test",function(callback){
    f.doSerialOne(callback);
})

