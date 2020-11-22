const tools = require("../util/tools");
const dbLob = require("../db/manage-lobby");

const create = async (req, res) => {
  try {
    tools.contentCheck(req.body, ["lobbyName"]);
    let lobbyID = await dbLob.createLobby(
      req.userID,
      req.body.lobbyName,
      req.body.lobbyPassword
    );
    res.status(201).json({ lobbyID });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const join = async (req, res) => {
  try {
    tools.contentCheck(req.body, ["lobbyID", "lobbyPassword"]);
    await dbLob.addPlayerToLobby(
      req.userID,
      req.body.lobbyID,
      req.body.lobbyPassword
    );
    let lobby = await dbLob.getJoinLobbyInfo(req.userID, req.body.lobbyID);
    res.status(200).json(lobby);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const list = async (req, res) => {
  try {
    tools.contentCheck(req.body, ["search", "page", "lobbiesOnPage"]);

    let lobbyData = await dbLob.getLobbyList(
      Number(req.body.page),
      Number(req.body.lobbiesOnPage),
      req.body.search
    );
    res.status(200).json(lobbyData);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

module.exports.create = create;
module.exports.join = join;
module.exports.list = list;
