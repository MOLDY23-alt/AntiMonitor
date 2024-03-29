/*
    This is the actions file for the popup menu on the extension
    we need to make the toggleable function for the slider option
*/

require.config({
    paths: {
        amd: "/js/amd",
        viewmodels: "/ui/js/viewmodels",
        cabras: "/ui/js/cabras"
    }
});

define(['amd/lib/knockout', 'viewmodels/browserActionViewModel', 'amd/sandbox', 'amd/logger/logger', 'amd/broadcast/broadcastSession.events', 'amd/cabra/cabraSession.events', 'amd/mixins/statusMixin'], function(ko, BA, Sandbox, Logger, broadcastEvents, cabraEvents, Status){
    var mBA = new BA(),
        sandbox = new Sandbox().init();

    sandbox.subscribe(broadcastEvents.BroadcastSessionDidAttachEvent, function(data) {
        Logger.info("UI: Browser Action Did Attach Broadcast", data);
    });
    
    sandbox.subscribe(broadcastEvents.BroadcastSessionDidDetachEvent, function(data) {
        Logger.info("UI: Browser Action Did Detach Broadcast", data);
    });
    
    sandbox.subscribe(cabraEvents.CabraSessionDidEnterEvent, function(data) {
        Logger.info("UI: Browser Action Did Enter Feature", data);
    });
    
    sandbox.subscribe(cabraEvents.CabraSessionDidLeaveEvent, function(data) {
        Logger.info("UI: Browser Action Did Leave Feature", data);
    });
    
    sandbox.subscribe('statusUpdateDifferentDevice', function(data){
        Logger.info("UI: Browser Action Status Update was receieved", data);
        mBA.statusViewModel.selectedStatus(new Status(data));
    });

    mBA.statusViewModel.loaded(true);

    ko.applyBindings(mBA, document.getElementById('browseractions'));

});