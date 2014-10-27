var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    app = express(),
    io = require('socket.io')(app);


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


//routes
app.get('/', function (req, res) {
    res.render('index');
});

app.get('partials/:name', functon(req, reqs){
    var name = req.params.name;
    res.render('partials/' + name);
});

io.on('connection', function(socket) .{
    socket.emit('hello', {property: 'value'});
    socket.on('some event', function(data) {
        console.log(data);
    });
});


module.exports = app;
