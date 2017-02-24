/**
 * Build test
 */
"use strict";

const fs = require('fs');

module.exports = (Helper, codeDir, testFile) => {
    let code = fs.readFileSync(testFile, 'utf8'),
        modules = [
            fs.readFileSync(codeDir + '/browser/defaults.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/config.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/image.js', 'utf8'),
            fs.readFileSync(codeDir + '/browser/finder.js', 'utf8')
        ];

    // Replace code
    modules = modules.map(item => item.replace('self.SimpleSVG', 'SimpleSVG')).join('');

    // Merge modules and test
    code = code.replace('/* Modules() */', modules);

    return code;
};