var path = require("path");
process.env.PRIVATESKY_TMP = path.normalize(__dirname + "/../../../tmp");

require("../../../psknode/bundles/pskruntime");
require("callflow");
require("launcher");
var assert = require('double-check').assert;
$$.loadLibrary("testSwarms", "../../../libraries/testSwarms");

function runCode(callback){
    $$.swarm.start("testSwarms.multiContextsSwarm").begin(1,2,callback);
    setTimeout(function () {
        process.exit();
    },1000);
}

$$.container.declareDependency("onlyNowICanRunThis", [$$.DI_components.swarmIsReady], function(fail, ready){
    //console.log("onlyNowICanRunThis", fail, ready);
    if(!fail){
        assert.callback("MultiContexts test",function(callback){
            runCode(callback);
        },2000)

    }
});