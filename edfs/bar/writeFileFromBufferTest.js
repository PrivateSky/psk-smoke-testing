require('../../../../psknode/bundles/testsRuntime');

const fs = require('fs');
const double_check = require("double-check");
const assert = double_check.assert;
const crc32 = require('buffer-crc32');

let expectedCrc;
const barPath = '/big-file.big';

const tir = require("../../../../psknode/tests/util/tir.js");
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
const keySSISpace = openDSU.loadApi("keyssi");
const bdns = openDSU.loadApi("bdns");

require("callflow").initialise();

$$.flows.describe('WriteFileFromBuffer', {
    start: function (callback) {
        this.callback = callback;
        tir.launchVirtualMQNode((err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            bdns.addRawInfo("default", {
                brickStorages: [`http://localhost:${port}`],
                anchoringServices: [`http://localhost:${port}`]
            });

            this.createBAR();
        });
    },

    createBAR: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");
            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, bar) => {
                if (err) {
                    throw err;
                }

                const buf = Buffer.alloc(1024 * 1024);
                expectedCrc = crc32.unsigned(buf);

                bar.writeFile(barPath, buf, (err, data) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to write file.");
                    bar.getKeySSI((err, keySSI) => {
                        if (err) {
                            throw err;
                        }
                        this.readFile(keySSI);
                    });
                })
            });

        });
    },

    readFile: function (keySSI) {
        resolver.loadDSU(keySSI, (err, newBar) => {
            if (err) {
                throw err;
            }
            newBar.readFile(barPath, (err, data) => {
                const dataCrc = crc32.unsigned(data);
                assert.true(err === null || typeof err === "undefined", "Failed read file from BAR.");
                assert.equal(1024 * 1024, data.length, "Failed asserting data length.");
                assert.equal(expectedCrc, dataCrc, "Failed asserting data integrity.");
                this.callback();
            });
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    assert.callback("Write file from buffer test", (callback) => {
        $$.flows.start("WriteFileFromBuffer", "start", callback);
    }, 3000);
});
