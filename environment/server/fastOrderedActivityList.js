/** * * Created by Tsarpf on 2/17/15.
 */

var map = {};
var head = null;


var updateList = function(channel) {

    if(head.name === channel) {
        return; //was already first in list
    }

    if(!head) {
        //is the first element in list so it's head
        head = {
            name: channel,
            next: null,
            prev: null
        };
        return;
    }

    if(!map.hasOwnProperty(channel)) {
        var obj = {
            name: channel,
            next: head,
            prev: null
        };

        head.prev = obj;
        head = obj;
        map[channel] = obj;
    }
    else {
        var ref = map[channel];

        if(ref.prev) {
            ref.prev.next = ref.next;
        }

        if(ref.next) {
            ref.next.prev = ref.prev;
        }

        head.prev = ref;
        ref.next = head;
        ref.prev = null;

        head = ref;

    }
};

