var spamProtect = require('./spamProtect');
var broadcaster = require('./broadcaster');
var persistence = require('./persistence')();
var imageProcessor = require('./imageProcessor')(persistence, broadcaster);
var imageSearch = require('./imageSearch');
var tsatterServer = require('./tsatterServer.js')({port: 3000}, persistence);
var routes = require('./routes')(persistence, imageSearch, tsatterServer.getApp());
var sockets = require('./sockets')(broadcaster, persistence, imageProcessor, tsatterServer, spamProtect);

