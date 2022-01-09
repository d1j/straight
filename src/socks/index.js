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

      //TODO: probably sketchy. Research and refine
      socket.customProps = {};

      if (typeof data.lobbyID != "undefined") {
        socket.customProps.lobbyID = data.lobbyID;
      }

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

    /** Should be called to join the lobby. */
    socket.on("join-lobby", async () => {
      lobSock.joinLobby({ io, socket });
    });

    /** Should be called to leave the lobby. */
    socket.on("leave-lobby", async () => {
      lobSock.leaveLobby({ io, socket });
    });

    /** Should be called after host has started the game and client has prepared the front-end to start the game. */
    socket.on("ready-to-start-game", async () => {
      lobSock.readyToStartGame({ io, socket });
    });

    /** Sould be called when host wants to start the game. */
    socket.on("host-starts-game", async () => {
      lobSock.hostStartsGame({ io, socket });
    });

    /** Default disconnect listener. */
    socket.on("disconnect", async () => {
      lobSock.disconnect({ io, socket });
    });

    /** Should be called when user wants to send a message to the whole lobby. */
    socket.on("message", async (message) => {
      lobSock.message({ io, socket, message });
    });

    /** Should be called when making a new call in the game. */
    socket.on("call", async (data) => {
      gameSock.call({ io, socket, data });
    });

    /** Should be called when checking the current call in the game. */
    socket.on("check", async () => {
      gameSock.check({ io, socket });
    });
  });

  console.log("Socket.io listener initialized.");
};
