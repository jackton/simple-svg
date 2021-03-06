(function() {
    "use strict";

    var expect = chai.expect,
        should = chai.should();

    function load(SimpleSVG, local, global) {
        /* Modules() */
    }

    describe('Testing renderer', function() {
        it('rendering svg images', function(done) {
            var SimpleSVG = {
                    isReady: false
                },
                local = {
                    config: {}
                },
                global = {
                    SimpleSVGConfig: {
                        _readyEvent: 'RendererTestReadyEvent1'
                    }
                },
                containerID = 'renderer-svg',
                containerRoot,
                pending = 0;

            function init() {
                // Add dummy code
                jQuery('#debug2').append('<div id="' + containerID + '">' +
                        '<i class="simple-svg" data-icon="fa-home" />' +
                        '<i class="simple-svg" data-icon="fa-arrow-left" data-flip="horizontal" height="20px" />' +
                        '<i class="simple-svg" data-icon="fa-android" data-rotate="90deg" data-icon-append="true" height="24px" />' +
                    '</div>');

                containerRoot = document.getElementById(containerID);

                // Setup fake SimpleSVG instance
                local.iconsAdded = renderImages;
                load(SimpleSVG, local, global);
                if (local.config.defaultCDN.indexOf('{callback}') === -1) {
                    local.config.defaultCDN += (local.config.defaultCDN.indexOf('?') === -1 ? '?' : '&') + 'callback=window.SSVGRenderTest';
                } else {
                    local.config.defaultCDN = local.config.defaultCDN.replace('{callback}', 'window.SSVGRenderTest');
                }
                window.SSVGRenderTest = SimpleSVG._loaderCallback;

                SimpleSVG.ready(() => {
                    // Load images, start tests when images are available
                    local.findNewImages(containerRoot).forEach(function(image) {
                        if (!local.loadImage(image)) {
                            pending ++;
                        } else {
                            local.renderSVG(image);
                        }
                    });
                    if (!pending) {
                        test();
                    }
                });
            }

            // Callback to load pending images
            function renderImages() {
                local.findNewImages(containerRoot).forEach(function(image) {
                    local.renderSVG(image);
                });
                test();
            }

            // Do test
            function test() {
                var image1 = containerRoot.childNodes[0],
                    image2 = containerRoot.childNodes[1],
                    image3 = containerRoot.childNodes[2],
                    svg3;

                expect(image1.tagName.toLowerCase()).to.be.equal('svg', 'First image supposed to be SVG');
                expect(image2.tagName.toLowerCase()).to.be.equal('svg', 'Second image supposed to be SVG');
                expect(image3.tagName.toLowerCase()).to.be.equal('i', 'Third image supposed to be I');
                expect(image3.childNodes.length).to.be.equal(1, 'Third image must have child node');

                svg3 = image3.childNodes[0];
                expect(svg3.tagName.toLowerCase()).to.be.equal('svg', 'Third image child node supposed to be SVG');

                expect(image1.getAttribute('class')).to.be.equal('simple-svg', 'Class name should be simple-svg');
                expect(image1.getAttribute('data-icon')).to.be.equal('fa-home', 'data-icon attribute is missing or invalid');
                expect(image1.getAttribute('style').indexOf('rotate(360deg)')).to.not.be.equal(-1, 'Style should contain 360deg rotation');
                expect(image1.hasAttribute('xmlns')).to.be.equal(true, 'xmlns is missing');

                expect(image2.getAttribute('style').indexOf('scale(-1, 1)')).to.not.be.equal(-1, 'Style should contain scale rotation');

                done();
            }

            init();
        });
    });
})();
