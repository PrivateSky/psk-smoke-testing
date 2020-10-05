require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskWebServer");

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

$$.flows.describe('ReadFileFromStream', {

    start: function (callback) {
        this.callback = callback;

        $$.securityContext = require("psk-security-context").createSecurityContext();
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

                this.bar = bar;
                const buf = Buffer.alloc(1024 * 1024);
                expectedCrc = crc32.unsigned(buf);

                this.bar.writeFile(barPath, buf, (err, data) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to write file.");

                    this.bar.getKeySSI((err, keySSI) => {
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
            let fileData = Buffer.alloc(0);

            newBar.createReadStream(barPath, (err, stream) => {
                stream.on('data', (chunk) => {
                    fileData = Buffer.concat([fileData, chunk]);
                });
                stream.on('error', (err) => {
                    throw err;
                });
                stream.on('end', () => {
                    const dataCrc = crc32.unsigned(fileData);
                    assert.equal(1024 * 1024, fileData.length, "Failed asserting data length.");
                    assert.equal(expectedCrc, dataCrc, "Failed asserting data integrity.");
                    this.callback();
                });
            });
        })

    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.callback("Read file from stream test", (callback) => {
        $$.flows.start("ReadFileFromStream", "start", callback);
    }, 3000);
});
