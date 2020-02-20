require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require("callflow").initialise();

const assert = require("double-check").assert;

const f = $$.flow.describe("FlowExample", {
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


assert.callback("interceptor_should_be_called_on_phaseName_*_and_named_swarmType",
    function (done) {

        let interceptorCalled = false;

        $$.interceptor.register('FlowExample', '*', 'before', () => {
            interceptorCalled = true;
        });

        f.add(1, 2); // (1 + 2)
        assert.equal(f.result, 3, "Results don't match");
        assert.true(interceptorCalled, 'Interceptor was not called when it should have been');
        done();
    });

assert.callback("interceptor_should_be_called_on_swarmType_and_swarmPhase_*",
    function (done) {

        let interceptorCalled = false;

        $$.interceptor.register('*', '*', 'before', function (target, ...args) {

            interceptorCalled = true;
        });

        f.add(1, 2); // (1 + 2)
        assert.equal(f.result, 3, "Results don't match");
        assert.true(interceptorCalled, 'Interceptor was not called when it should have been');
        done();
    });

assert.callback("interceptor_should_be_called_on_swarmType_*_and_named_phaseName",
    function (done) {

        let interceptorCalled = false;

        $$.interceptor.register('*', 'add', 'before', () => {

            interceptorCalled = true;
        });


        f.add(1, 2); // (1 + 2)
        assert.equal(f.result, 3, "Results don't match");
        assert.true(interceptorCalled, 'Interceptor was not called when it should have been');
        done();
    });

assert.callback("interceptor_should_know_phaseName_and_swarmTypeName",
    function (done) {

        let interceptorCalled = false;

        $$.interceptor.register('*', '*', 'before', function () {
            const swarmTypeName = this.getMetadata('swarmTypeName');
            const phaseName     = this.getMetadata('phaseName');

            assert.true(swarmTypeName !== '' && swarmTypeName, 'Missing swarmTypeName');
            assert.true(phaseName !== '' && phaseName, 'Missing phaseName');

            interceptorCalled = true;
        });


        f.add(1, 2); // (1 + 2)
        assert.equal(f.result, 3, "Results don't match");
        assert.true(interceptorCalled, 'Interceptor was not called when it should have been');
        done();
    });

