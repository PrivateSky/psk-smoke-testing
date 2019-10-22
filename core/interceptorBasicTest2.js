require("../../../psknode/bundles/pskruntime");
var assert = require("../../../modules/double-check").assert;

var f = $$.flow.describe("FlowExample", {
    private: {
        a1: "int",
        a2: "int"
    },
    public: {
        result: "int"
    },
    add: function (a1, a2) {
        this.result = a1 + a2;
    }
})();

/* 
var preAdd = function () {
    console.log("--> invoked interceptor: preAdd", arguments);
}
$$.interceptor.register('FlowExample', 'add', 'before', preAdd);
// $$.interceptor.register('FlowExample', 'add', 'before', preAdd);        //WARNING: "Duplicated interceptor for 'global.FlowExample/add/before'"
 */

assert.callback("sum_should_be_computed_as_usual_not_multiplied_by_1000",
    function (done) {
        f.add(1, 2); // (1 + 2)
        assert.equal(f.result, 3, "Results don't match");
        done();
    });

assert.callback("sum_should_be_multiplied_by_1000",
    function (done) {
        var multiplyResultBy1000 = function () {
            this.result *= 1000;
        }
        $$.interceptor.register('FlowExample', 'add', 'after', multiplyResultBy1000);

        f.add(1, 2); // (1 + 2) * 1000
        assert.equal(f.result, 3000, "Results don't match");
        done();
    });
// assert.callback("sum_should_be_multiplied_by_1000", function (done) {
//     $$.interceptor.register('FlowExample', 'add', 'after', function () {
//         this.result *= 1000;
//         done();
//     });

//     f.add(1, 2);
//     assert.equal(f.result, 3000, "Results don't match");
// }/* , 500 */);

assert.callback("sum_should_always_be_multiplied_by_1000_from_now_on",
    function (done) {
        f.add(1, 2); // (1 + 2) * 1000 <== interceptor`multiplyResultBy1000` should remain registered
        assert.equal(f.result, 3000, "Results don't match");
        done();
    });

assert.callback("sum_should_still_be_0_when_adding_opposite_numbers",
    function (done) {
        f.add(-123, 123);
        assert.equal(f.result, 0.0, "Results don't match");
        done();
    });
