define([
    'amd/logger/logger',
    'amd/cabra/helper/thumbnailActiveTab',
    'js/test/mocks/chrome.runtime',
    'js/test/mocks/chrome.tabs'
], function(
    Logger,
    ThumbnailActiveTab,
    runtime,
    tabs
) {
    describe('ThumbnailActiveTab', function() {
        var thumbnail, shouldResolve;

        beforeEach(function() {
            thumbnail = new ThumbnailActiveTab();
            spyOn(thumbnail, 'getImageBlob').andCallFake(
                function(data, width, height, resolve, reject) {
                    if (shouldResolve) { resolve(); } else { reject(); }
                });
            spyOn(Logger, 'error');
        });

        afterEach(function() {
            delete runtime.lastError;
        });

        it('can resolve', function() {
            shouldResolve = true;
            tabs.captureVisibleTab.andCallFake(function(windowId, cfg, callback) {
                callback('fake-data');
            });

            var success = null;
            runs(function() {
                thumbnail._getScreenshot(1, 2)
                .then(
                    function() { success = true; },
                    function() { success = false; }
                );
            });
            waitsFor(function() { return success !== null; });
            runs(function() {
                expect(success).toBe(true);
                expect(tabs.captureVisibleTab).toHaveBeenCalled();
                expect(thumbnail.getImageBlob).toHaveBeenCalledWith('fake-data', 1, 2, jasmine.any(Function), jasmine.any(Function));
                expect(Logger.error).not.toHaveBeenCalled();
            });
        });

        it('catches thrown errors', function() {
            shouldResolve = false;
            var err = {message: 'nope', stack: null};
            tabs.captureVisibleTab.andCallFake(function() { throw err; });

            var success = null;
            runs(function() {
                thumbnail._getScreenshot(1, 2)
                .then(
                    function() { success = true; },
                    function() { success = false; }
                );
            });
            waitsFor(function() { return success !== null; });
            runs(function() {
                expect(success).toBe(false);
                expect(tabs.captureVisibleTab).toHaveBeenCalled();
                expect(thumbnail.getImageBlob).toHaveBeenCalledWith(false, 1, 2, jasmine.any(Function), jasmine.any(Function));
                expect(Logger.error).toHaveBeenCalledWith(err.message, err.stack);
            });
        });

        it('catches runtime errors', function() {
            shouldResolve = false;
            tabs.captureVisibleTab.andCallFake(function(windowId, cfg, callback) {
                runtime.lastError = 'nope';
                callback();
                delete runtime.lastError;
            });

            var success = null;
            runs(function() {
                thumbnail._getScreenshot(1, 2)
                .then(
                    function() { success = true; },
                    function() { success = false; }
                );
            });
            waitsFor(function() { return success !== null; });
            runs(function() {
                expect(success).toBe(false);
                expect(tabs.captureVisibleTab).toHaveBeenCalled();
                expect(thumbnail.getImageBlob).toHaveBeenCalledWith(false, 1, 2, jasmine.any(Function), jasmine.any(Function));
                expect(Logger.error).toHaveBeenCalledWith('runtime error capturing image: "nope"');
            });
        });
    });
});
