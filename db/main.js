const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const gl = require("../src/gameLogic");

const User = require("../models/User");
const Lobby = require("../models/Lobby");

const __dev = Boolean(process.env.DEV_MODE);

/**
 * Checks if user belongs to the lobby.
 * @param userdID
 * @param lobbyID
 * @return {Boolean}
 */
const isUserInLobby = async (userID, lobbyID) => {
  try {
    //TODO: why `typeof lobby.players' is an object?
    let lobby = await Lobby.findOne({ _id: lobbyID });
    for (let i = 0; i < lobby.players.length; i++) {
      if (userID == lobby.players[i]._id) {
        return true;
      }
    }
    return false;
  } catch (err) {
    throw err;
  }
};

module.exports.isUserInLobby = isUserInLobby;

/**
 * Creates new lobby.
 * @param {string} rulerID - ID of a user which is creating the lobby.
 * @param {string} lobbyName
 * @param {string} lobbyPassword
 * @return {string} Created lobby ID.
 */
module.exports.createLobby = async (rulerID, lobbyName, lobbyPassword) => {
  try {
    let newLobby;

    if (lobbyName.length < process.env.MIN_USER_LENGTH) {
      throw "Lobby name is too short";
    }
    if (typeof lobbyPassword == "undefined" || lobbyPassword == "") {
      newLobby = new Lobby({
        ruler: mongoose.Types.ObjectId(rulerID),
        name: lobbyName,
      });
    } else {
      newLobby = new Lobby({
        ruler: mongoose.Types.ObjectId(rulerID),
        name: lobbyName,
        password: lobbyPassword,
        requiresPassword: true,
      });
    }

    return (await newLobby.save()).id;
  } catch (err) {
    throw err;
  }
};

/**
 * Adds player to the specified lobby.
 * @param {string} userID
 * @param {string} lobbyID
 * @param {string} lobbyPassword
 */
module.exports.addPlayerToLobby = async (userID, lobbyID, lobbyPassword) => {
  try {
    let lobby = await Lobby.findOne({ _id: lobbyID });

    if (lobby.requiresPassword && lobby.password != lobbyPassword)
      throw "Wrong lobby password.";

    if (lobby.playerCount == 6) throw "Lobby is full.";

    if (await isUserInLobby(userID, lobbyID)) throw "User is already in lobby.";

    if (lobby.status != "open") throw "The game has already started.";

    lobby.players.push({
      _id: mongoose.Types.ObjectId(userID),
      playerID: lobby.__v, //TODO: Could be sketchy
    });
    lobby.playerCount++;

    await lobby.save();
    return;
  } catch (err) {
    //lobbyID: LOBBY DOES NOT EXIST
    throw err;
  }
};

/**
 * Checks if requester is in lobby and returns comprehensive information about the lobby.
 * @param {string} userID
 * @param {string} lobbyID
 * @returns {Object} Specified at the bottom of this document
 */
module.exports.getJoinLobbyInfo = async (userID, lobbyID) => {
  try {
    const lob = await Lobby.findOne({ _id: lobbyID })
      .select(
        "-__v -password -_id -requiresPassword -playerCount -status -players.cards -cards -currentPlayer -numCards -previousPlayer -currentCall"
      )
      .populate("players._id", "-password -email -__v -token");

    let belongs = false;
    for (let i = 0; i < lob.players.length; i++) {
      if (String(lob.players[i]._id._id) == String(userID)) {
        belongs = true;
      }
    }
    if (!belongs) {
      throw "Requester does not belong in the lobby.";
    }

    let lobby = lob.toObject();

    for (let i = 0; i < lobby.players.length; i++) {
      if (String(lobby.ruler) == String(lobby.players[i]._id._id)) {
        lobby.players[i].isHost = true;
      } else {
        lobby.players[i].isHost = false;
      }

      if (String(userID) == String(lobby.players[i]._id._id)) {
        lobby.players[i].isUser = true;
      } else {
        lobby.players[i].isUser = false;
      }

      delete lobby.players[i]._id._id;
    }

    delete lobby.ruler;

    return lobby;
  } catch (err) {
    throw err;
  }
};

/**
 * Returns a list of existing lobbies. Query is adapted to return pages instead of the whole list.
 * @param {number} page - current page.
 * @param {number} lobbiesOnPage - number of lobbies displayed on a page.
 * @return {Object} {playerCount, name, status, requiresPassword}
 */
