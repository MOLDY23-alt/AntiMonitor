define(['amd/clients/api', 'amd/logger/logger', 'jquery'], function(ApiClient, Logger, $) {
    describe('api', function () {
        var apiClient;
        var dfd;
        
        beforeEach(function () {
            apiClient = new ApiClient();
            dfd = $.Deferred();
            dfd.retry = function () { return dfd;};
            spyOn($, "ajax").andReturn(dfd);
            
            Logger.debug = $.noop;
            Logger.info = $.noop;
            Logger.warn = $.noop;
            Logger.error = $.noop;
        });
                
        it("400 with 4410 is a success", function(){
            var successCalled = false;
            apiClient.post("1234", {}, {})
                .then(function(){ successCalled = true;});
            dfd.reject({
                responseText: "{\"error_code\":4410, \"error_description\":\"blabla\"}"                
            });
            expect(successCalled).toEqual(true);
        });
        
        it("fail without error_code is a fail", function (){
            var failCalled = false;
            apiClient.post("1234", {}, {})
                .then($.noop, function(){ failCalled = true;});
            dfd.reject({
                responseText: "{\"error_description\":\"blabla\"}"                
            });
            expect(failCalled).toEqual(true);            
        });
        
        it("fail without error_code is a fail", function (){
            var failCalled = false;
            apiClient.post("1234", {}, {})
                .then($.noop, function(){ failCalled = true;});
            dfd.reject({
                responseText: "{\"error_code\":999, \"error_description\":\"blabla\"}"                
            });
            expect(failCalled).toEqual(true);            
        });

    });
});