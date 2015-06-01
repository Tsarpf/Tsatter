/**
 *
 * Created by Tsarpf on 6/1/15.
 */


var timerLib = require('./timer');
module.exports = (function() {

    var users = {};
    var initialCooldown = 7.5 * 1000;
    var initialCooldownMultiplier = 2;

    var slowLimit = {
        window: 5 * 1000,
        limit: 6
    };

    var fastLimit = {
        window: 0.5 * 1000,
        limit: 4
    };

    //60 seconds * 60 minutes === hour
    var cooldownResetTimeout = 6 * 60 * 60 * 1000;

    //socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address
    function getIp(socket) {
        return socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    }

    var botThreshold = 100;
    var botMessageLimit = 6;
    function checkBot(user, now) {
        var botList = user.botList;
        botList.push(now);
        if(botList.length < botMessageLimit) {
            return false;
        }

        var firstChange = botList[1] - botList[0];
        for(var i = 2; i < botList.length; i++) {
            var change =  botList[i] - botList[i - 1];
            var changeComparedToFirst = Math.abs(firstChange - change);

            if(changeComparedToFirst > botThreshold) {
                if(botList.length >= botMessageLimit) {
                    botList.shift();
                }
                return false;
            }
        }
        if(botList.length >= botMessageLimit) {
            botList.shift();
        }
        return true;
    }

    function checkTimers(ip) {
        var now = Date.now();
        if(!users[ip]) {
            users[ip] = {
                cooldownEndDate: null,
                slowTimer: timerLib(slowLimit.window, slowLimit.limit),
                fastTimer: timerLib(fastLimit.window, fastLimit.limit),
                multiplier: initialCooldownMultiplier,
                resetDate: null,
                botList: []
            }
        }
        var user = users[ip];

        if(checkBot(user, now)) {
            user.cooldownEndDate = now + cooldownResetTimeout;
            user.resetDate = now + cooldownResetTimeout;
            return {cooldown: user.cooldownEndDate};
        }

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
        else if(user.cooldownEndDate !== null) {
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
        isSpamming: newMessage
    };
}());
