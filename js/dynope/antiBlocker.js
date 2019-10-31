var antiBlocker = {
  blocked: true
  
  getBlocked : function() {
    if(antiBlocker.blocked) {
      return antiBlocker.blocked;
    }
  }
  
  setBlocked : function() {
    if(antiBlocker.blocked === false) {
      antiBlocker.blocked === true;
    } 
  }

  setUnblocked : function() {
    if(!antiBlocker.blocked === false) {
      antiBlocker.blocked === false;
    }
  }
}