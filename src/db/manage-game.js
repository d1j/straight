const mongoose = require("mongoose");

const gl = require("../gameLogic");

const Lobby = require("../models/Lobby");
const User = require("../models/User");

/** Used at the start of the game. Initializes the following:
 * numCards, currentPlayer, players.numCards
 */
module.exports.initGame = async (lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    });
    let numPlayers = lobby.playerCount;
    //Set how many cards should be on the table at the moment
    lobby.numCards = numPlayers;
    //Deal each player a single card
    for (let i = 0; i < numPlayers; i++) {
      lobby.players[i].numCards = 1;
    }
    //Find starting player
    let leastID = Number.MAX_SAFE_INTEGER;
    let startingID;
    lobby.players.forEach((player) => {
      if (player.playerID < leastID) {
        leastID = player.playerID;
        startingID = player._id;
      }
    });
    //Set starting player
    lobby.currentPlayer = startingID;
    await lobby.save();
    return;
  } catch (err) {
    throw err;
  }
};

/**Deals cards, assigns cards to each player, saves information about the dealt cards in a database and returns necessary data to deal players cards each individually. */
module.exports.dealCards = async (lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    });

    //Generate cards
    let cards = gl.dealCards(lobby.numCards);

    lobby.cards = cards;

    //Assign each player their personal cards
    for (let i = 0; i < lobby.players.length; i++) {
      if (lobby.players[i].status == "playing")
        lobby.players[i].cards = cards.splice(0, lobby.players[i].numCards);
    }

    await lobby.save();

    return { players: lobby.players, currentPlayer: lobby.currentPlayer };
  } catch (err) {
    throw err;
  }
};

module.exports.checkIfUserIsCurrentPlayer = async (userID, lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    }).select("currentPlayer");
    if (lobby.currentPlayer.toString() == userID) return true;
    return false;
  } catch (err) {
    throw err;
  }
};

/** Returns index of the player who has to make a choice. WARNING: When dealing with player array, indexes and call order, player array must be sorted by playerID. */
function getIndexOfNextPlayer(lobby) {
  try {
    //Sort the players in array
    // WARNING: Not entirely sure if sorting will work properly when implemented this way, thus I would go straight to here in case there were issues with call order.
    function compare(a, b) {
      return a.playerID - b.playerID;
    }
    lobby.players = lobby.players.sort(compare);

    let index = -1;

    for (let i = 0; i < lobby.players.length; i++) {
      if (lobby.players[i]._id.toString() == lobby.currentPlayer.toString()) {
        index = i;
      }
    }
    if (index == -1) {
      throw "Current player was not found in the player list of a lobby.";
    }

    do {
      //Find the index of a next player
      if (index + 1 == lobby.players.length) {
        index = 0;
      } else {
        ++index;
      }
    } while (lobby.players[index].status != "playing");

    return index;
  } catch (err) {
    throw err;
  }
}

/** Checks if the new call is higher than the currentCall.
 * If yes, sets a new call and next player.
 * {
 *  isCallValid: true,
 *  nextPlayerID: playerID,
 * }
 * If no, returs the following:
 * {
 *  isCallValid: false
 * }
 */
module.exports.processCall = async (data, lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    });

    //Check if call is valid
    // WARNING! Combination comparison is not properly tested on the server side.
    if (gl.compareCombs(data, lobby.currentCall)) {
      //Call is greater than the current call, thus valid
      //Find the index of a next player
      let nextIndex = getIndexOfNextPlayer(lobby);
      //Set the userID of the next current player
      lobby.previousPlayer = lobby.currentPlayer;
      lobby.currentPlayer = lobby.players[nextIndex]._id; //TODO: sketchy if mongo arrays are not guaranteed main to order.
      lobby.currentCall = data;
      await lobby.save();
      //Return the next playerID
      return {
        isCallValid: true,
        nextPlayerID: lobby.players[nextIndex].playerID,
      };
    } else {
      //Call is not higher than the current call
      return { isCallValid: false };
    }
  } catch (err) {
    throw err;
  }
};

