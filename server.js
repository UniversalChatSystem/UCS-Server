var config         = require("./config.json"),
    https          = require("https");
    port           = config["server"]["port"],
    serverUsername = config["server"]["username"],
    WebSocket      = require('ws'),
    ws             = require('ws').Server,
    timestamp      = require('time-stamp'),
    fs             = require('fs');

const chalk = require('chalk');

/////////////////////////////////////////////////////////////////////

var log = function(message, data){
	var TimeStamp = timestamp('[HH:mm:ss]');
  	var format = chalk.cyan(TimeStamp + " " + chalk.white(message));
  	if(data){
  		console.log(format, data);
  		return;
  	}
  	console.log(format);
  	return;
}

var options = {
  key: fs.readFileSync('./certs/u-c-s.gq.key'),
  cert: fs.readFileSync('./certs/u-c-s.gq.pem')
};

var a = https.createServer(options, function (req, res) {
  res.writeHead(200);
  res.end("hello world\n");
}).listen(port);

log("Server Connection Established. Listening on port %s", port);

var wss = new ws({
  server: a
});

wss.on('connection', function(socket) {
	socket.id = connection.getId();
	log("Client Connection Established. ID("+socket.id+")");

    socket.on('message', function(message) {
    	var data = JSON.parse(message);
    	if(data["command"] == "sendMessage"){
    		connection.sendMessage(data.data["sender"], data.data["message"]);
    		if(socket.username == null) socket.username = data.data["sender"];
        log(data.data["sender"] + ": " + data.data["message"]);
    	}else if(data["command"] == "username"){
    		socket.username = data.data["sender"];
    	}
      //log('r: %s', message);
    });

    socket.on("close", function(){
    	log("The client "+(socket.username != null ? socket.username : "")+"#"+socket.id+" has left!");
      	connection.sendLeaveMessage((socket.username != null ? socket.username : "")+"#"+socket.id);
    });
});

var connection = {
  sendMessage: function(sender, message){
    wss.all.sendJson({command: "broadcast", data: {sender: sender, message: message}});
  },
  sendLeaveMessage: function(user){
    this.sendMessage(serverUsername, "The client "+user+" has left.");
  },
  getId: function(){
    minmax = [10000, 99999];
    min = Math.ceil(minmax[0]);
    max = Math.floor(minmax[1]);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
}

wss.all = {
	send: function(data){
	  	wss.clients.forEach(function(client) {
		    if(client.readyState === WebSocket.OPEN) {
		      	client.send(data);
		    }
		});
	},
	sendJson: function(data){
		wss.clients.forEach(function(client) {
		    if(client.readyState === WebSocket.OPEN) {
		      	client.send(JSON.stringify(data));
		    }
		});
	}
};
