var LISTEN_PORT = 8080;

var express = require('express');
var socketIO = require("socket.io");
var app = express();

app.use(express.static('public'));

var server = app.listen(LISTEN_PORT, function () {
  var host = server.address().address;
  var port = server.address().port;
});

var io = socketIO.listen(server);
var member = [];
var currentPage = 1;
var goodNum = 0;
var heeNum = 0;

io.sockets.on("connection", function (socket) {

  socket.on("join", function (d) {
    member.push(d.chatName);
    socket.join(d.roomid);
  });

  socket.on("sendComment", function (d) {
    io.sockets.in("testroom").emit('addComment', {
      name: d.name,
      text: d.text
    });
  });

  /* todo: 退出処理 */

  socket.on("getCurrentPage", function () {
    socket.emit("initPage", currentPage);
  });

  socket.on("onNextPage", function () {
    currentPage = currentPage + 1;
    io.sockets.in("testroom").emit("renderingPage", currentPage);
  });

  socket.on("onPrevPage", function () {
    currentPage = currentPage - 1;
    io.sockets.in("testroom").emit("renderingPage", currentPage);
  });

  socket.on("getGood", function () {
    goodNum += 1;
    io.sockets.in("testroom").emit("addGood", goodNum);
  });

  socket.on("getHee", function () {
    heeNum += 1;
    io.sockets.in("testroom").emit("addHee", heeNum);
  });

  socket.on("init", function () {
    socket.emit("initData", {
      good: goodNum,
      hee: heeNum
    })
  })

});