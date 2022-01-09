const Lobby = require("../models/Lobby");

/**
 * Removes all data from `lobby` collection.
 */
module.exports.clearLobbies = async () => {
  try {
    await Lobby.deleteMany({});
    return;
  } catch (err) {
    throw err;
  }
};
