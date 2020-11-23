const cookie = require("cookie");

const db = require("../db/_temp_main");
const cache = require("../util/cache");
const tools = require("../util/tools");

const __dev = Boolean(process.env.DEV_MODE);

async function getUserInfo(socket) {
  try {
    let info;

    if (__dev) {
      info = socket.handshake.query;
    } else {
      info = cookie.parse(socket.handshake.headers.cookie);
    }

    let userID;

    if (typeof info.token == "undefined") {
      throw "No token is present. Unauthorized.";
    } else {
      userID = await db.isTokenValid(info.token);
    }

    if (typeof info.lobby != "undefined") {
      return { userID, lobbyID: info.lobby };
    }

    return { userID };
  } catch (err) {
    throw err;
  }
}

module.exports.init = (http) => {
  const io = require("socket.io")(http);

  console.log("Socket.io listener initialized.");

  io.on("connection", async function (socket) {
    //TODO: Setting this while in developement. Probably should be removed in prod.
    io.set("origins", "*:*");

    async function checkIfAllUsersJoinedGame(lobbyID) {
      console.log("Check if all users have joined the game.");
      //TODO: if all players joined, remove the cache entry if the lobby status is "started".
      //In case the status is "waiting", kick the players we are waiting for and force start the game.
      try {
      } catch (err) {
        console.log(err);
      }
    }

    try {
      let { userID } = await getUserInfo(socket);
      cache.addUserSocketPair(userID, socket.id);
      tools.logSocks(socket.id, "connection", `User ${userID} connected`);
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit(
        "UNA",
        "Failed to connect to the server. Reason: Unauthorized."
      );
      socket.disconnect(0);
    }

    socket.on("join-lobby", async () => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(
          socket.id,
          "join-lobby",
          `User ${userID} joined the lobby ${lobbyID}`
        );
        //NOTE: useless emit if there is no one in lobby.
        socket
          .in(lobbyID)
          .emit(
            "new-player-in-lobby",
            await db.joinLobbyWithSocks(lobbyID, userID, socket.id)
          );
        socket.join(lobbyID);
        io.to(socket.id).emit("joined-lobby");
      } catch (err) {
        console.log(
          "!!! [Socket.IO] Error in listener [Socket.IO](join-lobby)."
        );
        console.log(err);
      }
    });

    socket.on("leave-lobby", async () => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(
          socket.id,
          "leave-lobby",
          `User ${userID} left the lobby ${lobbyID}`
        );
        socket
          .in(lobbyID)
          .emit("player-left", await db.removeFromLobby(userID, lobbyID));
      } catch (err) {
        console.log(
          "!!! [Socket.IO] Error in listener [Socket.IO](leave-lobby)."
        );
        console.log(err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(socket.id, "disconnect", `User ${userID} disconnected`);
        cache.removeUserSocketPair(userID);
      } catch (err) {
        console.log(
          "!!! [Socket.IO] Error in listener [Socket.IO](disconnect)."
        );
        console.log(err);
      }
    });

    socket.on("host-starts-game", async () => {
      try {
        //TODO: Case handling when the game is started more than once.
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(
          socket.id,
          "host-starts-game",
          `User ${userID} started the game in lobby ${lobbyID}`
        );

        //Check if there are more than one user in lobby.
        let numUsers = await db.getNumPlayersInLobby(lobbyID);
        if (numUsers < 2) {
          throw "Unable to start the game. There are not enough players in the lobby.";
          //TODO: return error
        } else {
          //Check if user is the host of a lobby.
          if (await db.isUserHostOfALobby(userID, lobbyID)) {
            await db.changeLobbyStatus(lobbyID, "waiting");
            io.in(lobbyID).emit("game-is-starting");
          } else {
            throw `User ${userID} is not the host of lobby ${lobbyID}.`;
          }
        }
      } catch (err) {
        console.log(
          "!!! [Socket.IO] Error in listener [Socket.IO](host-starts-game)."
        );
        console.log(err);
      }
    });

    socket.on("ready-to-start-game", async () => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(
          socket.id,
          "ready-to-start-game",
          `User ${userID} is ready to start the game in lobby ${lobbyID}`
        );

        //Check if user belongs in a lobby
        if (!(await db.isUserInLobby(userID, lobbyID))) {
          throw "User does not belong in a lobby.";
        }
        let numPlayersCache = cache.addUserToReadyList(userID, lobbyID);
        let numPlayersLobby = await db.getNumPlayersInLobby(lobbyID);
        io.in(lobbyID).emit(
          "player-is-ready",
          await db.getPlayerID(userID, lobbyID)
        );
        if (numPlayersCache == numPlayersLobby) {
          //All players are ready.
          //Change lobby status.
          await db.changeLobbyStatus(lobbyID, "started");
          io.in(lobbyID).emit("all-players-are-ready");
          //Deal the cards.
          await db.initGame(lobbyID);
          let data = await db.dealCards(lobbyID);
          /*
          { players: [
              {"cards":[{"s":2,"r":0}],"_id":"5dc818040a91451abc19a89f","playerID":0,"numCards":1},
              {"cards":[{"s":0,"r":3}],"_id":"5dc56b48ca310b4de0d709bb","playerID":1,"numCards":1}
            ],
            currentPlayer: 5dc818040a91451abc19a89f 
          }*/
          for (let i = 0; i < data.players.length; i++) {
            if (
              data.players[i]._id.toString() == data.currentPlayer.toString()
            ) {
              io.in(lobbyID).emit("current-player", data.players[i].playerID);
            }
          }

          for (let i = 0; i < data.players.length; i++) {
            let playerSocket = cache.userIDToSocketID(data.players[i]._id);
            let playerCards = data.players[i].cards;

            io.to(playerSocket).emit("dealt-cards", playerCards);
          }

          io.to(lobbyID).emit("started-hand");

          cache.removeLobby(lobbyID);
        } else if (numPlayersCache > numPlayersLobby) {
          //There are more players registered in Cache than in Mongo
          console.log(
            `!!! [${tools.currTime()}] WARNING! There are more players registered in Cache than in Mongo`
          );
        }
      } catch (err) {
        console.log(
          "!!! [Socket.IO] Error in listener [Socket.IO](ready-to-start-game)."
        );
        console.log(err);
      }
    });

    /**
     * {
      comb: this.state.selectedComb,
      rankA: this.state.selectedRankA,
      rankB: this.state.selectedRankB,
      suit: this.state.selectedSuit
    }
     */
    socket.on("call", async (data) => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(
          socket.id,
          "call",
          `User ${userID} made a call in ${lobbyID} lobby`
        );
        await db.checkIfUserIsCurrentPlayer(userID, lobbyID);

        let processedData = await db.processCall(data, lobbyID);
        if (processedData.isCallValid == true) {
          //call is valid
          io.to(lobbyID).emit("player-called", data);
          setTimeout(function () {
            io.to(lobbyID).emit("current-player", processedData.nextPlayerID);
          }, 1000);
          setTimeout(function () {
            io.to(lobbyID).emit("next-player-can-call");
          }, 1000);
        } else {
          //call is invalid
          //TODO: return error msg
          console.log("!!! [Socket.IO](call) The call was not accepted.");
        }
      } catch (err) {
        console.log("!!! [Socket.IO](call) Error in listener.");
        console.log(err);
      }
    });

    socket.on("check", async () => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        tools.logSocks(
          socket.id,
          "check",
          `User ${userID} checked in ${lobbyID} lobby`
        );

        await db.checkIfUserIsCurrentPlayer(userID, lobbyID);
        io.to(lobbyID).emit("player-checked");

        let data = await db.getAllCards(lobbyID);
        io.to(lobbyID).emit("all-cards", data);

        data = await db.processCheck(lobbyID);

        await new Promise((r) => setTimeout(r, 5000));

        io.to(lobbyID).emit("hand-result", {
          lostPlayer: data.lostPlayer,
          wonPlayer: data.wonPlayer,
        });

        if (data.isPlayerOut) {
          //player lost the game
          if (data.isGameOver) {
            //the game is over, one player is left in the game
            io.to(lobbyID).emit("player-won", data.wonPlayer);
            //TODO: handle game end, return users to lobby screen.

            await new Promise((r) => setTimeout(r, 5000));

            io.to(lobbyID).emit("return-to-lobby");
            return;
          } else {
            //more than 1 player is left
            io.to(lobbyID).emit("player-out", data.lostPlayer);
          }
        }

        await new Promise((r) => setTimeout(r, 3000));

        io.to(lobbyID).emit("refresh-hand");

        io.to(lobbyID).emit("current-player", data.currentPlayer);

        //deal cards
        for (let i = 0; i < data.players.length; i++) {
          if (data.players[i].status == "playing") {
            let playerSocket = cache.userIDToSocketID(data.players[i]._id);
            let playerCards = data.players[i].cards;

            io.to(playerSocket).emit("dealt-cards", playerCards);
          }
        }

        io.to(lobbyID).emit("started-hand");
      } catch (err) {
        console.log("!!! [Socket.IO](check) Error in listener.");
        console.log(err);
      }
    });

    socket.on("get-lobby-info", async () => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        let data = await db.getJoinLobbyInfo(userID, lobbyID);
        io.to(socket.id).emit("lobby-info", data);
      } catch (err) {
        console.log("!!! [Socket.IO](get-lobby-info) Error in listener.");
        console.log(err);
      }
    });

    socket.on("message", async (message) => {
      try {
        let { userID, lobbyID } = await getUserInfo(socket);
        let playerID = await db.getPlayerID(userID, lobbyID);
        io.to(lobbyID).emit("message", { playerID: playerID, message });
      } catch (err) {
        console.log("!!! [Socket.IO](message) Error in listener.");
        console.log(err);
      }
    });
  });
};

/**TODO:
 * Adapt the listeners to the critical situations whenever some particular event is fired multiple times rapidly.
 * Error handling.
 *
 *
 */
