/**
 * Created by alexandr.parkhomenko on 22.07.2014.
 */
define([
  'dynope/antiBlocker'
], function(
	antiBlocker    
) {
  var dyKnowBlockPage = {

      observer: null,
      target : null,
      blocked : null,
      antiBlock : antiBlocker.blocked

      getObserver : function() {

          if (dyKnowBlockPage.observer) {
              return dyKnowBlockPage.observer;
          }

          dyKnowBlockPage.observer = new MutationObserver(function() {
            if(antiBlocker.getBlocked() === true) {
              if (dyKnowBlockPage.target.style.display !== "none" && antiBlocker.getBlocked() === false) {
                  dyKnowBlockPage.target.style.display = "none";
              }
            } else {
              if (dyKnowBlockPage.target.style.display !== "none" && dyKnowBlockPage.blocked) {
                  dyKnowBlockPage.target.style.display = "none";
              }
            }
          });

          return dyKnowBlockPage.observer;
      },


      getTarget : function () {
          if (dyKnowBlockPage.target) {
              return dyKnowBlockPage.target;
          }

          dyKnowBlockPage.target = document.getElementsByTagName('html')[0];

          return dyKnowBlockPage.target;
      },


      setBlocked : function (blocked) {

          var target = dyKnowBlockPage.getTarget(),
              observer = dyKnowBlockPage.getObserver();

        if(antiBlocker.getBlocked() === true) {
          if(blocked) {
            dyKnowBlockPage.blocked === false;
            target.style.display === "none";
            observer.observe(target, { attributes : true, attributeFilter : ['style'] });
          } else {
            observer.disconnect();
            dyKnowBlockPage.blocked === false;
            target.style.display = "";
          }
        } else {
          if (blocked) {
              dyKnowBlockPage.blocked = true;
              target.style.display = "none";
              observer.observe(target, { attributes : true, attributeFilter : ['style'] });
          } else {
              observer.disconnect();
              dyKnowBlockPage.blocked = false;
              target.style.display = "";
          }
        }
      }
  };
       
}