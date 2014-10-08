
    
var ws;
var initConnect = function(){
    ws = new WebSocket("ws://datisbox.net:8010/");
    ws.onopen = function() {
        //ws.send("Test msg");
    }
    ws.onmessage = function(evt) {
        console.log("got data: " + evt.data);
        receiveMsg(evt.data);
    }
}

var sendMsg = function(msg) {
    ws.send(msg);
}

var count = 0;
var receiveMsg = function(msg) {
    count++;
    console.log(msg);
    var line = document.createElement("div");

    msg = cleanHTML(msg);


    //line.innerHTML = msg;
    line.setAttribute("class", "lines");
    var lineName = "line" + count.toString();
    //line.setAttribute("id", lineName);
    
    line.id =  lineName;

    var images = getImages(msg);
    var imgdiv = getImageDiv(images);


    var linetext = document.createElement("div");
    var text = replaceImageURLs(msg, images);
    linetext.innerHTML = replaceImageURLs(msg, images);

    line.appendChild(linetext);
    if(imgdiv !== null)
        line.appendChild(imgdiv);

    var chatbox = document.getElementById("chatbox");
    chatbox.appendChild(line);
    chatbox.scrollTop = chatbox.scrollHeight;
}

var replaceLinks = function(msg) {
}

var replaceImageURLs = function(msg, images) {
    if(images === null) return msg;
    for(var i = 0; i < images.length; i++)
    {
        msg = msg.replace(images[i], "["+i+"]");
        //return msg.replace(new RegExp(images[i], 'g'), "["+i+"]");
    }
    return msg;
}

//Oh god please refactor this function
var getImageDiv = function(images) {
    if(images === null) return null;

    var div = document.createElement("div");
    for(var i = 0; i < images.length; i++) {
        var img = document.createElement("img");
        img.setAttribute("src", images[i]);
        img.setAttribute("class", "chatimages");
        div.appendChild(document.createTextNode("["+i+"]"));
        div.appendChild(img);
    }
    return div;
}
var getImages = function(msg) {
    return msg.match(imgRegex);;
}

var stringInsert = function(target, index, str) {
    if(index > 0)
    {
        return target.substring(0, index) + str + target.substring(index, str.length);
    }
    else
    {
        return str + target;
    }
}

var regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
var imgRegex = new RegExp("https?://(?:[a-z\-]+\.)+[a-z]{2,6}(?:/[^/#?]+)+\.(?:jpg|gif|png)", "gi");
var getURL = function(msg) {
    return regex.search(msg);
}

var getImgURL = function(msg) {
    return imgRegex.search(msg);
}

var cleanHTML = function(htmldes) {
    return htmldes.replace(/[<>&\n]/g, function(x) {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
           '\n': '<br />'
        }[x];
    });
}
