require('../../../../psknode/bundles/testsRuntime');
const tir = require('../../../../psknode/tests/util/tir');
const dc = require("double-check");

const assert = require('double-check').assert;

assert.callback('HTTP test', (callback) => {
    dc.createTestFolder('createDSU', (err, folder) => {
        tir.launchApiHubTestNode(10, folder, (err, port) => {
            if (err) {
                return;
            }

            const openDSU = require('opendsu');
            const http = openDSU.loadApi('http');

            const domain = 'default';
            assert.true(typeof http.poll === 'function');
            assert.true(typeof http.fetch === 'function');
            assert.true(typeof http.doPost === 'function');
            assert.true(typeof http.doPut === 'function');

            http.doPut(`http://localhost:${port}/bricking/${domain}/put-brick`, {test: 'da'}, (err, response) => {
                const brickHash = JSON.parse(response).message
                assert.true(brickHash === 'wDkQYUMeLGEaaGSwzJm1Xcd8R6eBCyKJiCwxqV3BmNn')

                http.fetch(`http://localhost:${port}/bricking/${domain}/get-brick/${brickHash}`).then((responseGetBrick) => {

                    assert.true(typeof responseGetBrick.text === 'function');
                    assert.true(typeof responseGetBrick.json === 'function');
                    assert.true(typeof responseGetBrick.formData === 'function');
                    assert.true(typeof responseGetBrick.blob === 'function');
                    assert.true(typeof responseGetBrick.arrayBuffer === 'function');

                    assert.true(typeof responseGetBrick.ok === 'boolean');
                    assert.true(responseGetBrick.ok === true);

                    http.fetch(`http://localhost:${port}/bricking/${domain}/downloadMultipleBricks/?hashes=${brickHash}`).then((responseMultiple) => {
                        assert.true(typeof responseMultiple.ok === 'boolean');
                        assert.true(responseMultiple.ok === true);

                        responseMultiple.arrayBuffer().then(data => {
                            const responseString = data.toString();

                            assert.true(typeof responseString === 'string');
                            assert.true(responseString.includes('test'));
                            assert.true(responseString.includes('da'));

                            callback();
                        });
                    });
                });
            });
        });
    });
}, 10000)

