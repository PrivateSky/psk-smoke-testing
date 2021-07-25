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

        let dsu;
        let dsuKeySSI;

        let dsuWithMountPoints;
        let dsuWithMountPointsKeySSI;
        const mountedDSUsKeys = {
            level1: null,
            level2: null
        };

        tir.launchVirtualMQNode(10, testFolder, async (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            dsu = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
            await dsu.enableAnchoringNotifications(true);
            dsuKeySSI = await dsu.getKeySSIAsString();

            dsuWithMountPoints = await createDSUWithMountPoints(keySSISpace.createTemplateSeedSSI('default'));
            await dsuWithMountPoints.enableAnchoringNotifications(true, { ignoreMounts: false });
            dsuWithMountPointsKeySSI = await dsuWithMountPoints.getKeySSIAsString();

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
            await testMultipleSubscribersAutoUpdatesInBatchMode();
            await testMergeConflictOccurs();
            await testMergeConflictHandlerIsCalled();
            await testSubscriberWithMountedPathsAutoUpdates();
            await testSubscriberWithMountedPathsAutoUpdatesInBatchMode();
        }

        const testSubscriberAutoUpdatesOnNewFile = async () => {
            console.log('Test subscriber auto update on new file');
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);
            await subscriberDSU.enableAutoSync(true);

            // Write the file in the main dsu
            await dsu.writeFile('first-file.txt', 'first-file.txt');
            await delay(200) // wait a bit
            await subscriberDSU.enableAutoSync(false);

            // Check that the subscribed DSU merged the latest changes
            const files = await subscriberDSU.listFiles('/');
            const newFileExists = files.indexOf('first-file.txt') !== -1;
            const expectedFileContent = 'first-file.txt';
            const actualFileContent = await subscriberDSU.readFile('/first-file.txt');

            assert.true(newFileExists, "Subscriber received the new file");
            assert.true(expectedFileContent === actualFileContent.toString(), 'Subscriber got the corret file');
        }

        const testMultipleSubscribersAutoUpdateOnNewFile = async () => {
            console.log('Test multiple subscribers auto update on new file');
            resolver.invalidateDSUCache(dsuKeySSI);
            const sub1DSU = await loadDSU(dsuKeySSI);
            await sub1DSU.enableAutoSync(true);

            resolver.invalidateDSUCache(dsuKeySSI);
            const sub2DSU = await loadDSU(dsuKeySSI);
            await sub2DSU.enableAutoSync(true);

            // Write the file in the main dsu
            await dsu.writeFile('file-for-multiple-subscribers.txt', 'file-for-multiple-subscribers.txt');
            await delay(200) // wait a bit
            await sub1DSU.enableAutoSync(false);
            await sub2DSU.enableAutoSync(false);

            // Check that the subscribers merged the latest changes
            const sub1Files = await sub1DSU.listFiles('/');
            const sub1FileExists = sub1Files.indexOf('file-for-multiple-subscribers.txt') !== -1;

            const sub2Files = await sub2DSU.listFiles('/');
            const sub2FileExists = sub2Files.indexOf('file-for-multiple-subscribers.txt') !== -1;

            assert.true(sub1FileExists, "Subscriber 1 received the new file");
            assert.true(sub2FileExists, "Subscriber 2 received the new file");
        }

        const testSubscriberAutoUpdatesOnMultipleChanges = async () => {
            console.log('Test subscriber auto updates on multiple changes');
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);
            await subscriberDSU.enableAutoSync(true);

            // Make changes on the main dsu
            await dsu.writeFile('file-for-subscriber.txt', 'file-for-subscriber.txt');
            await dsu.delete('/first-file.txt');
            await dsu.rename('/file-for-multiple-subscribers.txt', '/folder/renamed-file.txt');
            await dsu.createFolder('/folder/sub-folder');
            await dsu.writeFile('/folder/sub-folder/nested-file.txt', 'nested-file.txt');

            await delay(250) // wait a bit
            await subscriberDSU.enableAutoSync(false);

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
            console.log('Test that subscriber can make changes after auto update');
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);

            let syncListenerCalled = false;
            await subscriberDSU.enableAutoSync(true, {
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
            await subscriberDSU.enableAutoSync(false);

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
            console.log('Test that subscriber auto updates when in batch mode');
            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);

            let syncListenerCalled = false;
            await subscriberDSU.enableAutoSync(true, {
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
            await subscriberDSU.enableAutoSync(false);

            const actualFilesBeforeCommiting = await subscriberDSU.listFiles('/');
            actualFilesBeforeCommiting.sort();

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
            assert.true(JSON.stringify(expectedFiles) === JSON.stringify(actualFilesBeforeCommiting), "Subscriber has the correct files before commiting");
            assert.true(JSON.stringify(expectedFiles) === JSON.stringify(actualFiles), "Subscriber has the correct files after commiting");
        }

        const testMultipleSubscribersAutoUpdatesInBatchMode = async () => {
            console.log('Test that multiple subscribers auto update when in batch mode');
            resolver.invalidateDSUCache(dsuKeySSI);
            const sub1DSU = await loadDSU(dsuKeySSI);
            await sub1DSU.enableAutoSync(true);

            resolver.invalidateDSUCache(dsuKeySSI);
            const sub2DSU = await loadDSU(dsuKeySSI);
            await sub2DSU.enableAutoSync(true);

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
            await sub1DSU.enableAutoSync(false);
            await sub2DSU.enableAutoSync(false);

            const sub1ActualFilesBeforeCommit = await sub1DSU.listFiles('/');
            sub1ActualFilesBeforeCommit.sort();
            const sub2ActualFilesBeforeCommit = await sub2DSU.listFiles('/');
            sub2ActualFilesBeforeCommit.sort();

            // Commit changes in both subscribers
            await sub1DSU.commitBatch();
            await sub2DSU.commitBatch();
            await dsu.refresh();

            const sub1ActualFiles = await sub1DSU.listFiles('/');
            sub1ActualFiles.sort();

            let sub2ActualFiles = await sub2DSU.listFiles('/');
            sub2ActualFiles.sort();

            // Test that before commiting, Sub1 has the new changes merged with his
            assert.true(sub1ActualFilesBeforeCommit.indexOf('batch-folder/another-test.txt') !== -1, 'Sub1 received main dsu changes');
            assert.true(sub1ActualFilesBeforeCommit.indexOf('file-in-root.txt') !== -1, 'Sub1 received main dsu changes');
            assert.true(sub1ActualFilesBeforeCommit.indexOf('batch-folder/sub-folder/subscriber1-file.txt') !== -1, 'Sub1 received main dsu changes');

            // Test that before commiting, Sub2 has the new changes merged with his
            assert.true(sub2ActualFilesBeforeCommit.indexOf('batch-folder/another-test.txt') !== -1, 'Sub2 received main dsu changes');
            assert.true(sub2ActualFilesBeforeCommit.indexOf('file-in-root.txt') !== -1, 'Sub2 received main dsu changes');
            assert.true(sub2ActualFilesBeforeCommit.indexOf('batch-folder/sub-folder/subscriber2-file.txt') !== -1, 'Sub2 received main dsu changes');

            assert.true(JSON.stringify(sub1ActualFilesBeforeCommit) === JSON.stringify(sub1ActualFiles), 'Sub1 has the correct files');
            assert.true(sub2ActualFiles.indexOf('batch-folder/sub-folder/subscriber1-file.txt') !== -1, 'Sub2 has the file from sub1 after anchoring')
            assert.true(sub2ActualFiles.indexOf('batch-folder/sub-folder/subscriber2-file.txt') !== -1, 'Sub2 has the correct files');
        }

        const testMergeConflictOccurs = async () => {
            console.log("Test that a merge conflicts occurs");

            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);

            let errorHandlerCalled = false;
            let conflicts;
            let syncHandlerCalled = false;
            await subscriberDSU.enableAutoSync(true, {
                onError: (err) => {
                    errorHandlerCalled = true;
                    if (err.previousError && err.previousError.conflicts) {
                        conflicts = err.previousError.conflicts;
                    }
                },
                onSync: () => {
                    syncHandlerCalled = true;
                }
            });

            // Rename a file in batch mode
            await subscriberDSU.beginBatch();
            await subscriberDSU.rename('/file-for-subscriber.txt', '/renamed-file.txt');

            // Delete the file in the publishing DSU
            await dsu.delete('/file-for-subscriber.txt');
            await delay(250) // wait a bit
            await subscriberDSU.enableAutoSync(false);

            // At this point the subscriber should have tried to merge the "delete" operation and
            // should have failed
            assert.false(syncHandlerCalled, "The sync event handler shouldn't have been called");
            assert.true(errorHandlerCalled, "The error handler has been called");
            assert.true(typeof conflicts.files !== 'undefined', "The error contains conflict details");
            assert.true(typeof conflicts.files['/file-for-subscriber.txt'] === 'object', "The file in conflict has been correctly identified");
            assert.true(conflicts.files['/file-for-subscriber.txt'].error === 'REMOTE_DELETE', "The correct conflict type has been identified");
        }

        const testMergeConflictHandlerIsCalled = async () => {
            console.log("Test that the merge conflict handler is called");

            resolver.invalidateDSUCache(dsuKeySSI);
            const subscriberDSU = await loadDSU(dsuKeySSI);

            let conflicts;
            let errorHandlerCalled = false;
            let syncHandlerCalled = false;
            let syncStatus;

            // The merge conflict handler will receive the "conflicts" object
            // and a callback
            subscriberDSU.setMergeConflictsHandler((_conflicts, callback) => {
                conflicts = _conflicts;
                callback();
            });

            await subscriberDSU.enableAutoSync(true, {
                onError: () => {
                    errorHandlerCalled = true;
                },
                onSync: (status) => {
                    syncHandlerCalled = true;
                    syncStatus = status;
                }
            });


            // Rename a file in batch mode
            await subscriberDSU.beginBatch();
            await subscriberDSU.rename('/file-in-root.txt', '/renamed-root-file.txt');

            // Delete the file in the publishing DSU
            await dsu.delete('/file-in-root.txt');
            await delay(250) // wait a bit
            await subscriberDSU.enableAutoSync(false);

            // At this point the subscriber should have tried to merge the "delete" operation and
            // should have failed
            assert.true(syncHandlerCalled, "The sync event handler has been called");
            assert.false(syncStatus, "The merge was unsuccessful");
            assert.false(errorHandlerCalled, "The error handler shouldn't have been called");
            assert.true(typeof conflicts.files !== 'undefined', "The error contains conflict details");
            assert.true(typeof conflicts.files['/file-in-root.txt'] === 'object', "The file in conflict has been correctly identified");
            assert.true(conflicts.files['/file-in-root.txt'].error === 'REMOTE_DELETE', "The correct conflict type has been identified");
        }

        const testSubscriberWithMountedPathsAutoUpdates = async () => {
            console.log("Test that mounted DSU in subscriber auto updates on new changes");
            resolver.invalidateDSUCache(dsuWithMountPointsKeySSI);
            resolver.invalidateDSUCache(mountedDSUsKeys.level1);
            resolver.invalidateDSUCache(mountedDSUsKeys.level2);
            const subscriberDSU = await loadDSU(dsuWithMountPointsKeySSI);

            let syncHandlerCallCounter = 0;
            let errorHandlerCalled = false;
            await subscriberDSU.enableAutoSync(true, {
                ignoreMounts: false,
                onError: (err) => {
                    errorHandlerCalled = true;
                },
                onSync: () => {
                    syncHandlerCallCounter++;
                }
            })

            // Cache invalidation is required, or else the next writes
            // will take place in the cached archives, and the sync handler won't be called
            // since the DSUs will already be up to date
            resolver.invalidateDSUCache(mountedDSUsKeys.level1);
            resolver.invalidateDSUCache(mountedDSUsKeys.level2);

            // Write files in each mounted dsu
            await dsuWithMountPoints.writeFile('/level1/level2/level2-file-for-subscriber.txt', 'level2-file-for-subscriber.txt');
            await dsuWithMountPoints.writeFile('/level1/level1-file-for-subscriber.txt', 'level1-file-for-subscriber.txt');
            await dsuWithMountPoints.writeFile('/level0-file-for-subscriber.txt', 'level0-file-for-subscriber.txt');
            await delay(200) // wait a bit
            await subscriberDSU.enableAutoSync(false);

            const expectedFiles = await dsuWithMountPoints.listFiles('/');
            expectedFiles.sort();

            const actualFiles = await subscriberDSU.listFiles('/');
            actualFiles.sort();

            assert.false(errorHandlerCalled, "No error occured while syncing");
            assert.true(syncHandlerCallCounter === 3, "The sync handler was called for each mounted DSU");
            assert.true(JSON.stringify(expectedFiles) === JSON.stringify(actualFiles), 'Subscribed DSU should have the same files');
            assert.true(actualFiles.indexOf('level1/level2/level2-file-for-subscriber.txt') !== -1, "Level2 file exists")
            assert.true(actualFiles.indexOf('level1/level1-file-for-subscriber.txt') !== -1, "Level1 file exists")
            assert.true(actualFiles.indexOf('level0-file-for-subscriber.txt') !== -0, "Level0 file exists")
        }

        const testSubscriberWithMountedPathsAutoUpdatesInBatchMode = async () => {
            console.log("Test that mounted DSU in subscriber auto updates on new changes in batch mode");
            resolver.invalidateDSUCache(dsuWithMountPointsKeySSI);
            resolver.invalidateDSUCache(mountedDSUsKeys.level1);
            resolver.invalidateDSUCache(mountedDSUsKeys.level2);
            const subscriberDSU = await loadDSU(dsuWithMountPointsKeySSI);

            let syncHandlerCallCounter = 0;
            let errorHandlerCalled = false;
            await subscriberDSU.enableAutoSync(true, {
                ignoreMounts: false,
                onError: () => {
                    errorHandlerCalled = true;
                },
                onSync: () => {
                    syncHandlerCallCounter++;
                }
            })
            await subscriberDSU.beginBatch();
            await subscriberDSU.writeFile('/file-in-batch-mode.txt', 'file-in-batch-mode.txt');

            await dsuWithMountPoints.beginBatch();

            // Cache invalidation is required, or else the next writes
            // will take place in the cached archives, and the sync handler won't be called
            // since the DSUs will already be up to date
            resolver.invalidateDSUCache(mountedDSUsKeys.level1);
            resolver.invalidateDSUCache(mountedDSUsKeys.level2);
            // Write files in each mounted dsu
            await dsuWithMountPoints.writeFile('/level1/level2/level2-file-in-batch-mode.txt', 'level2-file-in-batch-mode.txt');
            await dsuWithMountPoints.writeFile('/level1/level1-file-in-batch-mode.txt', 'level1-file-in-batch-mode.txt');
            await dsuWithMountPoints.writeFile('/level0-file-in-batch-mode.txt', 'level0-file-in-batch-mode.txt');

            // Cache invalidation is required, or else the next writes
            // will take place in the cached archives, and the sync handler won't be called
            // since the DSUs will already be up to date
            resolver.invalidateDSUCache(mountedDSUsKeys.level1);
            resolver.invalidateDSUCache(mountedDSUsKeys.level2);

            await dsuWithMountPoints.commitBatch();
            await delay(200) // wait a bit

            await subscriberDSU.enableAutoSync(false);
            await subscriberDSU.commitBatch();
            await dsuWithMountPoints.refresh();

            const expectedFiles = await dsuWithMountPoints.listFiles('/');
            expectedFiles.sort();

            const actualFiles = await subscriberDSU.listFiles('/');
            actualFiles.sort();

            assert.false(errorHandlerCalled, "No error occured while syncing");
            assert.true(syncHandlerCallCounter === 3, "The sync handler was called for each mounted DSU");
            assert.true(JSON.stringify(expectedFiles) === JSON.stringify(actualFiles), 'Subscribed DSU should have the same files');
            assert.true(actualFiles.indexOf('level1/level2/level2-file-in-batch-mode.txt') !== -1, "Level2 file exists")
            assert.true(actualFiles.indexOf('level1/level1-file-in-batch-mode.txt') !== -1, "Level1 file exists")
            assert.true(actualFiles.indexOf('level0-file-in-batch-mode.txt') !== -0, "Level0 file exists")

        }

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

        const createDSUWithMountPoints = async (keySSI) => {
            const dsuLevel0 = await createDSU(keySSI);
            const dsuLevel1 = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
            const dsuLevel2 = await createDSU(keySSISpace.createTemplateSeedSSI('default'));

            await dsuLevel2.writeFile('/level2-file.txt', 'level2-file.txt');

            await dsuLevel1.writeFile('/level1-file.txt', 'level1-file.txt');

            const level2Key = await dsuLevel2.getKeySSIAsString();
            await dsuLevel1.mount('/level2', level2Key);

            await dsuLevel0.writeFile('/level0-file.txt', 'level0-file.txt');

            const level1Key = await dsuLevel1.getKeySSIAsString();
            await dsuLevel0.mount('/level1', level1Key);

            mountedDSUsKeys.level1 = level1Key;
            mountedDSUsKeys.level2 = level2Key;

            return dsuLevel0;
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
                'enableAutoSync',
                'enableAnchoringNotifications',
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
    }, 10000);
});
