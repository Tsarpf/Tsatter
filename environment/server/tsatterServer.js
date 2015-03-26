var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    https = require('https'),
    ejs = require('ejs'),
    app = express();


var runServer = function(options) {
    if(!options.port) {
        //throw "Error, no port";
    }
    var port = options.port;
    console.log('port from options: ' + port);

    //mongoose
    var mongooseConn;
    var connect = function() {
        var options = {server: {socketOptions: {keepAlive: 1}}};
        //mongooseConn = mongoose.createConnection("mongodb://localhost/", options);
        if(process.env.TRAVIS) {
            //travis yay
            mongooseConn = mongoose.connect("mongodb://localhost/", options);

        }
        else { 
            //docker yay
            mongooseConn = mongoose.connect("mongodb://db_1/", options);
        }
    };
    connect();
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.on('disconnected', connect);
    mongoose.connection.on('connected', function(){
    });

    var pub = __dirname + '/../public';
    app.use(express.static(pub));
    app.use(bodyParser.urlencoded({extended:true}));

    //Use jade
    //app.set('view engine', 'html');
    app.set('views', __dirname + '/../app/views');
    app.engine('html', require('ejs').renderFile);


    //Always use pretty html.
    app.locals.pretty = true;

    //var httpsServer = https.createServer(credentials, app);
    //httpsServer.listen(443);

    var server = app.listen(port, function() {
        console.log('port: ' + server.address().port);
        console.log(server.address().address);
        console.log("server running..");
    });

    var io = require('socket.io')(server);

    var persistenceHandler = require('./persistence');

    //routes
    require('./routes')(app);

    //everything sockets related
    require('./sockets').initCons(io, persistenceHandler);

    return {app: app, server: server, mongConn: mongooseConn};
    //return {app: app, server: httpsServer, mongConn: mongooseConn};
};

module.exports = function(options) {
    return runServer(options);
}
