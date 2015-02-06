/*
 *
 * Mostly thanks to 
 *
 *
 * https://github.com/jfromaniello/passport.socketio/blob/master/test/fixture/setSocketIOHandshakeCookies.js 
 *
 * for this thing
 */
var xmlhttprequest = require('xmlhttprequest');
var originalRequest = xmlhttprequest.XMLHttpRequest;

module.exports = function (jar, url) {
  xmlhttprequest.XMLHttpRequest = function(){
    originalRequest.apply(this, arguments);
    this.setDisableHeaderCheck(true);
    
    var stdOpen = this.open;

    this.open = function() {
      stdOpen.apply(this, arguments);
      var header = jar.get({ url: url })
        .map(function (c) {
          return c.name + "=" + c.value;
        }).join("; ");
      this.setRequestHeader('cookie', header);
    };
  };
};
