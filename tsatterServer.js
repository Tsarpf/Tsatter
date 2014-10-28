var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    app = express();


//mongoose
var connect = function() {
    var options = {server: {socketOptions: {keepAlive: 1}}};
    mongoose.connect("mongodb://localhost/", options);
};
connect();
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.on('disconnected', connect);
mongoose.connection.on('connected', function(){
    console.log("(re)connected to database.");
});


var pub = __dirname + '/public';
app.use(express.static(pub));
app.use(bodyParser.urlencoded({extended:true}));

//Use jade
app.set('view engine', 'jade');
app.set('views', __dirname + '/app/views');

var server = app.listen(7547, function() {
    console.log("server running..");
});

var io = require('socket.io')(server);


//routes
app.get('/', function (req, res) {
    res.render('index');
});

app.get('/partials/:name', function(req, res){
    var name = req.params.name;
    res.render('partials/' + name);
});

var channels = {
    
}

var isOnChannel = function(user, channel) {

}
var joinChannel = function(user, channel) {
    //if(
}
var leaveChannel = function(user, channel) {
}

var count = 0;
io.on('connection', function(socket) {
    count++;
    var user = 'anon' + count;
    socket.emit('hello', {property: 'value'});
    socket.on('join', function(data) {
        if(data.room) {
            try {
                joinChannel(user, data.room);
            }
            catch(err){
                console.log(err);
            }
        }
    });
    socket.on('leave', function(data) {
        if(data.room) {
            try {
                socket.leave(data.room);
            }
            catch(err){
                console.log(err);
            }
        }
    });
    socket.on('message', function(data) {
        //TODO: implement checking if allowed

    });
    
});



module.exports = app;
