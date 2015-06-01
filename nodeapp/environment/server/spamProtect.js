/**
 *
 * Created by Tsarpf on 6/1/15.
 */


var timerLib = require('./timer');
module.exports = (function() {

    var users = {};
    var initialCooldown = 15 * 1000;
    var initialCooldownMultiplier = 2;

    var slowLimit = {
        window: 5 * 1000,
        limit: 6
    };

    var fastLimit = {
        window: 0.5 * 1000,
        limit: 3
    };

    //60 seconds * 60 minutes === hour
    var cooldownResetTimeout = 6 * 60 * 60 * 1000;

    //socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address
    function getIp(socket) {
        return socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    }

    function checkTimers(ip) {
        var now = Date.now();
        if(!users[ip]) {
            users[ip] = {
                cooldownEndDate: null,
                slowTimer: timerLib(slowLimit.window, slowLimit.limit),
                fastTimer: timerLib(fastLimit.window, fastLimit.limit),
                multiplier: initialCooldownMultiplier,
                resetDate: null
            }
        }
        var user = users[ip];

        if(user.resetDate !== null) {
            if(now > user.resetDate) {
                user.multiplier = initialCooldownMultiplier;
                user.resetDate = null;
            }
        }

        if(user.cooldownEndDate !== null) {
            if(now > user.cooldownEndDate) {
                user.cooldownEndDate = null;
            }
        }

        if(!user.slowTimer.hit() || !user.fastTimer.hit()) {
            var addition = initialCooldown * user.multiplier;

            //lets not have ridiculously long bans
            var maxBanReached = false;
            if(addition > now) {
                maxBanReached = true;
            }

            if(!maxBanReached) {
                user.multiplier *= 2;
                if(user.cooldownEndDate === null) {
                    user.cooldownEndDate = now + addition;
                }
                else {
                    user.cooldownEndDate += addition;
                }

                if(user.resetDate === null) {
                    user.resetDate = now + cooldownResetTimeout + addition;
                }
                else {
                    user.resetDate += addition;
                }
            }
            return {cooldown: user.cooldownEndDate};
        }
        else {
            return null;
        }
    }

    function newMessage(socket) {
        var ip = getIp(socket);
        return checkTimers(ip);
    }

    return {
        isAllowed: newMessage
    };
}());
