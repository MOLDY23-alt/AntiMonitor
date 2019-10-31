define([
    'amd/logger/logger', 'js/globals', 'amd/cabra/helper/browserEvents',
    'amd/sandbox', 'amd/cabra/helper/blocking.events'
], function(
    Logger, _globals, browserEvents,
    Sandbox, blockingEvents
) {
    var sandbox = new Sandbox().init();
    var UrlFilter = function (redirectLocation) {

        this._whiteListWebsites = [];
        this._globalAllowedWebsites = [];
        this._userDefinedAllowedWebsites = [];
        this._blackListWebsites = [];

        this._subscribed = false;
        // NOTE: Subscription bindings created after method definitions.
        /**
         * Subscribe to the various chrome events.
         * This will also begin the periodic check interval.
         */
        this.subscribe = function() {
            if (this._subscribed) { return; }
            this._subscribed = true;
            browserEvents.register();
            browserEvents.on(browserEvents.TABCHANGE, this._onTabChange);
        };

        /**
         * Unsubscribe from the listened events.
         * This will also end the periodic check interval.
         */
        this.unsubscribe = function() {
            if (!this._subscribed) { return; }
            browserEvents.unregister();
            browserEvents.off(browserEvents.TABCHANGE, this._onTabChange);
            this._subscribed = false;
        };

        this._addGlobalWhiteListWebsitesFromArray = function (array) {
            var self = this;
            if (array && array.length) {
                array.forEach(function (website) {
                    self._whiteListWebsites.push(website);
                    self._globalAllowedWebsites.push(website);
                });
            }
        };

        this._addUserWhiteListWebsitesFromArray = function (array) {
            var self = this;
            if (array && array.length) {
                array.forEach(function (website) {
                    self._whiteListWebsites.push(website);
                    self._userDefinedAllowedWebsites.push(website);
                });
            }
        };

        this._addBlackListWebsitesFromArray = function (array) {
            var self = this;
            if (array && array.length) {
                array.forEach(function (website) {
                    self._blackListWebsites.push(website);
                });
            }
        };


        this.redirectLocation = (!!redirectLocation) ? redirectLocation : "https://studentontask.com";

        this.isWhitelist = function () {
            return this._userDefinedAllowedWebsites.length > 0;
        };

        this.isBlacklist = function () {
            return !this.isWhitelist() && this._blackListWebsites.length > 0;
        };

        this.isAllowAll = function () {
            return !this.isWhitelist() && !this.isBlacklist();
        };

        /**
         * Apply a new set of filtering rules.
         * @param {array} coreWhitelist The core application whitelist.
         * @param {array} globalWhitelist The globally configured whitelist.
         * @param {array} whitelist A whitelist to apply.
         * @param {array} blacklist A blacklist to apply.
         */
        this.filter = function(coreWhitelist, globalWhitelist, whitelist, blacklist) {
            var self = this;
            self._whiteListWebsites.splice(0, self._whiteListWebsites.length);
            self._globalAllowedWebsites.splice(0, self._globalAllowedWebsites.length);
            self._userDefinedAllowedWebsites.splice(0, self._userDefinedAllowedWebsites.length);
            self._blackListWebsites.splice(0, self._blackListWebsites.length);

            self._addGlobalWhiteListWebsitesFromArray(coreWhitelist.concat(globalWhitelist).concat([new URL(self.redirectLocation).hostname]));
            self._addUserWhiteListWebsitesFromArray(whitelist);
            self._addBlackListWebsitesFromArray(blacklist);

            if (self.isWhitelist() || self.isBlacklist()) {
                Logger.info("applyWithFlag:", (self.isWhitelist()) ? 'FILTER:WHITELIST' : 'FILTER:BLACKLIST');
                self.subscribe();
                self.filterActiveTabs();
            } else if (self.isAllowAll()) {
                Logger.info("applyWithFlag:FILTER:ALLOW");
                self.unsubscribe();
            } else {
                Logger.error("Invalid Blocking Type");
            }
        };

        /**
         * Check if a URL should be filtered.
         * @param {string} url A URL to validate.
         * @returns {boolean} If the url should be filtered.
         */
        this.shouldFilterWebsiteWithURL = function(url) {
            var self = this;

            // Guard against filtering with an allow all.
            if (self.isAllowAll()) {
                Logger.debug("Filtering should not be applied for allow all.");
                return false;
            }

            var predicate = function(evaluatedObject) {
                    try {
                        if(evaluatedObject.ostype && evaluatedObject.ostype == 'web-fragment') {
                            //escape characters in identifier
                            var regexObj = (evaluatedObject.identifier).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

                            //account for URLs ending in / - allows a route-terminating character (?#:/) plus more text, or end of URL
                            var last = regexObj.substr(regexObj.length - 1);
                            if(last == "/") {
                                regexObj = regexObj.substring(0, regexObj.length - 2) + "(\\/|\\?|\\#|\\:|$)";
                            }

                            return url.search(new RegExp('([^.]\.)*'+regexObj+'([^\n])*', "i")) !== -1;
                        } else {
                            if(evaluatedObject.identifier) {
                                evaluatedObject = evaluatedObject.identifier;
                            }
                            var host = new URL(url).hostname;
                            return host.search(new RegExp(evaluatedObject, "i")) !== -1;
                        }
                    }catch(ex) {
                        Logger.error("Failed to Evaluate URL");
                        Logger.debug("URL:", url);
                        Logger.debug("EvaluatedObject:", evaluatedObject);
                        return false;
                    }
                };

            if (needToExclude(url)) {
                Logger.debug("The should be excluded from filtering always", url);
                return false;
            }

            //Chrome new tab, always allow and report up
            if (url.indexOf("chrome-search://") > -1) {
                Logger.info("Chrome New Tab should be excluded from filtering");
                return false;
            }

            try
            {
                var host = new URL(url).hostname;
                if (!host) {
                    Logger.warn("The url does not have a hostname, will allow it", url);
                    return false;
                }
            } catch(ex) {
                Logger.error("Failed to Evaluate URL");
                Logger.debug("URL:", url);
                return false;
            }

            if (self.isWhitelist()) {
                if(self._whiteListWebsites.filter(predicate).length === 0) {
                    return true;
                }
            } else if(self.isBlacklist()) {
                if (self._globalAllowedWebsites.filter(predicate).length > 0) {
                    //Even in a BlackList the Globally Allowed Apps should be allowed
                } else {
                    return (self._whiteListWebsites.filter(predicate).length === 0) &&
                           (self._blackListWebsites.filter(predicate).length > 0);
                }
            }
            Logger.debug("shouldFilterWebsiteWithURL was false, URL: " + url + " must be on the whitelist or not on the blacklist");
            Logger.debug("FILTER:WHITELIST", self._whiteListWebsites);
            Logger.debug("FILTER:BLACKLIST", self._blackListWebsites);
            return false;
        };

        /**
         * Filter all the currently active tabs.
         */
        this.filterActiveTabs = function() {
            var self = this;
            chrome.tabs.query({ }, function(tabs) {
                Logger.info("Will Filter active tabs", tabs);
                tabs.forEach(function(tab) {
                    if(self.shouldFilterWebsiteWithURL(tab.url)) {
                        self.redirectTab(tab.id, tab);
                    }
                });
            });
        };

        this.redirectTab = function(tabId, tab) {
            var self = this;
            Logger.debug("Will Redirect Tab", tabId);
            sandbox.publish(blockingEvents.block_url, {
                url: tab.url, 
                title: tab.title
            });
            chrome.tabs.update(tabId, { url: self.redirectLocation });
        };

        // Browsers Listener Events

        //okay I dont really know what this is supposed to do
        this._processTabSelectionChangeEvent = function () {
            var self = this;
            Logger.debug("handleTabSelectionChangeEvent->",(this.isWhitelist()) ? 'FILTER:WHITELIST' : 'FILTER:BLACKLIST');
            self.filterActiveTabs();
        };

        this._processTabChange = function(tab) {
            if (this.shouldFilterWebsiteWithURL(tab.url)) {
                Logger.debug("handleTabChange->",(this.isWhitelist()) ? 'FILTER:WHITELIST' : 'FILTER:BLACKLIST');
                Logger.debug("Tab:" + tab.id + "(" + tab.url + ")");
                this.redirectTab(tab.id, tab);
            }
        };


        // Bind the event listeners used for chrome events.
        this._onTabChange = this._processTabChange.bind(this);
    };

    return UrlFilter;
});
