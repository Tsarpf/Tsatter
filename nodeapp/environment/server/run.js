var broadcaster = require('./broadcaster');
var imageProcessor = require('./imageProcessor');
var imageSearch = require('./imageSearch');
var persistence = require('./persistence');
var routes = require('./routes');
var sockets = require('./sockets');

var run = require('./server/tsatterServer.js')({port: 3000});
