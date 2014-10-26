var exec = require('child_process').exec;
var fs = require('fs');
var express = require('express'),
    app = express();


app.post('/', function(request, response){
    console.log("request");
    console.log(request);
    console.log("response");
    console.log(response);
    console.log("got new commit or rebooted");
    response.send("terveterveterve");
    exec("./pullAndDeploy", null);
    //fs.writeFile("./test.log", request.body, function(err) {
    //    if(err){
    //        console.log(err);
    //    } else {
    //        console.log("Save'd");
    //    }
    //});
});

app.listen(7248);

