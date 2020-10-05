require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/openDSU");

require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;
const openDSU = require("opendsu");
const keySSISpace = openDSU.loadApi("keyssi");
const bdns = openDSU.loadApi("bdns");

assert.callback("Get Info Test", (callback) => {
    const defaultConfig = {
        "default": {
            "replicas": [],
            "brickStorages": [
                "http://localhost:8080"
            ],
            "anchoringServices": [
                "http://localhost:8080"
            ]
        }
    };
    bdns.getRawInfo("default", (err, rawInfo) => {
        if (err) {
            throw err;
        }

        assert.true(JSON.stringify(rawInfo) === JSON.stringify(defaultConfig["default"]));

        bdns.getBrickStorages("default", (err, brickStorages) => {
            if (err) {
                throw err;
            }

            assert.arraysMatch(brickStorages, defaultConfig["default"].brickStorages);

            bdns.getAnchoringServices("default", (err, anchoringServices) => {
                if (err) {
                    throw err;
                }

                assert.arraysMatch(anchoringServices, defaultConfig["default"].anchoringServices);

                bdns.getReplicas("default", (err, replicas) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(replicas, defaultConfig["default"].replicas);
                    callback();
                });
            });
        });
    });
});