module.exports.getLobbyList = async (page, lobbiesOnPage, searchString) => {
  try {
    //lobbies range is requested between first lobby and last from the list
    if (typeof searchString == "undefined" || searchString == "") {
      return await Lobby.find({ status: { $eq: "open" } })
        .select("name playerCount status requiresPassword")
        .sort({ playerCount: "desc" })
        .skip((page - 1) * lobbiesOnPage)
        .limit(lobbiesOnPage);
    } else {
      return await Lobby.find({ name: new RegExp(searchString) })
        .select("name playerCount status requiresPassword")
        .sort({ playerCount: "desc" })
        .skip((page - 1) * lobbiesOnPage)
        .limit(lobbiesOnPage);
    }
  } catch (err) {
    throw err;
  }
};

/**
 * User authentication middleware used in ExpressJS routes.
 * https://blog.usejournal.com/handling-authentication-with-nodejs-24fc29265e0f
 */
module.exports.auth = async (req, res, next) => {
  try {
    let token;
    if (__dev) {
      if (typeof req.body.token == "undefined") {
        throw "Action requires authorization.";
      }
      token = req.body.token;
    } else {
      if (typeof req.cookies.token == "undefined") {
        throw "Action requires authorization.";
      }
      token = req.cookies.token;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded._id,
      token: token,
    });

    if (!user) {
      throw "Action requires authorization.";
    }
    req.token = token;
    req.user = user;
    req.userID = decoded._id;
    next();
  } catch (err) {
    throw err;
  }
};

/**
 * User authentication middleware used with Socket.io connection
 * @param {String} token
 * @return {String} userID
 */
module.exports.isTokenValid = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded._id,
      token: token,
    });

    if (!user) {
      throw "User not found in database. Unauthorized.";
    }

    return decoded._id;
  } catch (err) {
    throw err;
  }
};

/**
 * --dev--
 * Removes all data from `lobby` collection.
 */
module.exports._clearLobbies = async () => {
  try {
    await Lobby.remove({});
    return;
  } catch (err) {
    throw err;
  }
};

//----------------------------------------------------//
/* getJoinLobbyInfo Response example:
{
  //TODO: display an example
}
*/
//--------------------Socket-related methods---------------------//

/**Assigns socket ID to a player in database. Returns necessary information about the new user.
 * @param {String} lobbyID
 * @param {String} userID
 * @param {String} socketID
 * Return: { 
 * playerID: 0,
 * isHost: false,
 * isUser: false,  
 * _id: {  
      wonGames: { first: 0, second: 0 },
      playedGames: 0,
      username: '123456789',
      }
   }
 */
module.exports.joinLobbyWithSocks = async (lobbyID, userID, socketID) => {
  try {
    let lob = await Lobby.findOne({ _id: lobbyID })
      .select("players")
      .populate("players._id", "-password -email -__v -token");

    let lobby = lob.toObject();
    let user;

    for (let i = 0; i < lobby.players.length; i++) {
      if (lobby.players[i]._id._id == userID) {
        user = lobby.players[i];
      }
    }
    delete user.cards;
    delete user._id._id;
    user.isHost = false;
    user.isUser = false;

    return user;
  } catch (err) {
    throw err;
  }
};

/**
 * Removes user from lobby. Returns removed player ID and (if the one that left was a host) new host player ID.
 */
module.exports.removeFromLobby = async (userID, lobbyID) => {
  try {
    let lob = await Lobby.findOne({ _id: lobbyID }).select(
      "-__v -password -requiresPassword -status -players.cards -cards"
    );

    let newHostID = -1;
    let leftPlayerID = -1;
    let leftPlayerIndex = -1;
    if (lob.playerCount == 1) {
      //delete lobby
      await lob.remove();
    } else {
      //find user's player ID.
      for (let i = 0; i < lob.players.length; i++) {
        if (String(lob.players[i]._id) == String(userID)) {
          leftPlayerID = lob.players[i].playerID;
          leftPlayerIndex = i;
        }
      }
      //remove player from players array.
      lob.players.splice(leftPlayerIndex, 1);

      //check if host must be changed
      if (String(lob.ruler) == String(userID)) {
        lob.ruler = mongoose.Types.ObjectId(lob.players[0]._id);
        newHostID = lob.players[0].playerID;
      }
      lob.playerCount--;
    }

    await lob.save();

    return { leftPlayerID, newHostID };
  } catch (err) {
    throw err;
  }
};

