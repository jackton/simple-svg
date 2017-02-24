/**
 * This file is part of the @cyberalien/simple-svg package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * This is not open source library.
 * This library can be used only with products available on artodia.com
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

var Storage = require('./storage');

/**
 * Regular expressions for calculating dimensions
 *
 * @type {RegExp}
 */
var unitsSplit = /(-?[0-9.]*[0-9]+[0-9.]*)/g,
    unitsTest = /^-?[0-9.]*[0-9]+[0-9.]*$/g;

/**
 * List of default attributes
 *
 * @type {[string]}
 */
var defaultAttributes = ['xmlns', 'xmlns:xlink', 'preserveAspectRatio', 'viewBox'];

/**
 * Unique id counter
 *
 * @type {number}
 */
var idCounter = 0;

/**
 * Calculate custom width or height
 *
 * @param {object} item Default item data
 * @param {object} data Custom properties
 * @param {string} prop1 Property to calculate (width or height)
 * @param {string} prop2 Second property
 * @return {string|number|null}
 */
function calculateCustomDimension(item, data, prop1, prop2) {
    // Custom value is set - return it
    if (data[prop1] !== void 0 && data[prop1] !== false) {
        return data[prop1];
    }

    // Both custom values aren't set or custom value matches default value - return default
    if (data[prop2] === void 0 || data[prop2] === false || data[prop2] === item[prop2]) {
        return item[prop1];
    }

    // One of custom values is set - calculate another value
    return calculateDimension(data[prop2], item[prop1] / item[prop2], data.precision);
}

/**
 * Calculate second dimension when only 1 dimension is set
 *
 * @param {string|number} size One dimension (such as width)
 * @param {number} ratio Width/height ratio.
 *      If size is width, ratio = height/width
 *      If size is height, ratio = width/height
 * @param {number} [precision] Floating number precision in result to minimize output. Default = 100
 * @return {string|number|null} Another dimension, null on error
 */
function calculateDimension(size, ratio, precision) {
    var split, number, results, code, isNumber, valid, num;

    if (ratio === 1) {
        return size;
    }

    precision = precision === void 0 ? 100 : precision;
    if (typeof size === 'number') {
        return Math.ceil(size * ratio * precision) / precision;
    }

    // split code into sets of strings and numbers
    split = size.split(unitsSplit);
    if (split === null || !split.length) {
        return null;
    }

    results = [];
    code = split.shift();
    isNumber = unitsTest.test(code);
    valid = false;

    while (true) {
        if (isNumber) {
            num = parseFloat(code);
            if (isNaN(num)) {
                return null;
            }
            valid = true;
            results.push(Math.ceil(num * ratio * precision) / precision);
        } else {
            results.push(code);
        }

        // next
        code = split.shift();
        if (code === void 0) {
            return valid ? results.join('') : null;
        }
        isNumber = !isNumber;
    }
}

/**
 * Get transformation string
 *
 * @param {object} attr Attributes
 * @return {string}
 */
function calculateTransformation(attr) {
    var rotate = attr.rotate;

    function rotation() {
        while (rotate < 1) {
            rotate += 4;
        }
        while (rotate > 4) {
            rotate -= 4;
        }
        return 'rotate(' + (rotate * 90) + 'deg)';
    }

    if (attr.vFlip && attr.hFlip) {
        rotate += 2;
        return rotation();
    }

    if (attr.vFlip || attr.hFlip) {
        return 'scale(' + (attr.hFlip ? '-' : '') + '1, ' + (attr.vFlip ? '-' : '') + '1)' + (rotate ? ' ' + rotation() : '');
    }
    return rotation();
}

function replaceIDs(body) {
    var regex = /\sid="(\S+)"/gi,
        ids = [],
        match;

    function strReplace(search, replace, subject) {
        var pos = 0;

        while ((pos = subject.indexOf(search, pos)) !== -1) {
            subject = subject.slice(0, pos) + replace + subject.slice(pos + search.length);
            pos += replace.length;
        }

        return subject;
    }

    // Find all IDs
    while (match = regex.exec(body)) {
        ids.push(match[1]);
    }
    if (!ids.length) {
        return body;
    }

    // Replace with unique ids
    ids.forEach(function(id) {
        var newID = 'SimpleSVGId' + idCounter;
        idCounter ++;
        body = strReplace('="' + id + '"', '="' + newID + '"', body);
        body = strReplace('="#' + id + '"', '="#' + newID + '"', body);
        body = strReplace('(#' + id + ')', '(#' + newID + ')', body);
    });

    return body;
}

/**
 * SVG object constructor
 *
 * @param {object} item Item from storage
 * @return {SVG}
 * @constructor
 */
