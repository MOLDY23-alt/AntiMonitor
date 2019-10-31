define([
    'amd/cabra/thumbnailSession', 'amd/logger/logger', 'amd/sandbox', 
    'jquery'
], function(
       ThumbnailCabra, Logger, Sandbox, 
        $
) {
    describe('ThumbnailCabra', function () {
        var thumbnailSession;
        
        var constants = {
            payloads : {
            }
        };
        var conversationid1 = "11111111-1111-1111-1111-111111111111";
        var conversationid2 = "22222222-2222-2222-2222-222222222222";
        
        beforeEach(function () {
            window.sandbox._reset();
            spyOn(sandbox, "publish");//need to avoid chrome runtime here
            thumbnailSession = new ThumbnailCabra();
            thumbnailSession.Thumbnail = function (){ return { init: function(){ return this;}, withScale: $.noop };};
            thumbnailSession.init("dyknow.me/screen_shot", 15, [], {addCabraFrame:$.noop, enterCabra: $.noop, thumbnailResponse: $.noop});
            thumbnailSession.rules = [{to: "broadcaster"}];
            spyOn(thumbnailSession.thumbnail, "withScale").andReturn($.Deferred());
            spyOn(thumbnailSession._client, "addCabraFrame").andReturn($.Deferred());
            spyOn(thumbnailSession._client, "thumbnailResponse").andReturn($.Deferred().resolve());
            
            Logger.debug = $.noop;
            Logger.info = $.noop;
            Logger.warn = $.noop;
            Logger.error = $.noop;
        });

        it("passes on scale and empty request_fullscreen to withScale", function() {
            thumbnailSession.applyFromRealtime({}, {
                broadcastObject: {
                    payload: {
                        conversation_id: conversationid1,
                        payload: {
                            scale: 3,
                            url: "https://localhost/mockthis"
                        }
                    }
                }
            });
            expect(thumbnailSession.thumbnail.withScale).toHaveBeenCalledWith(3, undefined);
        });
        
        it("passes on scale and request_fullscreen to withScale", function() {
            thumbnailSession.applyFromRealtime({}, {
                broadcastObject: {
                    payload: {
                        conversation_id: conversationid1,
                        payload: {
                            scale: 3,
                            request_fullscreen: true,
                            url: "https://localhost/mockthis"
                        }
                    }
                }
            });
            expect(thumbnailSession.thumbnail.withScale).toHaveBeenCalledWith(3, true);
        });
    });
});