require('../../../../psknode/bundles/testsRuntime');

const fs = require('fs');
const double_check = require("double-check");
const assert = double_check.assert;
const crc32 = require('buffer-crc32');

let filePath;
let expectedCrc;
const barPath = '/big-file.big';

const tir = require("../../../../psknode/tests/util/tir.js");

require("callflow").initialise();

$$.flows.describe('WriteFileFromStream', {
    start: function (callback) {
        this.callback = callback;
        tir.launchVirtualMQNode((err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            this.createBAR();
        });
    },

    createBAR: function () {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildTemplateSeedSSI("default"), (err, bar) => {
            if (err) {
                throw err;
            }

            this.bar = bar;
            const fileStream = fs.createReadStream(filePath);
            this.bar.writeFile(barPath, fileStream, (err, data) => {
                assert.true(err === null || typeof err === "undefined", "Failed to write file.");
                this.bar.getKeySSIAsString((err, keySSI) => {
                    if (err) {
                        throw err;
                    }
                    this.readFile(keySSI);
                });
            })
        })
    },

    readFile: function (keySSI) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");

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

    filePath = path.join(testFolder, "big-file.bin");

    const buf = Buffer.alloc(1024 * 1024);
    expectedCrc = crc32.unsigned(buf);

    const stream = fs.createWriteStream(filePath);
    stream.write(buf);
    stream.on('finish', () => {
        assert.callback("Write file from stream test", (callback) => {
            $$.flows.start("WriteFileFromStream", "start", callback);
        }, 3000);
    });
    stream.end();

});
