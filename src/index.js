var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var PORT = process.env.PORT || process.env.NODE_PORT || 3000;

app.listen(PORT);

//Overall object to show maintained by the server
/**Clients will have their own local objects, but the one on the server will be 
   assumed to be the master object. This is the correct up to date one. All others are just synced
   from this one. **/
//Our square object will have a last updated time (so the client know to use the latest if they receive multiple)
//Our square will also have an x/y position and height/width
var square = {
    x: 0,
    y: 0,
    height: 100,
    width: 100,
	color: "red",
};

//Our HTTP server handler. Remember with an HTTP server, we always receive the request and response objects
function handler (req, res) {
  //read our file ASYNCHRONOUSLY from the file system. This is much lower performance, but allows us to reload the page
  //changes during development. 
  //First parameter is the file to read, second is the callback to run when it's read ASYNCHRONOUSLY
  fs.readFile(__dirname + '/../client/index.html', function (err, data) {
    //if err, throw it for now
    if (err) {
      throw err;
    }

    //otherwise write a 200 code and send the page back
    //Notice this is slightly different from what we have done in the past. There is no reason for this, just to keep it simple.
    //There are multiple ways to send things in Node's HTTP server module. The documentation will show the optional parameters. 
    res.writeHead(200);
    res.end(data);
  });
}

/** Now we need to code our web sockets server. We are using the socket.io module to help with this. 
    This server is a SEPARATE server from our HTTP server. They are TWO DIFFERENT SERVERS. 
    That said, socket.io allows us to embed our websockets server INSIDE of our HTTP server. That will allow us to
    host the socket.io libraries on the client side as well as handle the websocket port automatically. 
**/
//When new connections occur on our socket.io server (we receive the new connection as a socket in the parameters)
io.on('connection', function (socket) {

  //join that socket to a hard-coded room. Remember rooms are just a collection of sockets. A socket can be in none, one or many rooms. 
  //A room's name is just a string identifier. It can be anything you make. If the room exists when you add someone, it adds them to the room.
  //If the room does not exist when you add someone, it creates the room and adds them to it. 
  socket.join('room1');

  //When we receive a 'movementUpdate' message from this client
  //The messages are also just strings. They can be anything you write (or one of the few hard-coded built-in ones)
  //"movementUpdate" is one that we have made up right now to handle updates in movement.
  //The "data" is what data we have received from the client. This is usually unpacked as json. It can also be arrays, binary, strings and more.
  socket.on('draw', function(data) {
    //update our square's x and y positions from the data sent in from the client.
		
	square = data;
	
    //Remember io.sockets.in sends a message to EVERYONE in the room vs broadcast which sends to everyone EXCEPT this user.
	socket.broadcast.to('room1').emit('updatedSquares', square);

  });
  
  //When the user disconnects, remove them from the room (since they are no longer here)
  //The socket is maintained for a bit in case they reconnect, but we do want to remove them from the room
  //Since they are currently disconnected.
  socket.on('disconnect', function(data) {
    socket.leave('room1');
  });
});

console.log("listening on port " + PORT);