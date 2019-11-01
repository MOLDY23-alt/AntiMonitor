var antiBlocker = {
  blocked: true
  
  getBlocked : function() {
    if(antiBlocker.blocked) {
      return antiBlocker.blocked;
    }
  },
  
  setBlocked : function() {
    if(antiBlocker.blocked === false) {
      antiBlocker.blocked === true;
      chrome.browserAction.setIcon({
        path: {
            "19": "images/icon19.png",
            "38": "images/icon38.png"
        }
    });
    } 
  },

  setUnblocked : function() {
    if(!antiBlocker.blocked === false) {
      antiBlocker.blocked === false;
      chrome.browserAction.setIcon({
          path: {
              "19": "images/custom_icon19.png",
              "38": "images/custom_icon38.png"
          }
      });
    }
  }
}