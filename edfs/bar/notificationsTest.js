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

        const createDSU = async (keySSI) => {
            const create = util.promisify(resolver.createDSU);
            const dsu = await create(keySSI);
            promisifyDSU(dsu);
            return dsu;
        }

        const loadDSU = async (keySSI) => {
            const load = util.promisify(resolver.loadDSU);
            const dsu = await load(keySSI);
            promisifyDSU(dsu);
            return dsu;
        };

        let dsu;
        let dsuKeySSI;

        tir.launchVirtualMQNode(10, testFolder, async (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            dsu = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
            dsu.enableAnchoringNotifications(true);
            dsuKeySSI = await dsu.getKeySSIAsString();

            console.log('------------------');
            console.log('Running tests...');
            await runTests();
            callback();
        });

        const runTests = async () => {
            await testSubscriberAutoUpdatesOnNewFile();
            await testMultipleSubscribersAutoUpdateOnNewFile();
            await testSubscriberAutoUpdatesOnMultipleChanges();
            await testSubscriberCanMakeChangesAfterAutoUpdate();
            await testSubscriberAutoUpdatesInBatchMode();
            //await testMultipleSubscribersAutoUpdatesInBatchMode();
        }

        const testSubscriberAutoUpdatesOnNewFile = async () => {
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);
            subscriberDSU.enableAutoSync(true);

            // Write the file in the main dsu
            await dsu.writeFile('first-file.txt', 'first-file.txt');
            await delay(200) // wait a bit
            subscriberDSU.enableAutoSync(false);

            // Check that the subscribed DSU merged the latest changes
            const files = await subscriberDSU.listFiles('/');
            const newFileExists = files.indexOf('first-file.txt') !== -1;
            const expectedFileContent = 'first-file.txt';
            const actualFileContent = await subscriberDSU.readFile('/first-file.txt');

            assert.true(newFileExists, "Subscriber received the new file");
            assert.true(expectedFileContent === actualFileContent.toString(), 'Subscriber got the corret file');
        }

        const testMultipleSubscribersAutoUpdateOnNewFile = async () => {
            resolver.invalidateDSUCache(dsuKeySSI);
            const sub1DSU = await loadDSU(dsuKeySSI);
            sub1DSU.enableAutoSync(true);

            resolver.invalidateDSUCache(dsuKeySSI);
            const sub2DSU = await loadDSU(dsuKeySSI);
            sub2DSU.enableAutoSync(true);

            // Write the file in the main dsu
            await dsu.writeFile('file-for-multiple-subscribers.txt', 'file-for-multiple-subscribers.txt');
            await delay(200) // wait a bit
            sub1DSU.enableAutoSync(false);
            sub2DSU.enableAutoSync(false);

            // Check that the subscribers merged the latest changes
            const sub1Files = await sub1DSU.listFiles('/');
            const sub1FileExists = sub1Files.indexOf('file-for-multiple-subscribers.txt') !== -1;

            const sub2Files = await sub2DSU.listFiles('/');
            const sub2FileExists = sub2Files.indexOf('file-for-multiple-subscribers.txt') !== -1;

            assert.true(sub1FileExists, "Subscriber 1 received the new file");
            assert.true(sub2FileExists, "Subscriber 2 received the new file");
        }

        const testSubscriberAutoUpdatesOnMultipleChanges = async () => {
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);
            subscriberDSU.enableAutoSync(true);

            // Make changes on the main dsu
            await dsu.writeFile('file-for-subscriber.txt', 'file-for-subscriber.txt');
            await dsu.delete('/first-file.txt');
            await dsu.rename('/file-for-multiple-subscribers.txt', '/folder/renamed-file.txt');
            await dsu.createFolder('/folder/sub-folder');
            await dsu.writeFile('/folder/sub-folder/nested-file.txt', 'nested-file.txt');

            await delay(250) // wait a bit
            subscriberDSU.enableAutoSync(false);

            const actualFiles = await subscriberDSU.listFiles('/');
            actualFiles.sort();

            const expectedFiles = [
                'dsu-metadata-log',
                'file-for-subscriber.txt',
                'folder/renamed-file.txt',
                'folder/sub-folder/nested-file.txt'
            ]

            assert.true(actualFiles.length === expectedFiles.length, 'Subscriber has the correct number of files');
            assert.true(JSON.stringify(expectedFiles) === JSON.stringify(actualFiles), 'Subscriuber has the correct files');
        }

        const testSubscriberCanMakeChangesAfterAutoUpdate = async () => {
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);

            let syncListenerCalled = false;
            subscriberDSU.enableAutoSync(true, {
                onError: (err) => {
                    throw err;
                },
                onSync: () => {
                    syncListenerCalled = true;
                }
            });

            // Make changes on the main dsu
            await dsu.appendToFile('file-for-subscriber.txt', ' New changes');
            await dsu.writeFile('file-to-be-deleted-by-subscriber.txt', 'Lorem ipsum');

            await delay(250) // wait a bit
            subscriberDSU.enableAutoSync(false);

            const content = await subscriberDSU.readFile('file-for-subscriber.txt');
            let newFileWasDeleted = false;

            try {
                await subscriberDSU.delete('file-to-be-deleted-by-subscriber.txt');
                newFileWasDeleted = true;
            } catch (e) {}

            await dsu.refresh();

            assert.true(syncListenerCalled, "The sync event listener was called");
            assert.true(newFileWasDeleted, "Subscriber deleted the newly received file");
            assert.true(content.toString() === 'file-for-subscriber.txt New changes', 'Subscriber received file updates');
        }

        const testSubscriberAutoUpdatesInBatchMode = async () => {
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);

            let syncListenerCalled = false;
            subscriberDSU.enableAutoSync(true, {
                onError: (err) => {
                    throw err;
                },
                onSync: () => {
                    syncListenerCalled = true;
                }
            });

            // Write some data in batch mode for the subscriberDSU
            subscriberDSU.beginBatch();
            await subscriberDSU.writeFile('batch-folder/sub-folder/subscriber-file.txt', 'subscriber-file.txt');

            // Write batch data in main dsu
            dsu.beginBatch();
            await dsu.writeFile('batch-folder/test.txt', 'test.txt');
            await dsu.writeFile('batch-folder/sub-folder/test.txt', 'test.txt');
            await dsu.delete('folder/sub-folder/nested-file.txt');
            await dsu.commitBatch();

            await delay(250) // wait a bit
            subscriberDSU.enableAutoSync(false);

            // TODO: Fix issue with dirty brickmap not being in sync
            console.log(await subscriberDSU.listFiles('/'));

            // Commit changes in subscriber
            await subscriberDSU.commitBatch();

            // We test that changes were merged
            const expectedFiles = [
                'batch-folder/sub-folder/subscriber-file.txt',
                'batch-folder/sub-folder/test.txt',
                'batch-folder/test.txt',
                'dsu-metadata-log',
                'file-for-subscriber.txt',
                'folder/renamed-file.txt'
            ];
            const actualFiles = await subscriberDSU.listFiles('/');
            actualFiles.sort();

            await dsu.refresh();
            assert.true(syncListenerCalled, "The sync event lister was called");
            assert.true(JSON.stringify(expectedFiles) === JSON.stringify(actualFiles), "Subscriber has the correct files");
        }

        const testMultipleSubscribersAutoUpdatesInBatchMode = async () => {
            resolver.invalidateDSUCache(dsuKeySSI);
            const sub1DSU = await loadDSU(dsuKeySSI);
            sub1DSU.enableAutoSync(true);

            resolver.invalidateDSUCache(dsuKeySSI);
            const sub2DSU = await loadDSU(dsuKeySSI);
            sub2DSU.enableAutoSync(true);

            sub1DSU.beginBatch();
            sub2DSU.beginBatch();

            await sub1DSU.writeFile('batch-folder/sub-folder/subscriber1-file.txt', 'subscriber1-file.txt');
            await sub2DSU.writeFile('batch-folder/sub-folder/subscriber2-file.txt', 'subscriber2-file.txt');

            // Write batch data in main dsu
            dsu.beginBatch();
            await dsu.writeFile('batch-folder/another-test.txt', 'another-test.txt');
            await dsu.writeFile('file-in-root.txt', 'file-in-root.txt');
            await dsu.commitBatch();

            await delay(250) // wait a bit
            sub1DSU.enableAutoSync(false);
            sub2DSU.enableAutoSync(false);


            // Commit changes in both subscribers
            await sub1DSU.commitBatch();
            console.log(await sub1DSU.listFiles('/'));
            //await sub2DSU.commitBatch();
        }

        const promisifyDSU = (...args) => {
            // Methods to promisify
            const methodsToPromisify = [
                'refresh',
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

        const delay = (delay) => {
            return new Promise((resolve) => {
                setTimeout(resolve, delay);
            });
        }
    }, 36000);
});
