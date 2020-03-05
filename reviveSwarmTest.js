require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("callflow").initialise();

const beesHealer = require("swarmutils").beesHealer;
const assert = require("double-check").assert;

const swarmEngine = require("swarm-engine");
swarmEngine.initialise();

const f = $$.swarms.describe("simpleSwarm", {
    private:{
        a1:"int",
        a2:"int"
    },
    public:{
        result:"int"
    },
    begin:function(a1,a2){
        this.a1 = a1;
        this.a2 = a2;
        this.result=this.a1+this.a2;
    }
});

assert.callback('Revive swarm test', (callback) => {
    beesHealer.asJSON(f().getInnerValue(), "begin", [1, 2], function (err, res) {
        console.log("writing done!");
        if (err) {
            console.error(err);
            return;
        }

        const swarm = $$.swarmEngine.revive_swarm(JSON.parse(JSON.stringify(res)));

        assert.equal(swarm.result, 3, "Revitalisation failed");
        callback();
    });
});
