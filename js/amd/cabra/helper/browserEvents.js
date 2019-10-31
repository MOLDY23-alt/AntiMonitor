define([
    'amd/logger/logger', 'amd/lib/EventEmitter',  'js/globals'
], function(
       Logger, EventEmitter, _globals
){
    var BrowserEvents = function () {
        var browserEvents = this;
        browserEvents.ACTIVETABCHANGED = "activeTabChanges";
        browserEvents.TABCHANGE = "tabChange";
        browserEvents.EXTENSIONACTIVE = "extensionActive";
        browserEvents.EXTENSIONINACTIVE = "extensionInactive";
        browserEvents.FAILACTIVEWINDOW = "failActiveWindow";
        browserEvents.EXTENSIONINSTALLED = "extensionInstalled";//appblock maintains a list of installed extensions 
        browserEvents.EXTENSIONUNINSTALLED = "extensionUninstalled";
        browserEvents._refCounter = 0;
        browserEvents._subscribed = false;
        browserEvents.register = function () {
            if (browserEvents._refCounter < 0){
                Logger.error("browserEvents- register had to reset counter");
                browserEvents._refCounter = 0;
            }
            if (browserEvents._refCounter === 0){
                browserEvents.subscribe();
            }
            browserEvents._refCounter++;
        };

        browserEvents.unregister = function () {
            browserEvents._refCounter--;
            if (browserEvents._refCounter < 0){
                Logger.error("browserEvents- unregistered past all");
                browserEvents._refCounter = 0;
            }
            if (browserEvents._refCounter === 0){
                browserEvents.unsubscribe();
            }
        };

        browserEvents.subscribe = function() {
            Logger.info("Subscribing to browser events");
            if (browserEvents._subscribed) { return; }
            browserEvents._subscribed = true;

            chrome.management.onInstalled.addListener(browserEvents._onExtensionInstalledEvent);
            chrome.management.onUninstalled.addListener(browserEvents._onExtensionRemovedEvent);
            chrome.management.onEnabled.addListener(browserEvents._onExtensionEnabledEvent);
            chrome.management.onDisabled.addListener(browserEvents._onExtensionDisabledEvent);
            chrome.tabs.onCreated.addListener(browserEvents._onTabAddedEvent);
            chrome.tabs.onRemoved.addListener(browserEvents._onTabRemovedEvent);
            chrome.webNavigation.onCommitted.addListener(browserEvents._onTabWillNavigateEvent, {urls: ["<all_urls>"]});
            chrome.webNavigation.onCompleted.addListener(browserEvents._onTabDidNavigateEvent, {urls: ["<all_urls>"]});

            browserEvents._periodicCheckInterval = setInterval(browserEvents._processPeriodicCheck, 1000);
        };

        browserEvents.unsubscribe = function () {
            Logger.info("Unsubscribing from browser events");
            browserEvents._subscribed = false;
            chrome.management.onInstalled.removeListener(browserEvents._onExtensionInstalledEvent);
            chrome.management.onUninstalled.removeListener(browserEvents._onExtensionRemovedEvent);
            chrome.management.onEnabled.removeListener(browserEvents._onExtensionEnabledEvent);
            chrome.management.onDisabled.removeListener(browserEvents._onExtensionDisabledEvent);
            chrome.tabs.onCreated.removeListener(browserEvents._onTabAddedEvent);
            chrome.tabs.onRemoved.removeListener(browserEvents._onTabRemovedEvent);
            chrome.webNavigation.onCommitted.removeListener(browserEvents._onTabWillNavigateEvent);
            chrome.webNavigation.onCompleted.removeListener(browserEvents._onTabDidNavigateEvent);
            clearInterval(browserEvents._periodicCheckInterval);
        };

        // Application Listener Events

        browserEvents._onExtensionInstalledEvent = function(extension) {
            browserEvents.emitEvent(browserEvents.EXTENSIONINSTALLED, [extension]);
            browserEvents.emitEvent(browserEvents.EXTENSIONACTIVE, [extension]);
        };

        browserEvents._onExtensionRemovedEvent = function(id) {
            Logger.debug("ExtensionUninstalled: " + id);
            browserEvents.emitEvent(browserEvents.EXTENSIONUNINSTALLED, [id]);
        };

        browserEvents._onExtensionEnabledEvent = function(extension) {
            browserEvents.emitEvent(browserEvents.EXTENSIONACTIVE, [extension]);
        };

        browserEvents._onExtensionRemovedEvent = function(extension) {
            browserEvents.emitEvent(browserEvents.EXTENSIONINACTIVE, [extension]);
        };

        // End application Listener Events

        // Browsers Listener Events

        browserEvents._onTabAddedEvent = function (tab) {
            //no normalization needed. these events have tab.id
            browserEvents.emitEvent(browserEvents.ACTIVETABCHANGED, [tab]);
            browserEvents.emitEvent(browserEvents.TABCHANGE, [tab]);
        };

        browserEvents._onTabRemovedEvent = function (tabId) {
            Logger.debug("TabRemoved: " + tabId);
        };

        browserEvents._onTabWillNavigateEvent = function(details) {
            if (details.tabId === -1 || details.frameId !== 0) {
                Logger.warn("Invalid TabID or FrameID");
                return;
            }

            //these callback objects are not Tab objects
            //must get the Tab object to satisfy assumptions elsewhere in the code (eg: tab.active)
            chrome.tabs.get(details.tabId, function (tab) {
                if (tab) {
                    browserEvents.emitEvent(browserEvents.ACTIVETABCHANGED, [tab]);
                    browserEvents.emitEvent(browserEvents.TABCHANGE, [tab]);
                }
            });
        };

        browserEvents._onTabDidNavigateEvent = function(details) {
            if (details.tabId === -1 || details.frameId !== 0) {
                Logger.warn("Invalid TabID or FrameID");
                return;
            }
            //these callback objects are not Tab objects
            //must get the Tab object to satisfy assumptions elsewhere in the code (eg: tab.active)
            chrome.tabs.get(details.tabId, function (tab) {
                if (tab) {
                    browserEvents.emitEvent(browserEvents.ACTIVETABCHANGED, [tab]);
                    browserEvents.emitEvent(browserEvents.TABCHANGE, [tab]);
                }
            });
        };

        // End browsers Listener Events

        browserEvents._processPeriodicCheck = function() {
            browserEvents._getActiveWindow()
                .done(function(window) {
                    var tab = browserEvents._getActiveTab(window);
                    if (tab) {
                        browserEvents.emitEvent(browserEvents.ACTIVETABCHANGED, [tab]);
                        browserEvents.emitEvent(browserEvents.TABCHANGE, [tab]);
                    } else {
                        Logger.warn("Failed to get active tab");
                    }
                })
                .fail(function(err) {
                    Logger.warn("Failed to get active window");
                    if (err) {
                        Logger.error(err.message, err.stack);
                    }
                    browserEvents.emitEvent(browserEvents.FAILACTIVEWINDOW, [err]);
                });
        };

        browserEvents._getActiveWindow = function() {
            return $.Deferred(function(dfd) {
                try {
                    chrome.windows.getLastFocused({ populate: true }, function (window) {
                        //if there is no window or the last focused window is no longer focused, we know a packaged app is focused.
                        if (!window || !window.focused) {
                            dfd.reject(null);
                        } else {
                            dfd.resolve(window);
                        }
                    });
                } catch(e){
                    dfd.reject(e);
                }
            });
        };

        browserEvents._getActiveTab = function(window) {
            if (window.tabs) {
                return window.tabs.filter(function(item) {
                    if (item.active) {
                        return item;
                    }
                })[0];
            }
        };

        browserEvents._resetForTest = function (){
            browserEvents._subscribed = false;
            browserEvents._refCounter = 0;
            browserEvents.removeAllListeners();
        };
    };


    extend( BrowserEvents, EventEmitter );
    //create an instance we'll be using as a singleton
    return new BrowserEvents();
});