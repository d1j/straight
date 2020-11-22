const config = require("config");
const mongoose = require("mongoose");

const Lobby = require("../models/Lobby");

/**
 * Creates new lobby.
 * @param {string} rulerID - ID of a user who is creating the lobby.
 * @param {string} lobbyName
 * @param {string} lobbyPassword
 * @return {string} Created lobby ID.
 */
module.exports.createLobby = async (rulerID, lobbyName, lobbyPassword) => {
  try {
    let newLobby;

    if (lobbyName.length < config.get("lobbyReqs").minLobbyNameLenght) {
      throw "Lobby name is too short";
    }
    if (typeof lobbyPassword === "undefined" || lobbyPassword === "") {
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
 * Checks if user belongs to the lobby.
 * @param userdID
 * @param lobbyID
 * @return {Boolean}
 */
const isUserInLobby = async (userID, lobbyID) => {
  try {
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

    if (lobby.playerCount == config.get("lobbyReqs").maxPlayerNumber)
      throw "Lobby is full.";

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
    throw err;
  }
};

/**
 * Checks if user is in lobby and returns comprehensive information about the lobby.
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

    let userBelongsToLobby = false;
    for (let i = 0; i < lob.players.length; i++) {
      if (String(lob.players[i]._id._id) === String(userID)) {
        userBelongsToLobby = true;
      }
    }
    if (!userBelongsToLobby) {
      throw "Requester does not belong in the lobby.";
    }

    let lobby = lob.toObject();

    for (let i = 0; i < lobby.players.length; i++) {
      if (String(lobby.ruler) === String(lobby.players[i]._id._id)) {
        lobby.players[i].isHost = true;
      } else {
        lobby.players[i].isHost = false;
      }

      if (String(userID) === String(lobby.players[i]._id._id)) {
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
    if (typeof searchString === "undefined" || searchString === "") {
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
