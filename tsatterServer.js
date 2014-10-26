var express = require('express');
var app = express();

//routes
app.get('/', function (req, res) {
    res.send("Hello world! modified billion yay lsdfgsdfg");
});

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
app.use(express.bodyParser());

var server = app.listen(7247, function() {
    console.log("server running..");
});

module.exports = app;
