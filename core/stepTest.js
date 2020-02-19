require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require("callflow").initialise();

const assert = require("../../../modules/double-check").assert;

const f = $$.flow.describe("stepExample", {
    private: {
        a1: "int",
        a2: "int"
    },
    public: {
        result: "int"
    },
    begin: function (a1, a2, callback) {
        this.a1 = a1;
        this.a2 = a2;
        this.callback = callback;
        this.doStep(3);
    },
    doStep: function (a) {
        this.result = this.a1 + this.a2 + a;
        this.doResult();
    },
    doResult: function () {
        assert.equal(this.result, 6, "Results don't match");
        this.callback();
    }
})();

assert.callback("Step test", function (callback) {
    f.begin(1, 2, callback);
});

