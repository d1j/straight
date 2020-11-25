const socketio = require("socket.io");

const cache = require("../util/cache");
const tools = require("../util/tools");
const dbAuth = require("../db/manage-account");

const lobSock = require("./lobby");
const gameSock = require("./game");

module.exports.init = (http) => {
  io = socketio(http);

  //middleware for query data extraction

  io.use(async (socket, next) => {
    try {
      let data, userID;

      data = socket.handshake.query;

      if (typeof data.token == "undefined") {
        throw "No token is present. Unauthorized.";
      } else {
        userID = await dbAuth.isTokenValid(data.token);
      }

      socket.customProps = {};

      if (typeof data.lobbyID != "undefined") {
        //TODO: probably sketchy. Research and refine
        socket.customProps.lobbyID = data.lobbyID;
      }

      //TODO: probably sketchy. Research and refine
      socket.customProps.userID = userID;
      next();
    } catch (err) {
      console.log(err);
      next(err);
    }
  });

  io.on("connection", async (socket) => {
    try {
      cache.addUserSocketPair(socket.customProps.userID, socket.id);
      tools.logSocks(
        socket.id,
        "connection",
        `User ${socket.customProps.userID} connected`
      );
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit(
        "UNA",
        "Failed to connect to the server. Reason: Unauthorized."
      );
      socket.disconnect(0);
    }

    socket.on("join-lobby", async () => {
      lobSock.joinLobby({ io, socket });
    });

    socket.on("leave-lobby", async () => {
      lobSock.leaveLobby({ io, socket });
    });

    socket.on("ready-to-start-game", async () => {
      lobSock.readyToStartGame({ io, socket });
    });

    socket.on("host-starts-game", async () => {
      lobSock.hostStartsGame({ io, socket });
    });

    socket.on("disconnect", async () => {
      lobSock.disconnect({ io, socket });
    });

    socket.on("message", async (message) => {
      lobSock.message({ io, socket, message });
    });

    socket.on("call", async (data) => {
      gameSock.call({ io, socket, data });
    });

    socket.on("check", async () => {
      gameSock.check({ io, socket });
    });
  });

  console.log("Socket.io listener initialized.");
};
