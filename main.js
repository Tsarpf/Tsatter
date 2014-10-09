var ws = require("nodejs-websocket");


var count = 0;
var server = ws.createServer(function (conn) {
    count++;
    var user = "anon" + count;
    console.log("new connection");
    broadcast(user + " joined chat");
    conn.sendText(server.connections.length + " total user(s) on this channel");

    conn.on("text", function(str) {
        console.log("received: (" + str + ")");
        broadcast(user + ": " + str);
    });

    conn.on("close", function (code, reason) {
        console.log("connection closed");
    });
    conn.on("error", function(err) {
        console.log("Error: " + err);
        broadcast(user + ": " + error);
    });

    conn.on("close", function () {
        var msg = user + ": closed connection.";
        console.log(msg);
        broadcast(msg);
    });


});
server.listen(8010);

function broadcast(msg) {
    server.connections.forEach(function (conn) {
        conn.sendText(msg);
    });
}
