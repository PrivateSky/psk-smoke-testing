const util = require('util');
require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskWebServer");

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");

double_check.createTestFolder("conflictsresolution_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";

    assert.callback("ConflictsResolutionTest", (callback) => {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        const createDSU = util.promisify(resolver.createDSU);
        const loadDSU = util.promisify(resolver.loadDSU);

        let mainDSU;
        let secondaryDSU;
        let thirdDSU;

        let mainDSUKeySSI;
        let secondaryDSUKeySSI;
        let thirdDSUKeySSI;

        // Bootstrap test
        tir.launchVirtualMQNode(10, testFolder, async (err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            // Create DSUs
            try {
                mainDSU = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
                secondaryDSU = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
                thirdDSU = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
            } catch (e) {
                throw e;
            }

            promisifyDSU(mainDSU, secondaryDSU, thirdDSU);

            console.log('Creating content for mainDSU');
            console.log('------------------');
            await createDSUContent(mainDSU, {
                'm1.txt': 'file contents',
                'm2.txt': 'file contents',
                'mfolder': {
                    'mf1.txt': 'file contents',
                    'mf2.txt': 'file contents',
                    'msub-folder': {
                        'msf1.txt': 'file contents',
                        'msf2.txt': 'file contents'
                    }
                }
            });

            console.log('Creating content for secondaryDSU');
            console.log('------------------');
            await createDSUContent(secondaryDSU, {
                's1.txt': 'file contents',
                's2.txt': 'file contents',
                'sfolder': {
                    'sf1.txt': 'file contents',
                    'sf2.txt': 'file contents',
                    'ssub-folder': {
                        'ssf1.txt': 'file contents',
                        'ssf2.txt': 'file contents'
                    }
                }
            });

            console.log('Creating content for thirdDSU');
            console.log('------------------');
            await createDSUContent(thirdDSU, {
                't1.txt': 'file contents',
                't2.txt': 'file contents',
                'tfolder': {
                    'tf1.txt': 'file contents',
                    'tf2.txt': 'file contents',
                    'tsub-folder': {
                        'tsf1.txt': 'file contents',
                        'tsf2.txt': 'file contents'
                    }
                }
            });

            mainDSUKeySSI = await mainDSU.getKeySSIAsString();
            secondaryDSUKeySSI = await secondaryDSU.getKeySSIAsString();
            thirdDSUKeySSI = await thirdDSU.getKeySSIAsString();
            resolver.invalidateDSUCache(mainDSUKeySSI);
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            resolver.invalidateDSUCache(thirdDSUKeySSI);

            console.log('------------------');
            console.log('Running tests...');
            await runTests();

            callback();
        });

        const runTests = async () => {
            await testOvewriteFileConflict();
            await testNewlyAddedFilesAreMerged();
            await testRemoteDeleteConflict();
            await testOvewriteFileConflictWhenRenamingFile();
            await testDeleteFileConflict();
            await testChangesAreMergedWhenWorkingWithMountedDSU()
            await testRemoteDeleteConflictInMountedDSU()
            await testNonBatchAnchoringRaceIsSuccessful();
            await testBatchAnchoringRaceIsSuccessful();
            await testBatchOnConflictCallback();
        };

        /**
         * Test that overwriting a file which has been freshly anchored
         * results in a conflict error
         */
        const testOvewriteFileConflict = async () => {
            const [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);
            await user1DSU.writeFile('m3.txt', 'm3.txt - Wrote by first user');

            let conflictsError;
            try {
                // This should fail since it would overwrite the m3.txt
                await user2DSU.writeFile('m3.txt', 'm3.txt - Wrote by second user');
            } catch (e) {
                conflictsError = e.conflicts;
            }

            /*
             * conflictsError expected value:
             *  {
             *      files: {
             *          '/m3.txt': {
             *              error: 'LOCAL_OVERWRITE',
             *              message: 'Path /m3.txt will overwrite a previously anchored file or directory',
             *          },
             *      }
             *      theirHashLinkSSI: '...',
             *      ourHashLinkSSI: '...'
             *  }
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError.files['/m3.txt'] !== 'undefined');
            assert.true(conflictsError.files['/m3.txt'].error === 'LOCAL_OVERWRITE');
            assert.true(typeof conflictsError.theirHashLinkSSI === 'string' && conflictsError.theirHashLinkSSI.length > 0);
            assert.true(typeof conflictsError.ourHashLinkSSI === 'string' && conflictsError.ourHashLinkSSI.length > 0);
            assert.true(conflictsError.theirHashLinkSSI !== conflictsError.ourHashLinkSSI);
        };

        /**
         * Test that new files added to the same DSU
         * are merged with the recent anchoring result
         */
        const testNewlyAddedFilesAreMerged = async () => {
            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);
            await user1DSU.writeFile('m4.txt', 'm4.txt - Wrote by first user');

            // This should merge the m4.txt file from above
            await user2DSU.writeFile('m5.txt', 'm5.txt - Wrote by second user');

            // Check User1 file list
            let expectedFiles = [
                'dsu-metadata-log',
                'm1.txt',
                'm2.txt',
                'mfolder/mf1.txt',
                'mfolder/mf2.txt',
                'mfolder/msub-folder/msf1.txt',
                'mfolder/msub-folder/msf2.txt',
                'm3.txt',
                'm4.txt',
            ].sort();
            let actualFiles = (await user1DSU.listFiles('/')).sort();
            assert.true(actualFiles.length === expectedFiles.length, 'user1DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user1DSU should have the correct files');

            // Check User2 file list. We're checking for the 'm4.txt' file to be present
            actualFiles = (await user2DSU.listFiles('/')).sort();
            expectedFiles = [
                'dsu-metadata-log',
                'm1.txt',
                'm2.txt',
                'mfolder/mf1.txt',
                'mfolder/mf2.txt',
                'mfolder/msub-folder/msf1.txt',
                'mfolder/msub-folder/msf2.txt',
                'm3.txt',
                'm4.txt',
                'm5.txt',
            ].sort();
            assert.true(actualFiles.length === expectedFiles.length, 'user2DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user2DSU should have the correct files');
        };

        /**
         * Test that renaming a file which has been freshly deleted
         * results in a conflict error
         */
        const testRemoteDeleteConflict  = async () => {
            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            await user1DSU.delete('m5.txt');

            let conflictsError;
            try {
                // This should fail since the m5.txt file was just deleted
                await user2DSU.rename('m5.txt', 'm6.txt');
            } catch (e) {
                conflictsError = e.conflicts;
            }

            /*
             * conflictsError expected value:
             *  {
             *      '/m5.txt': {
             *          error: 'REMOTE_DELETE',
             *          message: 'Unable to copy /m5.txt to /m6.txt. Source was previously deleted'
             *          },
             *      }
             *      theirHashLinkSSI: '...',
             *      ourHashLinkSSI: '...'
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError.files['/m5.txt'] !== 'undefined');
            assert.true(conflictsError.files['/m5.txt'].error === 'REMOTE_DELETE');
            assert.true(typeof conflictsError.theirHashLinkSSI === 'string' && conflictsError.theirHashLinkSSI.length > 0);
            assert.true(typeof conflictsError.ourHashLinkSSI === 'string' && conflictsError.ourHashLinkSSI.length > 0);
            assert.true(conflictsError.theirHashLinkSSI !== conflictsError.ourHashLinkSSI);
        }

        /**
         * Test that renaming a file with the destination the same
         * as a freshly anchored file results in conflict error
         */
        const testOvewriteFileConflictWhenRenamingFile  = async () => {
            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            await user1DSU.writeFile('m6.txt', 'm6.txt content');

            let conflictsError;
            try {
                // This should fail since it would overwrite the m6.txt
                await user2DSU.rename('m3.txt', 'm6.txt');
            } catch (e) {
                conflictsError = e.conflicts;
            }

            /*
             * conflictsError expected value:
             *  {
             *      '/m6.txt': {
             *          error: 'LOCAL_OVERWRITE',
             *          message: 'Unable to copy /m3.txt to /m6.txt. The destination path will overwrite a previously anchored file or directory',
             *          },
             *      }
             *      theirHashLinkSSI: '...',
             *      ourHashLinkSSI: '...'
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError.files['/m6.txt'] !== 'undefined');
            assert.true(conflictsError.files['/m6.txt'].error === 'LOCAL_OVERWRITE');
            assert.true(typeof conflictsError.theirHashLinkSSI === 'string' && conflictsError.theirHashLinkSSI.length > 0);
            assert.true(typeof conflictsError.ourHashLinkSSI === 'string' && conflictsError.ourHashLinkSSI.length > 0);
            assert.true(conflictsError.theirHashLinkSSI !== conflictsError.ourHashLinkSSI);
        }

        /**
         * Test that deleting a freshly anchored file
         * results in conflict error
         */
        const testDeleteFileConflict = async () => {
            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            await user1DSU.writeFile('m6.txt', 'm6.txt file updated');

            let conflictsError;
            try {
                // This should fail since it would delete the newly updated m6.txt
                await user2DSU.delete('m6.txt');
            } catch (e) {
                conflictsError = e.conflicts;
            }

            /*
             * conflictsError expected value:
             *  {
             *      '/m6.txt': {
             *          error: 'LOCAL_DELETE',
             *          message: 'Unable to delete /m6.txt. This will delete a previously anchored file.',
             *          },
             *      }
             *      theirHashLinkSSI: '...',
             *      ourHashLinkSSI: '...'
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError.files['/m6.txt'] !== 'undefined');
            assert.true(conflictsError.files['/m6.txt'].error === 'LOCAL_DELETE');
            assert.true(typeof conflictsError.theirHashLinkSSI === 'string' && conflictsError.theirHashLinkSSI.length > 0);
            assert.true(typeof conflictsError.ourHashLinkSSI === 'string' && conflictsError.ourHashLinkSSI.length > 0);
            assert.true(conflictsError.theirHashLinkSSI !== conflictsError.ourHashLinkSSI);
        }

        /**
         * Test that no conflicts occur when woking on the same
         * DSU with other mounted DSUs
         */
        const testChangesAreMergedWhenWorkingWithMountedDSU = async () => {
            await mainDSU.mount('/second-dsu', secondaryDSUKeySSI);

            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            // Begin batches for both users
            await user1DSU.beginBatch();
            await user2DSU.beginBatch();

            // This causes the second DSU to be mounted for user1
            await user1DSU.listFiles('/');

            // Clear the DSU cache so that the second user will open another instance of
            // the second dsu
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            // This causes the second DSU to be mounted for user2
            await user2DSU.listFiles('/');

            // Batch operations for user 1
            await user1DSU.writeFile('m6.txt', 'New file added to main DSU');
            await user1DSU.writeFile('second-dsu/s20.txt', 'New file added to secondary DSU');
            await user1DSU.delete('second-dsu/s2.txt');

            // Batch operations for user 2
            await user2DSU.writeFile('m7.txt', 'm7.txt content');
            await user2DSU.delete('second-dsu/sfolder/sf2.txt');
            await user2DSU.writeFile('second-dsu/sfolder/sf3.txt', 'New file added to seconday DSU');

            // Commit both batches concurrently
            const commitPromise = Promise.all([
                // Delay the first commit by a few milliseconds
                new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            await user2DSU.commitBatch();
                        } catch (e) {
                            return reject(e);
                        }
                        resolve();
                    }, randomInt(10, 25));
                }),

                user1DSU.commitBatch()
            ]);
            await commitPromise;

            // Reload DSUs
            [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            let expectedFiles = [
                'dsu-metadata-log',
                'm1.txt',
                'm2.txt',
                'mfolder/mf1.txt',
                'mfolder/mf2.txt',
                'mfolder/msub-folder/msf1.txt',
                'mfolder/msub-folder/msf2.txt',
                'm3.txt',
                'm4.txt',
                'm6.txt',
                'manifest',
                'm7.txt',
                'second-dsu/dsu-metadata-log',
                'second-dsu/s1.txt',
                'second-dsu/sfolder/sf1.txt',
                'second-dsu/sfolder/ssub-folder/ssf1.txt',
                'second-dsu/sfolder/ssub-folder/ssf2.txt',
                'second-dsu/sfolder/sf3.txt',
                'second-dsu/s20.txt'
            ].sort();
            let actualFiles = (await user1DSU.listFiles('/')).sort();
            assert.true(actualFiles.length === expectedFiles.length, 'user1DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user1DSU should have the correct files');

            actualFiles = (await user2DSU.listFiles('/')).sort();
            assert.true(actualFiles.length === expectedFiles.length, 'user2DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user2DSU should have the correct files');
        }

        /**
         * Test that a conflict occurs when trying to rename
         * a previously deleted file in a mounted DSU
         */
        const testRemoteDeleteConflictInMountedDSU = async () => {
            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            // Begin batches for both users
            await user1DSU.beginBatch();
            await user2DSU.beginBatch();

            // This causes the second DSU to be mounted for user1
            await user1DSU.listFiles('/');

            // Clear the DSU cache so that the second user will open another instance of
            // the second dsu
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            // This causes the second DSU to be mounted for user2
            await user2DSU.listFiles('/');

            // Batch operations for user 1
            await user1DSU.delete('second-dsu/s20.txt');

            // Batch operations for user 2
            await user2DSU.rename('second-dsu/s20.txt', 'second-dsu/something-else.txt');
            await user2DSU.writeFile('second-dsu/sfolder/sf3.txt', 'New file added to seconday DSU');

            // Commit both batches concurrently
            const commitPromise = Promise.all([
                // Delay the first commit by a few milliseconds
                new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            await user2DSU.commitBatch();
                        } catch (e) {
                            return reject(e);
                        }
                        resolve();
                    }, randomInt(10, 25));
                }),

                user1DSU.commitBatch()
            ]);

            let conflictsError;
            try {
                await commitPromise;
            } catch (e) {
                conflictsError = e.previousError.previousError.previousError.conflicts;
            }

            /*
             * conflictsError expected value:
             *  {
             *      '/s30.txt': {
             *          error: 'REMOTE_DELETE',
             *          message: 'Unable to copy /s20.txt to /something-else.txt. Source was previously deleted',
             *          },
             *      }
             *      theirHashLinkSSI: '...',
             *      ourHashLinkSSI: '...'
             */
            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError.files['/s20.txt'] !== 'undefined');
            assert.true(conflictsError.files['/s20.txt'].error === 'REMOTE_DELETE');
            assert.true(typeof conflictsError.theirHashLinkSSI === 'string' && conflictsError.theirHashLinkSSI.length > 0);
            assert.true(typeof conflictsError.ourHashLinkSSI === 'string' && conflictsError.ourHashLinkSSI.length > 0);
            assert.true(conflictsError.theirHashLinkSSI !== conflictsError.ourHashLinkSSI);
        }

        /**
         * Fire multiple write operations concurrently
         * and test that no conflicts occur
         */
        const testNonBatchAnchoringRaceIsSuccessful = async () => {
            const usersCount = 5;
            const sameDSUInstances = await loadDSUAsMultipleUsers(mainDSUKeySSI, usersCount);

            const currentFiles = await sameDSUInstances[0].listFiles('/');

            const operations = [
                ['writeFile', 'non-batch-race%s.txt', 'non-batch-race%s.txt content'],
                ['writeFile', 'non-batch-race-to-be-deleted%s.txt', 'non-batch-race-to-be-deleted%s.txt content'],
                ['writeFile', 'non-batch-race-folder/%s.txt'],
                ['rename', 'non-batch-race%s.txt', 'renamed-non-batch-race%s.txt'],
                ['delete', 'non-batch-race-to-be-deleted%s.txt'],
            ]

            let anchorPromise = Promise.resolve();
            for (let i = 0; i < usersCount; i++) {
                const dsu = sameDSUInstances[i];

                for (let j = 0; j < operations.length; j++) {
                    const [method, ...args] = operations[j].map((item, index) => {
                        if (!index) {
                            return item;
                        }

                        return item.replace('%s', i + 1);
                    });
                    // There's a bug in the APIHub: The `anchorId` file is not locked for writing
                    // leading to overwrites, thus we need to simulate a delay between anchorings
                    // The test won't be as effective but it will still cover out of sync writes
                    anchorPromise = anchorPromise.then(() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(async () => {
                                try {
                                    await dsu[method](...args);
                                    resolve();
                                } catch (e) {
                                    reject(e);
                                }
                            }, randomInt(10, 50));
                        });
                    })
                }
            }

            await anchorPromise;

            // Reload DSU
            resolver.invalidateDSUCache(mainDSUKeySSI);
            const dsu = await loadDSU(mainDSUKeySSI);
            promisifyDSU(dsu);
            const files = await dsu.listFiles('/');

            // Run assertions
            const expectedFiles = currentFiles;
            for (let i = 1; i <= usersCount; i++) {
                expectedFiles.push(`non-batch-race-folder/${i}.txt`);
                expectedFiles.push(`renamed-non-batch-race${i}.txt`);
            }

            files.sort();
            expectedFiles.sort();
            assert.true(JSON.stringify(files) === JSON.stringify(expectedFiles), 'Non batch raced anchoring DSU should have the correct files');
        }

        const testBatchAnchoringRaceIsSuccessful = async () => {
            const usersCount = 5;
            const sameDSUInstances = await loadDSUAsMultipleUsers(mainDSUKeySSI, usersCount);

            const currentFiles = await sameDSUInstances[0].listFiles('/');

            const operations = [
                ['writeFile', 'batch-race%s.txt', 'batch-race%s.txt content'],
                ['writeFile', 'batch-race-to-be-deleted%s.txt', 'batch-race-to-be-deleted%s.txt content'],
                ['writeFile', 'batch-race-folder/%s.txt'],
                ['rename', 'batch-race%s.txt', 'renamed-batch-race%s.txt'],
                ['delete', 'batch-race-to-be-deleted%s.txt'],
            ];

            let anchorPromise = Promise.resolve();
            for (let i = 0; i < usersCount; i++) {
                const dsu = sameDSUInstances[i];
                anchorPromise = anchorPromise.then(() => {
                    return dsu.beginBatch();
                })

                for (let j = 0; j < operations.length; j++) {
                    const [method, ...args] = operations[j].map((item, index) => {
                        if (!index) {
                            return item;
                        }

                        return item.replace('%s', i + 1);
                    });

                    anchorPromise = anchorPromise.then(() => {
                        return dsu[method](...args);
                    });
                }
                // There's a bug in the APIHub: The `anchorId` file is not locked for writing
                // leading to overwrites, thus we need to simulate a delay between anchorings
                // The test won't be as effective but it will still cover out of sync writes
                anchorPromise = anchorPromise.then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(async () => {
                            try {
                                await dsu.commitBatch();
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }, randomInt(10, 50));
                    });
                })
            }

            await anchorPromise;

            // Reload DSU
            resolver.invalidateDSUCache(mainDSUKeySSI);
            const dsu = await loadDSU(mainDSUKeySSI);
            promisifyDSU(dsu);
            const files = await dsu.listFiles('/');

            // Run assertions
            const expectedFiles = currentFiles;
            for (let i = 1; i <= usersCount; i++) {
                expectedFiles.push(`batch-race-folder/${i}.txt`);
                expectedFiles.push(`renamed-batch-race${i}.txt`);
            }

            files.sort();
            expectedFiles.sort();
            assert.true(JSON.stringify(files) === JSON.stringify(expectedFiles), 'Batch raced anchoring DSU should have the correct files');
        }

        const testBatchOnConflictCallback = async () => {
            let [user1DSU, user2DSU] = await loadDSUAsMultipleUsers(mainDSUKeySSI);

            // Begin batches for both users
            await user1DSU.beginBatch();
            await user2DSU.beginBatch();

            // This causes the second DSU to be mounted for user1
            await user1DSU.listFiles('/');

            // Clear the DSU cache so that the second user will open another instance of
            // the second dsu
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            // This causes the second DSU to be mounted for user2
            await user2DSU.listFiles('/');

            // Batch operations for user 1
            await user1DSU.delete('second-dsu/sfolder/sf3.txt');

            // Batch operations for user 2
            await user2DSU.rename('second-dsu/sfolder/sf3.txt', 'second-dsu/sfolder/something-else.txt');
            await user2DSU.writeFile('second-dsu/sfolder/sf4.txt', 'New file added to seconday DSU');

            // Conflict resolution callback
            let conflictsError;
            const onConflict = (conflicts, callback) => {
                conflictsError = conflicts;
                callback();
            }

            // Commit both batches concurrently
            const commitPromise = Promise.all([
                // Delay the first commit by a few milliseconds
                new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            await user2DSU.commitBatch(onConflict);
                        } catch (e) {
                            return reject(e);
                        }
                        resolve();
                    }, randomInt(10, 25));
                }),

                user1DSU.commitBatch()
            ]);

            await commitPromise;

            /*
             * conflictsError expected value:
             *  {
             *      '/s30.txt': {
             *          error: 'REMOTE_DELETE',
             *          message: 'Unable to copy /sfolder/sf3.txt to /sfolder/something-else.txt. Source was previously deleted',
             *          },
             *      }
             *      theirHashLinkSSI: '...',
             *      ourHashLinkSSI: '...'
             */
            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError.files['/sfolder/sf3.txt'] !== 'undefined');
            assert.true(conflictsError.files['/sfolder/sf3.txt'].error === 'REMOTE_DELETE');
            assert.true(typeof conflictsError.theirHashLinkSSI === 'string' && conflictsError.theirHashLinkSSI.length > 0);
            assert.true(typeof conflictsError.ourHashLinkSSI === 'string' && conflictsError.ourHashLinkSSI.length > 0);
            assert.true(conflictsError.theirHashLinkSSI !== conflictsError.ourHashLinkSSI);
        }


        // Helper functions
        const createDSUContent = async (dsu, content, root = '/') => {
            if (root === '/') {
                await dsu.beginBatch();
            }

            for (let key in content) {
                const path = `${root}${key}`;
                console.log('Creating ' + path);

                if (typeof content[key] === 'object') {
                    await dsu.createFolder(path);
                    await createDSUContent(dsu, content[key], `${path}/`);
                    continue;
                }

                await dsu.writeFile(path, `${key} - ${content[key]}`);
            }

            if (root === '/') {
                await dsu.commitBatch();
            }
        }

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

        /**
         * Simulate distinct users loading the same DSU
         * @param {string} keySSI
         * @param {Number} usersNo
         * @return {Array<Archive>} Array of DSU instances
         */
        const loadDSUAsMultipleUsers = async (keySSI, usersNo = 2) => {
            resolver.invalidateDSUCache(keySSI);
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            resolver.invalidateDSUCache(thirdDSUKeySSI);

            const result = [];
            for (let i = 0; i < usersNo; i++) {
                const dsu = await loadDSU(keySSI);
                resolver.invalidateDSUCache(keySSI);
                resolver.invalidateDSUCache(secondaryDSUKeySSI);
                resolver.invalidateDSUCache(thirdDSUKeySSI);
                result.push(dsu);
            }
            promisifyDSU(...result);
            return result;
        }

        const randomInt = (min,max) => {
            return Math.floor(Math.random()*(max-min+1)+min);
        }

    }, 10 * 1000);
});


