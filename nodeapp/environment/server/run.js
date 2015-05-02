var broadcaster = require('./broadcaster');
var persistence = require('./persistence');
var imageProcessor = require('./imageProcessor')(persistence);
var imageSearch = require('./imageSearch');
var tsatterServer = require('./server/tsatterServer.js')({port: 3000}, persistence);
var routes = require('./routes')(persistence, imageSearch, tsatterServer.getApp());
var sockets = require('./sockets')(broadcaster, persistence, iamgeProcessor, tsatterServer);

