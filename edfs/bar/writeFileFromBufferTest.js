require('../../../../psknode/bundles/consoleTools');
require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const fs = require('fs');
const EDFS = require("edfs");
const double_check = require("double-check");
const assert = double_check.assert;
const crc32 = require('buffer-crc32');

let expectedCrc;
const barPath = '/big-file.big';

const tir = require("../../../../psknode/tests/util/tir.js");

$$.flows.describe('WriteFileFromBuffer', {

    start: function (callback) {
        this.callback = callback;

        $$.securityContext = require("psk-security-context").createSecurityContext();
        tir.launchVirtualMQNode((err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            $$.BDNS.addConfig("default", {
                endpoints: [
                    {
                        endpoint:`http://localhost:${port}`,
                        type: 'brickStorage'
                    },
                    {
                        endpoint:`http://localhost:${port}`,
                        type: 'anchorService'
                    }
                ]
            })
            this.createBAR();
        });
    },

    createBAR: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");
            EDFS.createDSU("Bar", (err, bar) => {
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
        EDFS.resolveSSI(keySSI,"Bar", (err, newBar) => {
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
