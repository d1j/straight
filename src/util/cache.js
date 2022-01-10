/**Simple cache system I implemented for storing socketID//userID pairs and tracking lobby clients that are ready to begin the game.
 * I think I should have used a proper DB instead of this implementation.
 * Redis sounds like an option here.
 * It could be that implementing sessions would eliminate the need of the following data storage.
 */

/** Cache structure
 *  USP = [
 *    {userID: 1, sockID: 2},
 *    {userID: 3, sockID: 3},
 *    {userID: 4, sockID: 12},
 *    ...
 *  ]
 *
 *  RDY = [
 *    {lobbyID: 123, users: [1,3,4]},
 *    {lobbyID: 124, users: [5,6]},
 *    ...
 *  ]
 */

const currTime = require("./tools").currentTime;

let USP = [];
let RDY = [];

/** Checks if userID is stored in the cache. Returns true/false. TODO: poor function name. */
function findUser(userID) {
  for (let i = 0; i < USP.length; i++) {
    if (USP[i].userID == userID) {
      return { found: true, index: i };
    }
  }
  return { found: false, index: -1 };
}

/** Checks if lobbyID is stored in the cache. Returns true/false. TODO: poor function name. */
function findLobby(lobbyID) {
  for (let i = 0; i < RDY.length; i++) {
    if (RDY[i].lobbyID == lobbyID) {
      return { found: true, index: i };
    }
  }
  return { found: false, index: -1 };
}

module.exports.addUserSocketPair = (userID, sockID) => {
  try {
    let { found, index } = findUser(userID);
    if (!found) {
      USP.push({ userID, sockID });
    } else {
      USP[index] = sockID;
    }
  } catch (err) {
    throw err;
  }
};

module.exports.removeUserSocketPair = (userID) => {
  try {
    let { found, index } = findUser(userID);
    if (found) {
      USP.splice(index, 1);
    } else {
      console.log(
        `!!! [${currTime()}] (CACHE) Server tried to remove user-socket pair that does not exist. UserID - [${userID}]`
      );
    }
  } catch (err) {
    throw err;
  }
};

/** Finds and returns socketID by userID. */
module.exports.userIDToSocketID = (userID) => {
  try {
    let { found, index } = findUser(userID);
    if (found) {
      return USP[index].sockID;
    } else {
      console.log(
        `!!! [${currTime()}] (CACHE) Server tried to convert userID to socketID and failed. UserID - [${userID}]`
      );
    }
  } catch (err) {
    throw err;
  }
};

/** Returns the number of users that are currently waiting in the lobby. */
module.exports.addUserToReadyList = (userID, lobbyID) => {
  try {
    let { found, index } = findLobby(lobbyID);
    if (found) {
      RDY[index].users.push(userID);
      return RDY[index].users.length;
    } else {
      RDY.push({ lobbyID, users: [userID] });
      return 0;
    }
  } catch (err) {
    throw err;
  }
};

/** Removes lobby from cache. */
module.exports.removeLobby = (lobbyID) => {
  try {
    let { found, index } = findLobby(lobbyID);
    if (found) {
      RDY.splice(index, 1);
    } else {
      console.log(
        `!!! [${currTime()}] (CACHE) Server tried to remove lobby which does not exist [${lobbyID}]`
      );
    }
  } catch (err) {
    throw err;
  }
};

/** ADMIN functions ahead. TODO: Should they be stored in a separate file? */
module.exports._clearCache = () => {
  try {
    USP = [];
    RDY = [];
  } catch (err) {
    throw err;
  }
};

module.exports.getDataInHTML = () => {
  try {
    let userList = "";
    for (let i = 0; i < USP.length; i++) {
      userList += `<tr><td>${USP[i].userID + "</td><td>" + USP[i].sockID
        }</td></tr>`;
    }
    userList = `<p>User list:</p>
    <style> table, td, th { border: 1px solid green; border-collapse: collapse; } </style>

    <table><thead><tr><th>userID</th><th>sockID</th></tr></thead><tbody>${userList}</tbody></table>`;

    let readyList = "";
    // Map the key-value pair array into HTML code.
    for (let i = 0; i < RDY.length; i++) {
      readyList += `<tr><td>${RDY[i].lobbyID + "</td><td><ul><li>" + RDY[i].users.join("</li><li>")
        }</li></ul></td></tr>`;
    }
    readyList = `<p>Ready list:</p><table><thead><tr><th>lobbyID</th><th>userIDs</th></tr></thead><tbody>${readyList}</tbody></table>`;

    let htmlData = `<!DOCTYPE html>
    <html>
      <head> </head>
      <body>
        ${userList}
        ${readyList}
      </body>
    </html>
    `;
    return htmlData;
  } catch (err) {
    throw err;
  }
};

module.exports.getDataInJSON = () => {
  return { USP, RDY };
};
