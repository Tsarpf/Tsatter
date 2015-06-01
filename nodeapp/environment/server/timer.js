/**
 * Created by root on 6/1/15.
 */

module.exports = (function(){
   var window, limit;
   var hits = [];
   function newHit() {
      var i = 0;
      var now = Date.now();
      hits.push(now);
      while(i < hits.length) {
         var date = hits[i];
         if(now - window > date) {
            hits.splice(i, 1);
            continue; //Continue from same index
         }
         i++;
         if(i >= limit) {
            hits = [];
            return false;
         }
      }

      return true;
   }
   return function(win, lim) {
      window = win;
      limit = lim;

      if(window < 50) {
         throw new Error('Window in milliseconds, please!');
      }
      return {
        hit: newHit
      };
   }
}());