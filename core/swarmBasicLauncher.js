var path = require("path");
process.env.PRIVATESKY_TMP = path.normalize(__dirname + "/../../../tmp");
require("../../../engine/launcher");
var assert = require("double-check").assert;

$$.requireLibrary("testSwarms");

function runCode(callback){
    $$.swarm.start("testSwarms.simpleSwarm").begin(1,2,callback);
    setTimeout(function () {
        process.exit();
    },1000);
}

$$.container.declareDependency("onlyNowICanRunThis", [$$.DI_components.swarmIsReady], function(fail, ready){
    //console.log("onlyNowICanRunThis", fail, ready);
    if(!fail){
        assert.callback("Basic Swarm Test",function (callback) {
            runCode(callback);
        })

    }
});