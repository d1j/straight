/**
 * Checks if request body contains specified properties and throws an error if a single property is missing.
 * @param {Object} body - request body.
 * @param {Array[string]} content - Array of property names.
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

let HTTP_CTR = 2;

module.exports.httpCtr = () => {
  return HTTP_CTR;
};

module.exports.incrHttpCtr = () => {
  HTTP_CTR += 2;
};

module.exports.httpLog = (req, req_num, type, message = "") => {
  console.log(
    `-- [${currentTime()}] (HTTP|${req.method}|${type}) {${req_num}} ${
      req.originalUrl
    } ${message}.`
  );
};

module.exports.logSocks = (sockID, path, message = "") => {
  console.log(
    `~~ [${currentTime()}] (SOCKET.IO) [${sockID}] [${path}] ${message}.`
  );
};