/** Returns player array with userID emitted. TODO: poor function name.*/
module.exports.getAllCards = async (lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    }).select("+players -players._id");
    return lobby.players.toObject();
  } catch (err) {
    throw err;
  }
};

/** Processes check request. Returns the following data:
 *  {
      isPlayerOut: true/false,
      isGameOver: true/false,
      lostPlayer: playerID,
      wonPlayer: playerID,
    };
 */
//TODO: Restructure. Function is probably too big and complicated.

function determineWinnerLoser(lobby) {
  if (
    gl.checkIfCombIsPresent(lobby.currentCall, lobby.numCards, lobby.cards)
  ) {
    return { loserID: lobby.currentPlayer, winnerID: lobby.previousPlayer };
  }
  return { loserID: lobby.previousPlayer, winnerID: lobby.currentPlayer };
}

function getLoserWinnerIndexes(lobby, loserID, winnerID) {
  let loser;
  let winner;
  lobby.players.forEach(player => {
    if (player._id.toString() == loserID.toString()) {
      loser = player;
    }
    if (player._id.toString() == winnerID.toString()) {
      winner = player;
    }
  })
  return { loser, winner }
}

async function setGameOver(result, lobby, winnerID, loserID) {
  result.isGameOver = true;

  lobby.currentCall = { comb: -1, rankA: -1, rankB: -1, suit: -1 };
  lobby.status = "open";
  lobby.cards = [];
  lobby.currentPlayer = null;
  lobby.previousPlayer = null;
  lobby.numCards = null;

  for (let i = 0; i < lobby.players.length; i++) {
    lobby.players[i].status = "playing";
    lobby.players[i].cards = [];
    lobby.players[i].numCards = -1;
    let user = await User.findOne({ _id: lobby.players[i]._id });
    if (user._id.toString() == winnerID.toString()) {
      user.wonGames.first++;
    } else if (user._id.toString() == loserID.toString()) {
      user.wonGames.second++;
    }
    user.playedGames++;
    await user.save();
  }
  await lobby.save();
  return result;
}

module.exports.processCheck = async (lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    });

    let { loserID, winnerID } = determineWinnerLoser(lobby)

    //Check if lost player does not get a 5th card.
    let { loser, winner } = getLoserWinnerIndexes(lobby, loserID, winnerID);


    let result = {
      isPlayerOut: false,
      isGameOver: false,
      lostPlayer: loser.playerID,
      wonPlayer: winner.playerID,
    };

    if (loser.numCards == 4) {
      //Player is out of the game.
      loser.numCards = -1;
      loser.status = "spectating";
      loser.cards = [];
      lobby.numCards -= 4;
      result.isPlayerOut = true;
      //Check if lost player did not end the game.
      let numPlayersLeft = 0;

      lobby.players.forEach(player => {
        if (player.status == "playing") {
          numPlayersLeft++;
        }
      });

      if (numPlayersLeft < 2) {
        //The game should end.
        return await setGameOver(result, lobby, winnerID, loserID);
      }
    } else {
      //Player gets another card.
      loser.numCards++;
      lobby.numCards++;
    }

    //Determine the next player.
    lobby.currentPlayer = loserID;
    let nextIndex = getIndexOfNextPlayer(lobby);
    lobby.currentPlayer = lobby.players[nextIndex]._id; //TODO: once again, sketchy if mongo arrays are not guaranteed to main order.
    lobby.previousPlayer = null;
    result.currentPlayer = lobby.players[nextIndex].playerID;

    //Deal cards.
    //Generate cards.
    let cards = gl.dealCards(lobby.numCards);

    lobby.cards = cards;

    //Assign each player their personal cards.
    for (let i = 0; i < lobby.players.length; i++) {
      if (lobby.players[i].status == "playing")
        lobby.players[i].cards = cards.splice(0, lobby.players[i].numCards);
    }

    result.players = lobby.players;
    lobby.currentCall = { comb: -1, rankA: -1, rankB: -1, suit: -1 };

    await lobby.save();

    return result;
  } catch (err) {
    throw err;
  }
};
