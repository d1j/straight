const tools = require("../util/tools");
const cache = require("../util/cache");
const dbLob = require("../db/manage-lobby");
const dbGame = require("../db/manage-game");

const call = async ({ socket, io, data }) => {
  try {
    let { userID, lobbyID } = socket.customProps;
    tools.logSocks(
      socket.id,
      "call",
      `User ${userID} made a call in ${lobbyID} lobby`
    );
    if (!(await dbGame.checkIfUserIsCurrentPlayer(userID, lobbyID)))
      throw `!!! User ${userID} is not a current player in ${lobbyID}.`;

    let processedData = await dbGame.processCall(data, lobbyID);
    if (processedData.isCallValid) {
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
    tools.logSocksErr("call");
    console.log(err);
  }
};

const check = async ({ socket, io }) => {
  try {
    let { userID, lobbyID } = socket.customProps;
    tools.logSocks(
      socket.id,
      "check",
      `User ${userID} checked in ${lobbyID} lobby`
    );

    if (!(await dbGame.checkIfUserIsCurrentPlayer(userID, lobbyID)))
      throw `!!! User ${userID} is not a current player in ${lobbyID}.`;

    io.to(lobbyID).emit("player-checked");

    let data = await dbGame.getAllCards(lobbyID);
    io.to(lobbyID).emit("all-cards", data);

    data = await dbGame.processCheck(lobbyID);

    await new Promise((r) => setTimeout(r, 2000));

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
    tools.logSocksErr("check");
    console.log(err);
  }
};

module.exports.call = call;
module.exports.check = check;
