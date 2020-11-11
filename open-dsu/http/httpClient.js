require('../../../../psknode/bundles/testsRuntime');
require('../../../../psknode/bundles/openDSU');
const tir = require('../../../../psknode/tests/util/tir');

const assert = require('double-check').assert;
const openDSU = require('opendsu');
const http = openDSU.loadApi('http');

assert.callback('HTTP test', (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            return;
        }
        const domain = 'default';
        assert.true(typeof http.poll === 'function');
        assert.true(typeof http.fetch === 'function');
        assert.true(typeof http.doPost === 'function');
        assert.true(typeof http.doPut === 'function');

        http.doPut(`http://localhost:${port}/bricks/put-brick/${domain}`, { test: 'da' }, (err, response) => {
            const brickHash = JSON.parse(response).message
            assert.true(brickHash === '0de3c7406ae0dab1ed5f90fe20dd59992a7d6f9a383ff397b2fa9325c34011cf')

            http.fetch(`http://localhost:${port}/bricks/get-brick/${brickHash}/${domain}`).then((responseGetBrick) => {

                assert.true(typeof responseGetBrick.text === 'function');
                assert.true(typeof responseGetBrick.json === 'function');
                assert.true(typeof responseGetBrick.formData === 'function');
                assert.true(typeof responseGetBrick.blob === 'function');
                assert.true(typeof responseGetBrick.arrayBuffer === 'function');

                assert.true(typeof responseGetBrick.ok === 'boolean');
                assert.true(responseGetBrick.ok === true);

                http.fetch(`http://localhost:${port}/bricks/downloadMultipleBricks/${domain}/?hashes=${brickHash}`).then((responseMultiple) => {
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
}, 10000)

