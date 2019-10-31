define([
    'amd/logger/logger', 'amd/settings','js/globals'
], function(
       Logger, SETTINGS, __globals
){
    var APIClient = function () {

        var _this = this;
        /**
         *
         * @param Fragment
         * @returns {*}
         */
        this.log = function(call, params){
            Logger.debug(call, params);
        };

        this._processFragment = function (Fragment) {

            if (Fragment.indexOf('http') !== -1) {
                return Fragment;
            }

            return this.baseUrl + Fragment;
        };

        this._sendRequest = function ( type, url, addParams, retryOptions, ignoreErr) {
            var settings = {
                    "type": type,
                    "url": url,
                    timeout: 60000,
                },
                dfd = $.Deferred();

            /**
             * Add data or/and another
             * params to request
             */
            if (addParams && typeof addParams === "object") {
                $.each(addParams,function(key, val){
                    settings[key] = val;
                });
            }

            Logger.debug("Attempting Request: " + type + ", " + url);
            var jqxhr = $.ajax(settings);
            if(retryOptions && jqxhr.retry){
                jqxhr = jqxhr.retry(retryOptions);
            }

            jqxhr.done(function(resp){
                Logger.info("Request Successful: " + type + ", " + url + " JSON:", resp);
                dfd.resolve(resp);
            })
            .fail(function(jqXHR, textStatus, errorThrown){
               var json;
                if (jqXHR.responseText) {
                    try {
                        json = JSON.parse(jqXHR.responseText);
                    } catch(e) {
                        json = { error_description: jqXHR.responseText };
                    }
                } else {
                    json = { error_description: "Connection was cancelled" };
                }
                if (json.error_code === 4410) {
                    Logger.info("Request already added semi-Successful: " + type + ", " + url + " JSON:", json);
                    dfd.resolve(json);
                } else {
                    var error = new Error();
                    error.name = 'Satellite AddFrame Error';
                    error.message = json.error_description;
                    if(ignoreErr){
                        $.trigger(SETTINGS.EVENTS.FATAL_ERROR, error);
                    }
                    Logger.error("Request Failure: " + type + ", " + url + " failed ", json);
                    dfd.reject(json);
                }
            });
            return dfd;
        };

        this._TYPES = {
            GET: "GET",
            POST: "POST",
            PUT: "PUT",
            DELETE: "DELETE"
        };

        this.baseUrl = '';

        this.get = function (Fragment, addParams, retryOptions, ignoreErr) {
            var url = this._processFragment(Fragment),
                promise = this._sendRequest(this._TYPES.GET, url, addParams, retryOptions, ignoreErr);

            return promise;
        };

        this.post = function (Fragment, addParams, retryOptions, ignoreErr) {
            var url = this._processFragment(Fragment),
                promise = this._sendRequest(this._TYPES.POST, url, addParams, retryOptions, ignoreErr);

            return promise;
        };

        this.put = function (Fragment, addParams, retryOptions, ignoreErr) {
            var url = this._processFragment(Fragment),
                promise = this._sendRequest(this._TYPES.PUT, url, addParams, retryOptions, ignoreErr);

            return promise;
        };

        this.delete = function (Fragment, retryOptions, ignoreErr) {
            var url = this._processFragment(Fragment),
                promise = this._sendRequest(this._TYPES.DELETE, url, false, retryOptions, ignoreErr);

            return promise;
        };


        this._shouldTearDown = function(url){
            //only tear down if the request was made to our server.
            var teardown = false;
            SETTINGS.HOSTNAMES.forEach(function(u){
                if(url.indexOf(u) !== -1){
                    teardown = true;
                }
            });
            return teardown;
        };
    };

    return APIClient;
});
