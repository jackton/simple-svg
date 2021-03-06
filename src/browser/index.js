/**
 * This file is part of the simple-svg package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the license.txt
 * file that was distributed with this source code.
 * @license MIT
 */

/**
 * Main file
 */
(function(SimpleSVG, local) {
    "use strict";

    var useHTTPS = false;

    /*
    // Disabled because SSL adds 50-100ms to loading time. Uncomment to enable forced SSL in modern browsers.
    try {
        useHTTPS = (window && window.CSS && window.CSS.supports);
    } catch (err) {
    }
    */

    /**
     * Find new icons and change them
     */
    function findNewIcons() {
        var paused = false;

        if (!SimpleSVG.isReady) {
            return;
        }

        local.findNewImages().forEach(function(image) {
            if (local.loadImage(image)) {
                if (!paused) {
                    paused = true;
                    SimpleSVG.pauseObserving();
                }

                local.renderSVG(image);
            }
        });

        if (paused) {
            SimpleSVG.resumeObserving();
        }
    }

    /**
     * Callback when DOM was changed
     */
    function scanDOM() {
        if (!SimpleSVG.isReady) {
            return;
        }

        // Find new icons
        findNewIcons();
    }

    /**
     * Set local functions
     */
    local.iconsAdded = findNewIcons;
    local.nodesAdded = scanDOM;

    /**
     * Scan DOM when script is ready
     */
    local.initQueue.push(scanDOM);

    /**
     * Export function to scan DOM
     */
    SimpleSVG.scanDOM = scanDOM;

    /**
     * Change protocol-less URL to secure URL if browser supports it
     *
     * @param {string} url
     * @return {string}
     */
    SimpleSVG.secureURL = function(url) {
        return (useHTTPS && url.slice(0, 2) === '//') ? 'https:' + url : url;
    };

    /**
     * Get version
     *
     * @return {string}
     */
    SimpleSVG.getVersion = function() {
        return local.version;
    };

})(SimpleSVG, local);
