define([], function(){
    var EnvironmentInformation = function (){

        this.getEnvironmentInformation = function(){
            return '';
        };

        this._getMonitorIsInstalled = function(){
            return '';
        };

        this._getMonitorIsRunning = function(){
            return '';
        };

        this._getMonitorAgentExists = function(){
            return '';
        };

        this._getProductVersion = function(){
            return window.chrome.runtime.getManifest().version;
        };
    };

    return EnvironmentInformation;
});

