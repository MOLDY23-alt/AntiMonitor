define([], function(){

    if(!window.chrome.windows) {
        window.chrome.windows = jasmine.createSpyObj('window.chrome.windows', ['create', 'remove', 'getLastFocused', 'get', 'getCurrent']);
        window.chrome.windows.onFocusChanged = jasmine.createSpyObj('window.chrome.windows.onFocusChanged', ['addListener']);
    }

    return window.chrome.windows;
});
