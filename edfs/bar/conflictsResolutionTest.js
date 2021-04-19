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
            //await testConflictsWhenWorkingWithMountedDSU();
        };

        const testOvewriteFileConflict = async () => {
            const [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);
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
             *      '/m3.txt': {
             *          error: 'LOCAL_OVERWRITE',
             *          message: 'Path /m3.txt will overwrite a previously anchored file or directory',
             *          remoteHashLinks: [ HashLinkSSI, ... ]
             *      }
             *  }
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError['/m3.txt'] !== 'undefined');
            assert.true(conflictsError['/m3.txt'].error === 'LOCAL_OVERWRITE');
            assert.true(Array.isArray(conflictsError['/m3.txt'].remoteHashLinks) && conflictsError['/m3.txt'].remoteHashLinks.length > 0);
        };

        const testNewlyAddedFilesAreMerged = async () => {
            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);
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
            ];
            let actualFiles = await user1DSU.listFiles('/');
            assert.true(actualFiles.length === expectedFiles.length, 'user1DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user1DSU should have the correct files');

            // Check User2 file list. We're checking for the 'm4.txt' file to be present
            actualFiles = await user2DSU.listFiles('/');
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
            ];
            assert.true(actualFiles.length === expectedFiles.length, 'user2DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user2DSU should have the correct files');
        };

        const testRemoteDeleteConflict  = async () => {
            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);

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
             *      }
             *  }
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError['/m5.txt'] !== 'undefined');
            assert.true(conflictsError['/m5.txt'].error === 'REMOTE_DELETE');
        }

        const testOvewriteFileConflictWhenRenamingFile  = async () => {
            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);

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
             *          remoteHashLinks: [ HashLinkSSI, ... ]
             *      }
             *  }
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError['/m6.txt'] !== 'undefined');
            assert.true(conflictsError['/m6.txt'].error === 'LOCAL_OVERWRITE');
            assert.true(Array.isArray(conflictsError['/m6.txt'].remoteHashLinks) && conflictsError['/m6.txt'].remoteHashLinks.length > 0);
        }

        const testDeleteFileConflict = async () => {
            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);

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
             *      }
             *  }
             */

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError['/m6.txt'] !== 'undefined');
            assert.true(conflictsError['/m6.txt'].error === 'LOCAL_DELETE');
        }

        /**
         * @TODO: conflict detection when user1 mounts dsu in /path, and second user tries to write in /path
         */
        const testChangesAreMergedWhenWorkingWithMountedDSU = async () => {
            await mainDSU.mount('/second-dsu', secondaryDSUKeySSI);

            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);

            await user1DSU.beginBatch();
            await user1DSU.writeFile('m6.txt', 'New file added to main DSU');
            await user1DSU.delete('second-dsu/s2.txt');
            await user1DSU.commitBatch();

            resolver.invalidateDSUCache(secondaryDSUKeySSI);

            await user2DSU.beginBatch();
            await user2DSU.writeFile('m7.txt', 'm7.txt content');
            await user2DSU.delete('second-dsu/sfolder/sf2.txt');
            await user2DSU.writeFile('second-dsu/sfolder/sf3.txt', 'New file added to seconday DSU');
            await user2DSU.commitBatch();

            // Reload DSUs
            [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);

            let expectedFiles =[
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
                'second-dsu/sfolder/sf3.txt'
            ];
            let actualFiles = await user1DSU.listFiles('/');
            assert.true(actualFiles.length === expectedFiles.length, 'user1DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user1DSU should have the correct files');

            actualFiles = await user2DSU.listFiles('/');
            assert.true(actualFiles.length === expectedFiles.length, 'user2DSU should have the correct number of files');
            assert.true(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), 'user2DSU should have the correct files');
        }

        /**
         * @TODO: broken
         * Should find a way to disable caching when testing this
         */
        const testConflictsWhenWorkingWithMountedDSU = async () => {
            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);

            await user1DSU.listFiles('/');
            await user2DSU.listFiles('/');

            await user1DSU.beginBatch();
            await user1DSU.delete('m6.txt');
            await user1DSU.delete('second-dsu/sfolder/sf3.txt');
            await user1DSU.writeFile('second-dsu/sfolder/sf4.txt', 'New file added to secondary DSU');
            await user1DSU.commitBatch();

            await user2DSU.beginBatch();
            await user2DSU.rename('m6.txt', 'm66.txt');
            await user2DSU.delete('second-dsu/sfolder/sf3.txt');
            await user2DSU.writeFile('second-dsu/sfolder/sf4.txt', 'New file added to secondary DSU');

            let conflictsError;
            try {
                await user2DSU.commitBatch();
            } catch (e) {
                conflictsError = e.previousError.conflicts;
                console.error(e)
            }
            console.log(conflictsError)
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
         * Simulate two distinct users loading the same DSU
         */
        const loadDSUAs2Users = async (keySSI) => {
            resolver.invalidateDSUCache(keySSI);
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            resolver.invalidateDSUCache(thirdDSUKeySSI);
            const user1DSU = await loadDSU(keySSI);
            resolver.invalidateDSUCache(keySSI);
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            resolver.invalidateDSUCache(thirdDSUKeySSI);
            const user2DSU = await loadDSU(keySSI);
            promisifyDSU(user1DSU, user2DSU);

            return [user1DSU, user2DSU];
        }

    }, 20000);
});


