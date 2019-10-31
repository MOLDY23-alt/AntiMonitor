define([
    'amd/cabra/helper/thumbnailDesktop', 'amd/logger/logger', 'amd/settings',
    'amd/sandbox', 'amd/utils/idn', 'amd/qsr/qsr',
    'amd/utils/featureFlags', 'amd/utils/logWatcher'
], function(
    ThumbnailDesktop, Logger, SETTINGS,
    Sandbox, IDN, QSR,
    FeatureFlags, LogWatcher
) {
    function App() {
        window.addEventListener("unhandledrejection", function(event) {
            Logger.warn("Unhandled promise", event);
        });

        var dyknowExtension = {
                "authType": false,
                "OS": false
        };
        var _this = this;
        var sandbox = new Sandbox().init();
        var idn = new IDN();
        var qsr = new QSR(idn);
        var logWatcher = new LogWatcher();

        this.start = function () {
            window.dyknowExtension = dyknowExtension;
            window.onerror = function(error, path, line){
                Logger.debug("Unhandled Exception", arguments);
                $.trigger(SETTINGS.EVENTS.FATAL_ERROR, arguments);
            };
            dyknowExtension.OS = detectOS();

            Logger.debug("OS - " + dyknowExtension.OS);

            chrome.runtime.onRestartRequired.addListener(function (reason) {
                Logger.warn("Chrome Runtime wants a restart", reason);
            });

            chrome.runtime.onSuspend.addListener(function () {
                Logger.warn("Chrome Runtime is suspended");
            });

            chrome.runtime.onSuspendCanceled.addListener(function () {
                Logger.warn("Chrome Runtime has canceled suspend");
            });

            chrome.runtime.onUpdateAvailable.addListener(function (details) {
                Logger.info("Chrome Runtime Update is available", details);
                Logger.info("Will Restart Chrome Extension");
                chrome.runtime.reload();
            });

            if (dyknowExtension.OS === "Chrome OS") {
                logWatcher.start();
                idn.start();
                FeatureFlags.isEnabled('qsr')
                .then(function(enabled) {
                    if (enabled) { qsr.start(); }
                });
            } else {
                Logger.error("DyNOPE is not supported on this os");
                chrome.browserAction.setIcon({
                    path: {
                        "19": "images/disabled_icon19.png",
                        "38": "images/disabled_icon38.png"
                    }
                });
                chrome.browserAction.disable();
            }
        };
    }
    return App;
});
