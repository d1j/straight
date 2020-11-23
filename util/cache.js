const currTime = require("./tools").currentTime;

let USP = [];
let RDY = [];

function findUser(userID) {
  for (let i = 0; i < USP.length; i++) {
    if (USP[i].userID == userID) {
      return { found: true, index: i };
    }
  }
  return { found: false, index: -1 };
}

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

/**Returns how many users are now waiting in the lobby. */
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
      userList += `<tr><td>${
        USP[i].userID + "</td><td>" + USP[i].sockID
      }</td></tr>`;
    }
    userList = `<p>User list:</p>
    <style> table, td, th { border: 1px solid green; border-collapse: collapse; } </style>

    <table><thead><tr><th>userID</th><th>sockID</th></tr></thead><tbody>${userList}</tbody></table>`;

    let readyList = "";
    //map the key-value pair array into HTML code
    for (let i = 0; i < RDY.length; i++) {
      readyList += `<tr><td>${
        RDY[i].lobbyID + "</td><td><ul><li>" + RDY[i].users.join("</li><li>")
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
 * */
