/**
 * Build test
 */
"use strict";

const fs = require('fs');

module.exports = (Helper, codeDir, testFile, TestHelper) => {
    let code = fs.readFileSync(testFile, 'utf8'),
        modules = [
            TestHelper.fakeEvents() +
            TestHelper.fakeInit() +
            TestHelper.getStorage() +
            fs.readFileSync(codeDir + '/browser/storage.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/defaults.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/with-cdn/defaults.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/config.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/image.js', 'utf8'),

            // Temporary functions
            'SimpleSVG.testLoaderURL = function() { return true; };' +
            'SimpleSVG.secureURL = function(url) { return url; };' +

            // Replace content of addScript()
            fs.readFileSync(codeDir + '/browser/with-cdn/loader.js', 'utf8').replace('// Create script', 'if (!SimpleSVG.testLoaderURL(url)) return;')
        ];

    // Replace code
    modules = modules.join('');

    // Merge modules and test
    code = code.replace('/* Modules() */', modules);

    return code;
};
