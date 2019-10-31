define(['amd/cabra/session', 'amd/settings', 'amd/logger/logger', 'amd/cabra/helper/thumbnail'], function(CabraSession, SETTINGS, Logger, Thumbnail){
    var ThumbnailCabraSession = function () {

        this.thumbnail = null;
        this.Thumbnail = Thumbnail;

        this.init = function (name, cabraId, rules, satelliteAPIClient, instance) {
            this.thumbnail = new this.Thumbnail().init();
            return ThumbnailCabraSession.prototype.init.apply(this, arguments);
        };

        this.willLeaveCabra = function () {
            Logger.debug("Thumbnail Stopping");
            this.thumbnail.stop();
            
            ThumbnailCabraSession.prototype.willLeaveCabra.apply(this, arguments);
        };

        this.applyFromState = function (frame) {
            ThumbnailCabraSession.prototype.applyFromState.apply(this, arguments);
            
            this._updateThumbnail(frame);
        };

        this.applyFromRealtime = function (evt, data) {
            ThumbnailCabraSession.prototype.applyFromRealtime.apply(this, arguments);

            var frame = this._getFrame(data);
            this._updateThumbnail(frame);
        };

        this._updateThumbnail = function ( frame ){
            Logger.debug("Updating Thumbnail");
            if ( !(frame && typeof frame === "object" && frame.payload &&
                typeof frame.payload === "object") ) {
                throw new SystemError("Not valid payload !");
            }

            var payload = frame.payload,
                rule = this.rules.filter(function(rule){
                    return rule.to === SETTINGS.DYDEV.RULE_TO_CONST;
                })[0],
                promise;

            if ( !(rule && typeof rule === "object")) {
                throw new SystemError("Not valid rule !");
            }

            if ( !payload.url ) {
                Logger.debug("Payload doesn't have url to upload result of thumbnail cabra");
                return false;
            }

            if ( !frame.conversation_id ) {
                Logger.debug("Frame must be with conversation id !", frame);
                return false;
            }

            var _this = this;
            promise = new Promise(function(resolve, reject){
                _this.thumbnail.withScale(payload.scale, payload.request_fullscreen).then(function (obj) {
                    Logger.debug("Captured Thumbnail", obj);
                    _this._client.thumbnailResponse(payload.url, obj.blob, SETTINGS.THUMBNAIL.MIMETYPE).done(function (data, textStatus, jqXHR) {
                        resolve(obj.source);
                    }).fail(function (data, textStatus, errorThrown) {
                        /**
                         * Thumbnail response isn't valid
                         * We should check status of response
                         */
                        if ( data.status === 200 ){
                            Logger.debug("Thumbnail was uploaded !");
                            resolve();
                            return;
                        }
                        reject({ "message" : errorThrown });
                        throw new SystemError("Error in upload thumbnail request. Error description - " + errorThrown);
                    });
                }, function (obj) {
                    if(obj.source === SETTINGS.THUMBNAIL.SOURCE.UNAVAILABLE){
                        Logger.debug("Thumbnail not available, resolving with unavailable as source");
                        //there is no thumbnail to upload to aws so resolve with the source and get out.
                        resolve(obj.source);
                        return;
                    } else {
                        reject({ "message": obj.message });
                        Logger.error(obj.message, obj.stack);
                    }
                });
            });


            promise.then(function(source){
                _this._addCabraFrame(rule, frame.conversation_id, source);
            }, function () {
                _this._addCabraFrame(rule, frame.conversation_id);
            });
        };


        this._addCabraFrame = function (rule, conversationId, source) {
            this._client.addCabraFrame(this.cabraId, rule, conversationId, {source: source }).done(function (data, textStatus, jqXHR) {
                Logger.debug("Thumbnail frame was uploaded !");
                Logger.debug("Thumbnail Data", data);

            }).fail(function (data, textStatus, errorThrown) {
                throw new SystemError("Error in upload addCabraFrame request. Error description - " + errorThrown);
            });
        };
    };

    extend(ThumbnailCabraSession, CabraSession);

    return ThumbnailCabraSession;
});