function SVG(item) {
    this.item = item;

    /**
     * Get icon height
     *
     * @param {string|number} [width] Width to calculate height for. If missing, default icon height will be returned.
     * @param {number} [precision] Precision for calculating height. Result is rounded to 1/precision. Default = 100
     * @return {number|null}
     */
    this.height = function(width, precision) {
        return calculateCustomDimension(this.item, {
            width: width,
            precision: precision
        }, 'height', 'width');
    };

    /**
     * Get icon width
     *
     * @param {string|number} [height] Height to calculate width for. If missing, default icon width will be returned.
     * @param {number} [precision] Precision for calculating width. Result is rounded to 1/precision. Default = 100
     * @return {number|null}
     */
    this.width = function(height, precision) {
        return calculateCustomDimension(this.item, {
            height: height,
            precision: precision
        }, 'width', 'height');
    };

    /**
     * Get transformation string for icon
     *
     * @param {object} [props] Custom properties to merge with icon properties
     * @return {string|null}
     */
    this.transformation = function(props) {
        var data;

        if (props !== void 0) {
            data = {
                vFlip: props.vFlip === void 0 ? this.item.vFlip : Storage.mergeFlip(this.item.vFlip, props.vFlip),
                hFlip: props.hFlip === void 0 ? this.item.hFlip : Storage.mergeFlip(this.item.hFlip, props.hFlip),
                rotate: props.rotate === void 0 ? this.item.rotate : Storage.mergeRotation(this.item.rotate, props.rotate)
            };
        } else {
            data = this.item;
        }

        return calculateTransformation(data);
    };

    /**
     * Get default SVG attributes
     *
     * @return {object}
     */
    this.defaultAttributes = function() {
        return {
            xmlns: 'http://www.w3.org/2000/svg',
            'xmlns:xlink': 'http://www.w3.org/1999/xlink',
            preserveAspectRatio: 'xMidYMid meet',
            viewBox: '0 0 ' + this.item.width + ' ' + this.item.height
        };
    };

    /**
     * Get SVG object for output
     *
     * @param {object} [props] Custom properties
     * @param {boolean} [placeholder] True if element is placeholder
     * @return {object|null}
     */
    this.svgObject = function(props, placeholder) {
        var attributes, transformation, width, height, customWidth, customHeight, body, regex;

        props = props === void 0 ? {} : props;
        placeholder = placeholder === true;

        attributes = placeholder ? {} : this.defaultAttributes();
        transformation = this.transformation(props);

        customWidth = props['data-width'] === void 0 ? props.width : props['data-width'];
        customHeight = props['data-height'] === void 0 ? props.height : props['data-height'];

        if (customWidth === void 0 && customHeight === void 0) {
            height = '1em';
            width = this.width(height);
        } else if (customWidth !== void 0 && customHeight !== void 0) {
            width = customWidth;
            height = customHeight;
        } else if (customWidth !== void 0) {
            width = customWidth;
            height = width === null ? null : this.height(width);
        } else {
            height = customHeight;
            width = height === null ? null : this.width(height);
        }

        // width = props.width !== void 0 ? props.width : (props.height !== void 0 ? this.width(props.height) : this.item.width);
        // height = props.height !== void 0 ? props.height : (props.width !== void 0 ? this.height(props.width) : this.item.height);

        if (width !== null) {
            attributes.width = width === 'auto' ? item.width : width;
        }
        if (height !== null) {
            attributes.height = height === 'auto' ? item.height : height;
        }

        // Style
        if (!placeholder) {
            attributes.style = '-ms-transform: ' + transformation + ';' +
                ' -webkit-transform: ' + transformation + ';' +
                ' transform: ' + transformation + ';' +
                (props.style === void 0 ? '' : props.style);
        }

        // Copy custom properties
        Object.keys(props).forEach(function(attr) {
            if (props[attr] === null) {
                return;
            }
            switch (attr) {
                case 'rotate':
                case 'vFlip':
                case 'hFlip':
                case 'body':
                case 'width':
                case 'height':
                    return;

                case 'style':
                    if (placeholder) {
                        break;
                    }
                    return;

                case 'before':
                case 'after':
                    if (placeholder) {
                        attributes['data-' + attr] = props[attr];
                    }
                    return;

                case 'data-before':
                case 'data-after':
                    if (!placeholder) {
                        props[attr.slice(5)] = props[attr];
                        return;
                    }
            }
            attributes[attr] = props[attr];
        });

        // Output
        if (placeholder) {
            return {
                attributes: attributes
            };
        }

        body = (typeof props.before === 'string' ? props.before : '') + this.item.body + (typeof props.after === 'string' ? props.after : '');
        body = replaceIDs(body);

        return {
            attributes: attributes,
            body: body
        };
    };

    return this;
}

// Export static variables and functions
SVG.defaultAttributes = defaultAttributes;

module.exports = SVG;