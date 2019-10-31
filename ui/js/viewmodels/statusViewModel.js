define(['amd/lib/knockout','amd/mixins/statusMixin', 'amd/sandbox'], function(ko, Status, Sandbox){
    var StatusViewModel = function() {
        var _this = this,
            sandbox = new Sandbox().init();
        this.loaded = ko.observable(false);
        this.defaultStatuses = [
            new Status({order:1, color: 'green', text: 'I get it', weight:100}),
            new Status({order:2, color: 'yellow', text: 'I\'m not sure', weight:50}),
            new Status({order:3, color: 'red', text: "I don't get it, yet", weight:0}),
            new Status({order:4, color: 'red', text: "This is testing", weight:0})
        ];
        this.conversation_id = false;
        this.isWindow = false;
        this.statusOptions = ko.observableArray(this.defaultStatuses);
        this.selectedStatus = ko.observable(new Status());
        this.request = {};
        this.sendStatus = function(status){
            if (_this.selectedStatus() && _this.selectedStatus().showMask()) {
                _this.selectedStatus().showMask(false);
            }
            
            _this.selectedStatus(status);
            _this.selectedStatus().showMask(true);
            chrome.storage.local.set({status: status});
            setTimeout(function(){
                _this.selectedStatus().showMask(false);
                if(_this.isWindow){
                    window.close();
                }
            }, 500);
            sandbox.publish('statusUpdated', {status: status, conversation_id: _this.conversation_id});
        };
        this.getClassForStatus = function(status){
            if(status.order ===1){
                return 'understand';
            } else if(status.order === 2){
                return 'unsure';
            } else if(status.order === 3){
                return 'dontunderstand';
            } else if(status.order === 4){
                return 'unsure'
            } else {
                return 'unknown';
            }
        };
        this.getFontAwesomeClassForStatus = function(status){
            if(status.order ===1){
                return "fa-check-circle";
            } else if(status.order === 2){
                return "fa-adjust fa-rotate-90";
            } else if(status.order === 3){
                return "fa-times-circle-o";
            } else if(status.order === 4){
                return 'fa-times-circle-o';
            } else {
                return "fa-ellipsis-h";
            }
        };

        chrome.storage.local.get('status',function(status){
            if(status.status){
                _this.selectedStatus(new Status(status.status));
            }
        });
    };

    return StatusViewModel;
});