module.exports.isUserHostOfALobby = async (userID, lobbyID) => {
  try {
    let lob = await Lobby.findOne({ _id: lobbyID });
    if (lob.ruler == userID) {
      return true;
    }
    return false;
  } catch (err) {
    throw err;
  }
};

module.exports.getNumPlayersInLobby = async (lobbyID) => {
  try {
    let lob = await Lobby.findOne({ _id: lobbyID });
    return lob.playerCount;
  } catch (err) {
    throw err;
  }
};

module.exports.getPlayerID = async (userID, lobbyID) => {
  try {
    let lobby = await Lobby.findOne({ _id: lobbyID });
    let playerID = -1;
    lobby.players.forEach((player) => {
      if (player._id.toString() == userID.toString()) {
        playerID = player.playerID;
      }
    });
    return playerID;
  } catch (err) {
    throw err;
  }
};

module.exports.changeLobbyStatus = async (lobbyID, status) => {
  try {
    let lobby = await Lobby.findOne({ _id: lobbyID });
    lobby.status = status;
    await lobby.save();
    return;
  } catch (err) {
    throw err;
  }
};

/** Initializes the following:
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
    for (let i = 0; i < lobby.players.length; i++) {
      if (lobby.players[i].playerID < leastID) {
        leastID = lobby.players[i].playerID;
        startingID = lobby.players[i]._id;
      }
    }
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

function getIndexOfNextPlayer(lobby) {
  try {
    //Sort the players in array
    // WARNING! Not entirely sure if sorting will work properly when implemented this way, thus I would go straight to here in case there were issues with call order.
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

/**
 * {
 *  isCallValid: true/false,
 *  nextPlayerID: playerID,
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
      lobby.currentPlayer = lobby.players[nextIndex]._id;
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

module.exports.checkIfUserIsCurrentPlayer = async (userID, lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    }).select("currentPlayer");
    if (lobby.currentPlayer.toString() == userID) return;
    else throw `!!! User ${userID} is not a current player in ${lobbyID}.`;
  } catch (err) {
    throw err;
  }
};

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

module.exports.processCheck = async (lobbyID) => {
  try {
    let lobby = await Lobby.findOne({
      _id: mongoose.Types.ObjectId(lobbyID),
    });
    //Check if the call forms up and determine winner/loser
    let loserID, winnerID;
    if (
      gl.checkIfCombIsPresent(lobby.currentCall, lobby.numCards, lobby.cards)
    ) {
      loserID = lobby.currentPlayer;
      winnerID = lobby.previousPlayer;
    } else {
      loserID = lobby.previousPlayer;
      winnerID = lobby.currentPlayer;
    }
    //Check if lost player does not get a 5th card
    let loserIndex, winnerIndex;
    for (let i = 0; i < lobby.players.length; i++) {
      if (lobby.players[i]._id.toString() == loserID.toString()) {
        loserIndex = i;
      }
      if (lobby.players[i]._id.toString() == winnerID.toString()) {
        winnerIndex = i;
      }
    }

    let result = {
      isPlayerOut: false,
      isGameOver: false,
      lostPlayer: lobby.players[loserIndex].playerID,
      wonPlayer: lobby.players[winnerIndex].playerID,
    };

    if (lobby.players[loserIndex].numCards == 4) {
      //Player is out of the game
      lobby.players[loserIndex].numCards = -1;
      lobby.players[loserIndex].status = "spectating";
      lobby.players[loserIndex].cards = [];
      lobby.numCards -= 4;
      result.isPlayerOut = true;
      //Check if lost player did not end the game
      let numPlayersLeft = 0;
      for (let i = 0; i < lobby.players.length; i++) {
        if (lobby.players[i].status == "playing") {
          numPlayersLeft++;
        }
      }
      if (numPlayersLeft < 2) {
        //The game should end
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
    } else {
      //Player gets another card
      lobby.players[loserIndex].numCards++;
      lobby.numCards++;
    }

    //Determine the next player
    lobby.currentPlayer = loserID;
    let nextIndex = getIndexOfNextPlayer(lobby);
    lobby.currentPlayer = lobby.players[nextIndex]._id;
    lobby.previousPlayer = null;
    result.currentPlayer = lobby.players[nextIndex].playerID;

    //Deal cards
    //Generate cards
    let cards = gl.dealCards(lobby.numCards);

    lobby.cards = cards;

    //Assign each player their personal cards
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
