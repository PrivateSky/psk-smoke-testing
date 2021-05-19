'use strict';

const util = require('util');
require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskWebServer");

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");

double_check.createTestFolder("notifications_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    assert.callback("NotificationsTest", (callback) => {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        const createDSU = util.promisify(resolver.createDSU);
        const loadDSU = util.promisify(resolver.loadDSU);

        let dsu;
        let dsuKeySSI;

        tir.launchVirtualMQNode(10, testFolder, async (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            dsu = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
            promisifyDSU(dsu);
            dsu.toggleAnchoringNotifications(true);

            await dsu.writeFile('first-file.txt', 'Lorem ipsum');
            dsuKeySSI = await dsu.getKeySSIAsString();
            resolver.invalidateDSUCache(dsuKeySSI);

            const sameDSU = await loadDSU(dsuKeySSI);
            promisifyDSU(sameDSU);
            sameDSU.toggleAutoSync(true, {});

            dsu.writeFile('second-file.txt', 'Lorem ipsum');

            setTimeout(async () => {
                console.log(await sameDSU.listFiles('/'));
            }, 1000);
            //callback();
        });

        const promisifyDSU = (...args) => {
            // Methods to promisify
            const methodsToPromisify = [
                'getLastHashLinkSSI',
                'getKeySSI',
                'getKeySSIAsObject',
                'getKeySSIAsString',
                'addFiles',
                'appendToFile',
                'addFolder',
                'addFile',
                'readFile',
                'extractFolder',
                'extractFile',
                'writeFile',
                'delete',
                'rename',
                'listFiles',
                'listFolders',
                'createFolder',
                'cloneFolder',
                'readDir',
                'mount',
                'unmount',
                'listMountedDSUs',
                'commitBatch',
                'cancelBatch',
                'batch',
            ]

            for (const dsu of args) {
                for (const method of methodsToPromisify) {
                    dsu[method] = util.promisify(dsu[method]);
                }
            }
        }
    }, 3600);
});
