const tools = require("../util/tools");
const cache = require("../util/cache");
const dbLob = require("../db/manage-lobby");
const dbGame = require("../db/manage-game");

/** Emits the following:
 * 'new-player-in-lobby' Example of return data: { playerID: 0, isHost: false, isUser: false, _id: { wonGames: { first: 0, second: 0 }, playedGames: 0, username: '123456789', } }
 */
const joinLobby = async ({ io, socket }) => {
  try {
    let { userID, lobbyID } = socket.customProps;
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
        await dbLob.joinLobbyWithSocks(lobbyID, userID)
      );
    socket.join(lobbyID);
    io.to(socket.id).emit("joined-lobby");
  } catch (err) {
    tools.logSocksErr("join-lobby");
    console.log(err);
  }
};

/** Emits the following:
 * 'player-left' Example of return data: { leftPlayerID: 0, newHostID: 1 }
 */
const leaveLobby = async ({ socket }) => {
  try {
    let { userID, lobbyID } = socket.customProps;
    tools.logSocks(
      socket.id,
      "leave-lobby",
      `User ${userID} left the lobby ${lobbyID}`
    );
    socket
      .in(lobbyID)
      .emit("player-left", await dbLob.removeFromLobby(userID, lobbyID));
  } catch (err) {
    tools.logSocksErr("leave-lobby");
    console.log(err);
  }
};

/** Emits the following:
 * ~ [in all cases] 'player-is-ready' Return data: playerID.
 * ~ [when all players are ready] 'all-players-are-ready' Return data: None.
 * ~ [at the start of the game/first round] 'current-player' Return data: playerID.
 * ~ [at the start of the game/first round] 'dealt-cards' Return data: individual player card {s: , r: }
 * ~ [when all the information is provided and hand can be started] 'started-hand' Return data: None.
 */
const readyToStartGame = async ({ io, socket }) => {
  try {
    let { userID, lobbyID } = socket.customProps;
    tools.logSocks(
      socket.id,
      "ready-to-start-game",
      `User ${userID} is ready to start the game in lobby ${lobbyID}`
    );

    //Check if user belongs in a lobby
    if (!(await dbLob.isUserInLobby(userID, lobbyID))) {
      throw "User does not belong in a lobby.";
    }
    let numPlayersCache = cache.addUserToReadyList(userID, lobbyID);
    let numPlayersLobby = await dbLob.getNumPlayersInLobby(lobbyID);
    io.in(lobbyID).emit(
      "player-is-ready",
      await dbLob.getPlayerID(userID, lobbyID)
    );
    //Check if all players are ready.
    if (numPlayersCache == numPlayersLobby) {
      //Change lobby status.
      await dbLob.changeLobbyStatus(lobbyID, "started");
      io.in(lobbyID).emit("all-players-are-ready");
      //Deal the cards.
      await dbGame.initGame(lobbyID);
      let data = await dbGame.dealCards(lobbyID);
      /*
    { players: [
        {"cards":[{"s":2,"r":0}],"_id":"5dc818040a91451abc19a89f","playerID":0,"numCards":1},
        {"cards":[{"s":0,"r":3}],"_id":"5dc56b48ca310b4de0d709bb","playerID":1,"numCards":1}
      ],
      currentPlayer: 5dc818040a91451abc19a89f 
    }*/
      for (let i = 0; i < data.players.length; i++) {
        if (data.players[i]._id.toString() == data.currentPlayer.toString()) {
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
    tools.logSocksErr("ready-to-start-game");
    console.log(err);
  }
};

/** Emits the following:
 * 'game-is-starting' Return data: None.
 */
const hostStartsGame = async ({ io, socket }) => {
  try {
    //TODO: Check how the system would behave after two sequential host-game-starts.
    let { userID, lobbyID } = socket.customProps;
    tools.logSocks(
      socket.id,
      "host-starts-game",
      `User ${userID} started the game in lobby ${lobbyID}`
    );

    //Check if there are more than one user in lobby.
    let numUsers = await dbLob.getNumPlayersInLobby(lobbyID);
    if (numUsers < 2) {
      throw "Unable to start the game. There are not enough players in the lobby.";
      //TODO: return error
    } else {
      //Check if user is the host of a lobby.
      if (await dbLob.isUserHostOfALobby(userID, lobbyID)) {
        await dbLob.changeLobbyStatus(lobbyID, "waiting");
        io.in(lobbyID).emit("game-is-starting");
      } else {
        throw `User ${userID} is not the host of lobby ${lobbyID}.`;
      }
    }
  } catch (err) {
    tools.logSocksErr("host-starts-game");
    console.log(err);
  }
};

const disconnect = async ({ socket }) => {
  try {
    let { userID } = socket.customProps;
    tools.logSocks(socket.id, "disconnect", `User ${userID} disconnected`);
    cache.removeUserSocketPair(userID);
  } catch (err) {
    tools.logSocksErr("disconnect");
    console.log(err);
  }
};

/** Emits the following:
 * 'message' Return data example: {playerID: 0, message: "Yes"}
 */
const message = async ({ io, socket, message }) => {
  try {
    let { userID, lobbyID } = socket.customProps;
    let playerID = await dbLob.getPlayerID(userID, lobbyID);
    io.to(lobbyID).emit("message", { playerID: playerID, message });
  } catch (err) {
    console.log("!!! [Socket.IO](message) Error in listener.");
    console.log(err);
  }
};

module.exports.joinLobby = joinLobby;
module.exports.leaveLobby = leaveLobby;
module.exports.readyToStartGame = readyToStartGame;
module.exports.hostStartsGame = hostStartsGame;
module.exports.disconnect = disconnect;
module.exports.message = message;
