require("../../../psknode/bundles/pskruntime");
var assert = require("double-check").assert;


var f = $$.flow.describe("MyFlow", {
    public:{
        interceptorCollector: Array,
    },
    resetInterceptorCollector: function() {
        this.interceptorCollector = [];
    },

    executeOne: function () {
        this.executeTwo();
    },
    executeTwo: function () {
    }
})();

assert.callback("test_interceptor_call_order_when_a_method_invokes_another_method", function (done) {
    f.resetInterceptorCollector();
    
    $$.interceptor.register('MyFlow', 'executeOne', 'before', function () {
        this.interceptorCollector.push(1);
    });
    $$.interceptor.register('MyFlow', 'executeOne', 'after', function () {
        this.interceptorCollector.push(2);
    });
    $$.interceptor.register('MyFlow', 'executeTwo', 'before', function () {
        this.interceptorCollector.push(3);
    });
    $$.interceptor.register('MyFlow', 'executeTwo', 'after', function () {
        this.interceptorCollector.push(4);
    });
    done();
    
    f.executeOne();
    assert.true(JSON.stringify(f.interceptorCollector) === JSON.stringify([1,3,4,2]), "Results don't match");
}/* , 500 */);
