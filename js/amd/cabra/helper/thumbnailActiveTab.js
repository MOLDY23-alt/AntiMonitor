define(['amd/cabra/helper/thumbnailGeneral', 'amd/logger/logger'], function(ThumbanilGeneral, Logger){
    var ThumbnailActiveTab = function () {

        var _this = this;

        this._getScreenshot = function (width, height) {

            return new Promise(function (resolve, reject) {
                try {
                    chrome.tabs.captureVisibleTab( null, {}, function (dataUrl) {
                        if (chrome.runtime.lastError) {
                            // chrome.runtime.lastError should have `message`,
                            // however it is optional so the JSON serialized
                            // error is used instead.
                            Logger.error('runtime error capturing image: ' +
                                JSON.stringify(chrome.runtime.lastError));
                        }
                        if (dataUrl) {
                            _this.getImageBlob(dataUrl, width, height, resolve, reject);
                        } else {
                            _this.getImageBlob(false, width, height, resolve, reject);
                        }
                    });
                } catch (e) {
                    _this.getImageBlob(false, width, height, resolve, reject);
                    Logger.error(e.message, e.stack);
                }
            });
        };
    };

    extend(ThumbnailActiveTab, ThumbanilGeneral);

    return ThumbnailActiveTab;
});
