/** * * Created by Tsarpf on 2/17/15.
 */

/**
  Ordered list with moving an element to the head of the list in O(1)
     */

var map = {};
var head = null;

var updateList = function(channel) {

    if(!head) {
        //is the first element in list so it's head
        head = {
            name: channel,
            next: null,
            prev: null
        };
        map[channel] = head;
        return;
    }

    if(head.name === channel) {
        return; //was already first in list
    }


    if(!map.hasOwnProperty(channel)) {
        //new element
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
        //element already in the list
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

var getTop = function(count) {
    var arr = [];
    var curr = head;
    var i = 0;
    while(i < count && curr !== null) {
        arr.push(curr.name);
        curr = curr.next;
        i++;
    }
    return arr;
};

module.exports = {
    updateList: updateList,
    getTop: getTop
};

