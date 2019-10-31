define([
    'amd/cabra/helper/urlFilter', 'js/test/mocks/chrome', 'js/test/mocks/logger',
    'amd/cabra/helper/browserEvents'
], function(
    UrlFilter, chrome, logger,
    browserEvents
) {
    describe('UrlFiltering', function () {
        var urlFilter = false,
            hostnameForName = function (name) {
                return name + '.com';
            },
            createUrlForName = function (name) {
                return 'http://' + hostnameForName(name);
            },
            createUrlForHostName = function (hostname) {
                return 'http://' + hostname;
            },
            createFragmentForName = function (name, trailing) {
                return 'http://' + hostnameForName + trailing;
            };

        beforeEach(function() {
            chrome.useMock();
            logger.useMock();
            urlFilter = new UrlFilter();
            browserEvents._resetForTest();
        });

        afterEach(function() {
            browserEvents._resetForTest();
            chrome.resetMock();
        });

        describe('subscriptions', function() {
            var eventObjects;
            beforeEach(function() {
                eventObjects = [
                    chrome.management.onInstalled, chrome.management.onUninstalled,
                    chrome.management.onEnabled, chrome.management.onDisabled,
                    chrome.tabs.onCreated, chrome.tabs.onRemoved,
                    chrome.webNavigation.onCommitted, chrome.webNavigation.onCompleted
                ];
            });

            it('can subscribe to chrome events', function() {
                urlFilter.subscribe();
                eventObjects.forEach(function(feature) {
                    expect(feature.addListener).toHaveBeenCalled();
                    expect(feature.addListener.calls.length).toEqual(1);
                });
            });

            it('will not subscribe if already subscribed', function() {
                urlFilter._subscribed = true;
                urlFilter.subscribe();
                eventObjects.forEach(function(feature) {
                    expect(feature.addListener).not.toHaveBeenCalled();
                });
            });

            it('will not re-subscribe to chrome events', function() {
                urlFilter.subscribe();
                urlFilter.subscribe();
                eventObjects.forEach(function(feature) {
                    expect(feature.addListener).toHaveBeenCalled();
                    expect(feature.addListener.calls.length).toEqual(1);
                });
            });

            it('can unsubscribe to chrome events', function() {
                urlFilter.subscribe();
                urlFilter.unsubscribe();
                eventObjects.forEach(function(feature) {
                    expect(feature.removeListener).toHaveBeenCalled();
                    expect(feature.removeListener.calls.length).toEqual(1);
                });
            });

            it('will not unsubscribe if not subscribed', function() {
                urlFilter._subscribed = false;
                urlFilter.unsubscribe();
                eventObjects.forEach(function(feature) {
                    expect(feature.removeListener).not.toHaveBeenCalled();
                });
            });

            it('will only unsubscribe once', function() {
                urlFilter.subscribe();
                urlFilter.unsubscribe();
                urlFilter.unsubscribe();
                eventObjects.forEach(function(feature) {
                    expect(feature.removeListener).toHaveBeenCalled();
                    expect(feature.removeListener.calls.length).toEqual(1);
                });
            });

            it('will subscribe on blacklist filter', function() {
                spyOn(urlFilter, 'subscribe');
                spyOn(urlFilter, 'unsubscribe');
                spyOn(urlFilter, 'isBlacklist').andReturn(true);
                spyOn(urlFilter, 'isWhitelist').andReturn(false);

                urlFilter.filter([], [], [], []);
                expect(urlFilter.subscribe).toHaveBeenCalled();
                expect(urlFilter.unsubscribe).not.toHaveBeenCalled();
                expect(urlFilter.subscribe.calls.length).toBe(1);
            });

            it('will subscribe on whitelist filter', function() {
                spyOn(urlFilter, 'subscribe');
                spyOn(urlFilter, 'unsubscribe');
                spyOn(urlFilter, 'isBlacklist').andReturn(false);
                spyOn(urlFilter, 'isWhitelist').andReturn(true);

                urlFilter.filter([], [], [], []);
                expect(urlFilter.subscribe).toHaveBeenCalled();
                expect(urlFilter.unsubscribe).not.toHaveBeenCalled();
                expect(urlFilter.subscribe.calls.length).toBe(1);
            });

            it('will unsubscribe on filter clear', function() {
                spyOn(urlFilter, 'subscribe');
                spyOn(urlFilter, 'unsubscribe');
                spyOn(urlFilter, 'isBlacklist').andReturn(false);
                spyOn(urlFilter, 'isWhitelist').andReturn(false);

                urlFilter.filter([], [], [], []);
                expect(urlFilter.subscribe).not.toHaveBeenCalled();
                expect(urlFilter.unsubscribe).toHaveBeenCalled();
                expect(urlFilter.unsubscribe.calls.length).toBe(1);
            });
        });

        //Core

        it("testWebsiteOnCoreWhitelistIsAllowedNothingOnGlobalOrWhiteListOrBlacklist", function() {
            var coreJson = [
                    hostnameForName('google')
                ];

            urlFilter.filter(coreJson, [], [], []);

            coreJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testWebsitesOnCoreWhitelistIsAllowedNothingOnGlobalOrWhiteListOrBlacklist", function() {
            var coreJson = [
                    hostnameForName('google'),
                    hostnameForName('facebook')
                ];

            urlFilter.filter(coreJson, [], [], []);

            coreJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        //Global

        it("testWebsiteOnGlobalWhitelistIsAllowedNothingOnCoreOrWhitelistOrBlacklist", function() {
            var globalJson = [
                    hostnameForName('google')
                ];

            urlFilter.filter([], globalJson, [], []);

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testWebsitesOnGlobalWhitelistIsAllowedNothingOnCoreOrWhitelistOrBlacklist", function() {
            var globalJson = [
                    hostnameForName('google'),
                    hostnameForName('facebook')
                ];

            urlFilter.filter([], globalJson, [], []);

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        //whitelist

        it("testWebsiteOnWhitelistIsAllowedNothingOnCoreOrGlobalOrBlacklist", function() {
            var whitelistJson = [
                    hostnameForName('google')
                ];

            urlFilter.filter([], [], whitelistJson, []);

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testWebsitesOnWhitelistIsAllowedNothingOnCoreOrGlobalOrBlacklist", function() {
            var whitelistJson = [
                    hostnameForName('google'),
                    hostnameForName('facebook')
                ];

            urlFilter.filter([], [], whitelistJson, []);

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        //blacklist

        it("testWebsiteOnBlacklistIsBlockedNothingOnCoreOrGlobalOrWhitelist", function() {
            var blacklistjson = [
                    hostnameForName('google')
                ];

            urlFilter.filter([], [], [], blacklistjson);

            blacklistjson.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testWebsitesOnBlacklistIsBlockedNothingOnCoreOrGlobalOrWhitelist", function() {
            var blacklistjson = [
                    hostnameForName('google'),
                    hostnameForName('facebook')
                ];

            urlFilter.filter([], [], [], blacklistjson);

            blacklistjson.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        //global + whitelist

        it("testWebsitesOnGlobalORWhitelistIsAllowedNothingOnCoreOrBlacklist", function() {
            var globalJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                whitelistJson = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], globalJson, whitelistJson, []);

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        //core + global + whitelist

        it("testWebsitesOnCoreOrGlobalORWhitelistIsAllowedNothingOnBlacklist", function() {
            var coreJson = [
                    hostnameForName('dyknow'),
                    hostnameForName('pearson')
                ],
                globalJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                whitelistJson = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter(coreJson, globalJson, whitelistJson, []);

            coreJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        //global + blacklist

        it("testWebsitesOnGlobalORBlacklistIsBlockedOnBlackListAllowedOnGlobalNothingOnCoreOrWhiteList", function() {
            var globalJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                blacklist = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], globalJson, [], blacklist);

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            blacklist.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testGlobalListTrumpsBlackListWhenConflictingNothingOnCoreOrWhiteList", function() {
            var globalJson = [
                    hostnameForName('facebook')
                ],
                blacklist = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], globalJson, [], blacklist);

            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('facebook'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('google'))).toBe(true);
        });

        //core + global + blacklist

        it("testWebsitesOnCoreOrGlobalORBlacklistIsBlockedOnBlackListAllowedOnGlobalNothingOnWhiteList", function() {
            var coreJson = [
                    hostnameForName('dyknow'),
                    hostnameForName('pearson')
                ],
                globalJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                blacklistJson = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter(coreJson, globalJson, [], blacklistJson);

            coreJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            blacklistJson.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testCoreOrGlobalListTrumpsBlackListWhenConflictingNothingOnWhiteList", function() {
            var coreJson = [
                    hostnameForName('dyknow'),
                    hostnameForName('pearson')
                ],
                globalJson = [
                    hostnameForName('facebook')
                ],
                blacklist = [
                    hostnameForName('dyknow'),
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter(coreJson, globalJson, [], blacklist);

            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dyknow'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('facebook'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('google'))).toBe(true);
        });

        //whitelist + blacklist

        it("testWebsitesOnWhiteORBlacklistIsBlockedOnBlackListAllowedOnWhiteNothingOnCoreOrGlobal", function() {
            var whitelistJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                blacklistJson = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], [], whitelistJson, blacklistJson);

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            blacklistJson.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testWhiteListTrumpsBlackListWhenConflictingNothingOnCoreOrGlobal", function() {
            var whitelist = [
                    hostnameForName('facebook')
                ],
                blacklist = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], [], whitelist, blacklist);

            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('facebook'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('google'))).toBe(true);
        });

        // global + whitelist + blacklist

        it("testWebsitesOnGlobalOrWhiteORBlacklistIsBlockedOnBlackListAllowedOnWhiteNothingOnCore", function() {
            var globalJson = [
                    hostnameForName('youtube')
                ],
                whitelistJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                blacklistJson = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], globalJson, whitelistJson, blacklistJson);

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            blacklistJson.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testGlobalOrWhiteListTrumpsBlackListWhenConflictingNothingOnCore", function() {
            var globalJson = [
                    hostnameForName('youtube')
                ],
                whitelist = [
                    hostnameForName('facebook')
                ],
                blacklist = [
                    hostnameForName('youtube'),
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter([], globalJson, whitelist, blacklist);

            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('youtube'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('facebook'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('google'))).toBe(true);
        });

        // core + global + whitelist + blacklist

        it("testWebsitesOnCoreOrGlobalOrWhiteORBlacklistIsBlockedOnBlackListAllowedOnWhite", function() {
            var coreJson = [
                    hostnameForName('dyknow'),
                    hostnameForName('pearson')
                ],
                globalJson = [
                    hostnameForName('youtube')
                ],
                whitelistJson = [
                    hostnameForName('depauw'),
                    hostnameForName('moodle')
                ],
                blacklistJson = [
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter(coreJson, globalJson, whitelistJson, blacklistJson);

            coreJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            globalJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            whitelistJson.forEach(function (json) {
                var expected = false;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });

            blacklistJson.forEach(function (json) {
                var expected = true;
                var actual = urlFilter.shouldFilterWebsiteWithURL(createUrlForHostName(json));
                expect(expected).toBe(actual);
            });
        });

        it("testCoreOrGlobalOrWhiteListTrumpsBlackListWhenConflicting", function() {
            var coreJson = [
                    hostnameForName('dyknow'),
                    hostnameForName('pearson')
                ],
                globalJson = [
                    hostnameForName('youtube')
                ],
                whitelist = [
                    hostnameForName('facebook')
                ],
                blacklist = [
                    hostnameForName('dyknow'),
                    hostnameForName('youtube'),
                    hostnameForName('facebook'),
                    hostnameForName('google')
                ];

            urlFilter.filter(coreJson, globalJson, whitelist, blacklist);

            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dyknow'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('youtube'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('facebook'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('google'))).toBe(true);
        });

        it("emptylist allows everything", function() {
            urlFilter.filter([], [], [], []);

            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dyknow'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('youtube'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('facebook'))).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('google'))).toBe(false);
        });

        it("is case insensitive", function() {
            urlFilter.filter([], [], [], [hostnameForName('dyknow')]);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dyknow'))).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dYkNoW'))).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('DYKNOW'))).toBe(true);
        });

        it("is case insensitive plan", function() {
            urlFilter.filter([], [], [], [hostnameForName('DyKnow')]);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dyknow'))).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('dYkNoW'))).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL(createUrlForName('DYKNOW'))).toBe(true);
        });

        it('test subdomains', function() {
            urlFilter.filter([],[],['zendesk.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('https://dyknow.zendesk.com/agent/#/dashboard')).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL('http://dyknow.zendesk.com/agent/#/dashboard')).toBe(false);

            urlFilter.filter([],[],['dyknow.zendesk.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('https://dyknow.zendesk.com/agent/#/dashboard')).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL('http://dyknow.zendesk.com/agent/#/dashboard')).toBe(false);

            urlFilter.filter([],[],['www.zendesk.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('https://dyknow.zendesk.com/agent/#/dashboard')).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL('http://dyknow.zendesk.com/agent/#/dashboard')).toBe(true);
        });

        it('test about scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            //has no hostname
            expect(urlFilter.shouldFilterWebsiteWithURL('about://facebook.com')).toBe(false);
            expect(urlFilter.shouldFilterWebsiteWithURL('about://dyknow.com')).toBe(false);
        });

        it('test data scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')).toBe(false);
        });

        it('test file scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('file://DKTeamcity01/yolo/file.csv')).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL('file://dyknow.com/yolo/file.csv')).toBe(false);
        });

        it('test http scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('http://DKTeamcity01/yolo/file.csv')).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL('http://dyknow.com/yolo/file.csv')).toBe(false);
        });

        it('test https scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('https://DKTeamcity01/yolo/file.csv')).toBe(true);
            expect(urlFilter.shouldFilterWebsiteWithURL('https://dyknow.com/yolo/file.csv')).toBe(false);
        });

        it('test chrome scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            //we have decided to always allow these
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome://yolo')).toBe(false);
        });

        it('test chrome-devtools scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            //we have decided to always allow these
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome-devtools://yolo')).toBe(false);
        });

        it('test chrome-extension scheme', function() {
            urlFilter.filter([],[],['dyknow.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome-extension://yolo')).toBe(true);
        });

        describe("events", function (){
            beforeEach(function(){
                urlFilter.subscribe();
            });

            it("redirects new tab if tab should be filtered", function() {
                spyOn(urlFilter, 'shouldFilterWebsiteWithURL').andReturn(true);
                spyOn(urlFilter, 'redirectTab');
    
                browserEvents._onTabAddedEvent({ url: 'http://yolo.com', id: 123 });
                expect(urlFilter.redirectTab).toHaveBeenCalled();
            });
    
            it("does not redirect new tab if tab should not be filtered", function() {
                spyOn(urlFilter, 'shouldFilterWebsiteWithURL').andReturn(false);
                spyOn(urlFilter, 'redirectTab');
    
                browserEvents._onTabAddedEvent({ url: 'http://yolo.com', id: 123 });
                expect(urlFilter.redirectTab).not.toHaveBeenCalled();
            });
    
            it("redirects navigating tab if tab should be filtered", function() {
                spyOn(urlFilter, 'shouldFilterWebsiteWithURL').andReturn(true);
                spyOn(urlFilter, 'redirectTab');
    
                browserEvents._onTabWillNavigateEvent({ url: 'http://yolo.com', tabId: 123, frameId: 0 });
                var getCallback = chrome.tabs.get.calls[0].args[1];
                getCallback({
                    id: 123,
                    url: "http://yolo.com"
                });
                expect(urlFilter.redirectTab).toHaveBeenCalled();
            });
    
            it("does not redirect navigating tab if tab should not be filtered", function() {
                spyOn(urlFilter, 'shouldFilterWebsiteWithURL').andReturn(false);
                spyOn(urlFilter, 'redirectTab');
    
                browserEvents._onTabWillNavigateEvent({ url: 'http://yolo.com', tabId: 123, frameId: 0 });
                expect(urlFilter.redirectTab).not.toHaveBeenCalled();
            });
    
            it("redirects navigated tab if tab should be filtered", function() {
                spyOn(urlFilter, 'shouldFilterWebsiteWithURL').andReturn(true);
                spyOn(urlFilter, 'redirectTab');
    
                browserEvents._onTabDidNavigateEvent({ url: 'http://yolo.com', tabId: 123, frameId: 0 });
                var getCallback = chrome.tabs.get.calls[0].args[1];
                getCallback({
                    id: 123,
                    url: "http://yolo.com"
                });
                expect(urlFilter.redirectTab).toHaveBeenCalled();
            });
    
            it("does not redirect navigated tab if tab should not be filtered", function() {
                spyOn(urlFilter, 'shouldFilterWebsiteWithURL').andReturn(false);
                spyOn(urlFilter, 'redirectTab');
    
                browserEvents._onTabDidNavigateEvent({ url: 'http://yolo.com', tabId: 123, frameId: 0 });
                expect(urlFilter.redirectTab).not.toHaveBeenCalled();
            });
        });

        it("chrome extension", function () {
            urlFilter.filter([],[],['heagkhocbbgfanpmhakmbffiiolbhfcf'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome-extension://heagkhocbbgfanpmhakmbffiiolbhfcf/Tornado_Web_nacl.html')).toBe(false);

            urlFilter.filter([],[],['google.com'],[]);
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome-extension://heagkhocbbgfanpmhakmbffiiolbhfcf/Tornado_Web_nacl.html')).toBe(true);

            urlFilter.filter([],[],[],['heagkhocbbgfanpmhakmbffiiolbhfcf']);
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome-extension://heagkhocbbgfanpmhakmbffiiolbhfcf/Tornado_Web_nacl.html')).toBe(true);

            urlFilter.filter([],[],[],['google.com']);
            expect(urlFilter.shouldFilterWebsiteWithURL('chrome-extension://heagkhocbbgfanpmhakmbffiiolbhfcf/Tornado_Web_nacl.html')).toBe(false);
        });

        describe("web-fragments", function() {
            function getFragment(ID) {
                return {identifier:ID, ostype: "web-fragment"};
            }

            function getNonFragment(ID) {
                return {identifier:ID, ostype: "web"};
            }

            it('no ostype defined works as ostype=web', function() {
                //whitelist
                urlFilter.filter([],[],['example.com'],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example2.com/pizza')).toBe(true);

                //blacklist
                urlFilter.filter([],[],[],['example.com']);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example2.com/pizza')).toBe(false);
            });

            it('ostype web works as expected', function() {
                //whitelist
                urlFilter.filter([],[],[getNonFragment('example.com')],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example2.com/pizza')).toBe(true);

                //blacklist
                urlFilter.filter([],[],[],[getNonFragment('example.com')]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example2.com/pizza')).toBe(false);
            });

            it('test path', function() {
                //whitelist
                urlFilter.filter([],[],[getFragment('example.com/quizzes')],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/quizzes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://www.example.com/quizzes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes/2')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes/answers/2')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/quizzes/answers/2')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/questions/2')).toBe(true);

                //blacklist
                urlFilter.filter([],[],[],[getFragment('example.com/quizzes')]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/quizzes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://www.example.com/quizzes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes/2')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes/answers/2')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/quizzes/answers/2')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/questions/2')).toBe(false);
            });

            it('test path with filename', function() {
                //whitelist
                urlFilter.filter([],[],[getFragment('example.com/recipes/spaghetti.php')],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/recipes/spaghetti.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://www.example.com/recipes/spaghetti.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php?filter=vegan')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/recipes/spaghetti.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/lasagna.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.p')).toBe(true);

                //blacklist
                urlFilter.filter([],[],[],[getFragment('example.com/recipes/spaghetti.php')]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/recipes/spaghetti.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://www.example.com/recipes/spaghetti.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php?filter=vegan')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/recipes/spaghetti.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/lasagna.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.p')).toBe(false);
            });

            it('test domain with trailing slash', function() {
                //whitelist
                urlFilter.filter([],[],[getFragment('example.com/')],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes/answers/2')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php?filter=vegan')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.co')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.gov')).toBe(true);

                //blacklist
                urlFilter.filter([],[],[],[getFragment('example.com/')]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/quizzes/answers/2')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/spaghetti.php?filter=vegan')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.co')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.gov')).toBe(false);
            });

            it('test domain with path and trailing slash', function() {
                //whitelist
                urlFilter.filter([],[],[getFragment('example.com/recipes/')],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/recipes/')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/recipes/')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes#vegan')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes:vegan')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes?filter=vegan&name=lasagna%20bake')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/vegan/spaghetti.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes.and.more/spaghetti.php')).toBe(true);

                //blacklist
                urlFilter.filter([],[],[],[getFragment('example.com/recipes/')]);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://m.example.com/recipes/')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('https://example.com/recipes/')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes#vegan')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes:vegan')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes?filter=vegan&name=lasagna%20bake')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes/vegan/spaghetti.php')).toBe(true);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes.php')).toBe(false);
                expect(urlFilter.shouldFilterWebsiteWithURL('http://example.com/recipes.and.more/spaghetti.php')).toBe(false);
            });
        });

        describe("whitelist - redirects to studentontask", function () {
            beforeEach(function () {
                //already using mocks so...
                chrome.tabs.update = function () {};
                spyOn(chrome.tabs, "update");
                urlFilter.subscribe();
            });
            it("redirects all tabs on plan starting", function () {
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [
                        hostnameForName('google'),
                        hostnameForName('facebook')
                    ],
                    []
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"},
                    {id: 3, url: "https://www.offtask.com/something-off-task"},
                    {id: 4, url: "https://also-off-task.com/something-also-off-task"},
                    {id: 5, url: "https://www.google.com/something-allowed/path/file.html"},
                    {id: 6, url: "https://studentontask.com"}
                ]);
                expect(chrome.tabs.update.calls.length).toEqual(2);
                expect(chrome.tabs.update).toHaveBeenCalledWith(3, {url: "https://studentontask.com"});
                expect(chrome.tabs.update).toHaveBeenCalledWith(4, {url: "https://studentontask.com"});
            });

            it("redirects tab willNavigate", function () {
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [
                        hostnameForName('google'),
                        hostnameForName('facebook')
                    ],
                    []
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"}
                ]);
                var willNavigate = chrome.webNavigation.onCommitted.addListener.calls[0].args[0];
                willNavigate({ tabId: 1, frameId: 0, url: "http://www.offtask.com/something-off-task"});
                var getCallback = chrome.tabs.get.calls[0].args[1];
                getCallback({
                    id: 1,
                    url: "http://www.offtask.com/something-off-task"
                });
                expect(chrome.tabs.update.calls.length).toEqual(1);
                expect(chrome.tabs.update).toHaveBeenCalledWith(1, {url: "https://studentontask.com"});
            });

            it("redirects tab didNavigate", function () {
                //lets imagine willNavigate happens right here and it's slow
                //so it wont be the url on the tab query call...
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [
                        hostnameForName('google'),
                        hostnameForName('facebook')
                    ],
                    []
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"}
                ]);
                var didNavigate = chrome.webNavigation.onCompleted.addListener.calls[0].args[0];
                didNavigate({ tabId: 1, frameId: 0, url: "http://www.offtask.com/something-off-task"});
                var getCallback = chrome.tabs.get.calls[0].args[1];
                getCallback({
                    id: 1,
                    url: "http://www.offtask.com/something-off-task"
                });
                expect(chrome.tabs.update.calls.length).toEqual(1);
                expect(chrome.tabs.update).toHaveBeenCalledWith(1, {url: "https://studentontask.com"});
            });

            it("silently watches the redirects happening to studentontask", function () {
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [
                        hostnameForName('google'),
                        hostnameForName('facebook')
                    ],
                    []
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"}
                ]);
                var willNavigate = chrome.webNavigation.onCommitted.addListener.calls[0].args[0];
                willNavigate({ tabId: 1, frameId: 0, url: "https://studentontask.com"});
                var didNavigate = chrome.webNavigation.onCompleted.addListener.calls[0].args[0];
                didNavigate({ tabId: 1, frameId: 0, url: "https://studentontask.com"});
                expect(chrome.tabs.update.calls.length).toEqual(0);
            });

        });

        describe("blacklist - redirects to studentontask", function () {
            beforeEach(function () {
            });
            it("redirects all tabs on plan starting", function () {
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [],
                    [
                        'offtask.com',
                        'also-off-task.com'
                    ]
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"},
                    {id: 3, url: "https://www.offtask.com/something-off-task"},
                    {id: 4, url: "https://also-off-task.com/something-also-off-task"},
                    {id: 5, url: "https://www.google.com/something-allowed/path/file.html"},
                    {id: 6, url: "https://studentontask.com"}
                ]);
                expect(chrome.tabs.update.calls.length).toEqual(2);
                expect(chrome.tabs.update).toHaveBeenCalledWith(3, {url: "https://studentontask.com"});
                expect(chrome.tabs.update).toHaveBeenCalledWith(4, {url: "https://studentontask.com"});
            });

            it("redirects tab willNavigate", function () {
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [],
                    [
                        'offtask.com',
                        'also-off-task.com'
                    ]
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"}
                ]);
                var willNavigate = chrome.webNavigation.onCommitted.addListener.calls[0].args[0];
                willNavigate({ tabId: 1, frameId: 0, url: "http://www.offtask.com/something-off-task"});
                var getCallback = chrome.tabs.get.calls[0].args[1];
                getCallback({
                    id: 1,
                    url: "http://www.offtask.com/something-off-task"
                });
                expect(chrome.tabs.update.calls.length).toEqual(1);
                expect(chrome.tabs.update).toHaveBeenCalledWith(1, {url: "https://studentontask.com"});
            });

            it("redirects tab didNavigate", function () {
                //lets imagine willNavigate happens right here and it's slow
                //so it wont be the url on the tab query call...
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [],
                    [
                        'offtask.com',
                        'also-off-task.com'
                    ]
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"}
                ]);
                var didNavigate = chrome.webNavigation.onCompleted.addListener.calls[0].args[0];
                didNavigate({ tabId: 1, frameId: 0, url: "http://www.offtask.com/something-off-task"});
                var getCallback = chrome.tabs.get.calls[0].args[1];
                getCallback({
                    id: 1,
                    url: "http://www.offtask.com/something-off-task"
                });
                expect(chrome.tabs.update.calls.length).toEqual(1);
                expect(chrome.tabs.update).toHaveBeenCalledWith(1, {url: "https://studentontask.com"});
            });

            it("silently watches the redirects happening to studentontask", function () {
                urlFilter.filter(
                    ["studentontask.com"],//core url whitelist
                    [],//customer url whitelist (which doesnt currently exist)
                    [],
                    [
                        'offtask.com',
                        'also-off-task.com'
                    ]
                );
                var queryCallback = chrome.tabs.query.calls[0].args[1];
                queryCallback([
                    {id: 1, url: "https://www.facebook.com/something-allowed"},
                    {id: 2, url: "https://www.facebook.com/something-also-allowed"}
                ]);
                var willNavigate = chrome.webNavigation.onCommitted.addListener.calls[0].args[0];
                willNavigate({ tabId: 1, frameId: 0, url: "https://studentontask.com"});
                var didNavigate = chrome.webNavigation.onCompleted.addListener.calls[0].args[0];
                didNavigate({ tabId: 1, frameId: 0, url: "https://studentontask.com"});
                expect(chrome.tabs.update.calls.length).toEqual(0);
            });

            it("never block chrome-search new tab when whitelist applied", function () {
                urlFilter.filter([],[],["ontask.com"],[]);
                expect(urlFilter.shouldFilterWebsiteWithURL('chrome-search://local-ntp/local-ntp.html')).toBe(false);
            });

            it("never block chrome-search new tab when blacklist applied", function () {
                urlFilter.filter([],[],[],["local-ntp"]); 
                expect(urlFilter.shouldFilterWebsiteWithURL('chrome-search://local-ntp/local-ntp.html')).toBe(false);
            });
        });
    });
});
