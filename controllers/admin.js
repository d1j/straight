const cache = require("../util/cache");
const dbAdmin = require("../db/admin");

const clearLobbies = async (req, res) => {
  try {
    await dbAdmin.clearLobbies();
    res.status(200).send("Lobbies cleared");
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to clear lobbies.");
  }
};

const clearCache = (req, res) => {
  try {
    cache._clearCache();
    res.status(200).send("Cache cleared.");
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to clear Cache.");
  }
};

const clearCookies = (req, res) => {
  try {
    res.clearCookie("token").sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500).send("Failed to clear cookies.");
  }
};

const displayCacheData = (req, res) => {
  try {
    res.send(cache.getDataInHTML());
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to pull and display data from Cache.");
  }
};

const getCacheData = (req, res) => {
  try {
    res.send(cache.getDataInJSON());
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to pull data from Cache.");
  }
};

module.exports.clearLobbies = clearLobbies;
module.exports.clearCache = clearCache;
module.exports.clearCookies = clearCookies;
module.exports.displayCacheData = displayCacheData;
module.exports.getCacheData = getCacheData;
