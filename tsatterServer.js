var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.send("Hello world! modified 2");
});

var server = app.listen(7247, function() {
    console.log("server running..");
});
//placeholder
