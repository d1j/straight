/**
 * Checks if request body contains specified properties and throws an error if a single property is missing.
 * @param {Object} body - request body.
 * @param {Array[string]} content - Array of property names.
 * TODO: check if there are any request validation middleware modules for express.
 */
module.exports.contentCheck = (body, content) => {
  for (let i = 0; i < content.length; i++) {
    if (typeof body[content[i]] === "undefined") {
      throw `Missing: ${content[i]}`;
    }
  }
};

function currentTime() {
  return new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
module.exports.currentTime = currentTime;

/** Logger function for logging Socket.io events. */
module.exports.logSocks = (sockID, path, message = "") => {
  console.log(
    `~~ [${currentTime()}] (SOCKET.IO) [${sockID}] [${path}] ${message}.`
  );
};

/** Logger function for logging Socket.io errors. */
module.exports.logSocksErr = (err) => {
  console.log(`!!! [Socket.IO] Error in listener [Socket.IO](${err}).`);
};
