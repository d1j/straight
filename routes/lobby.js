const router = require("express").Router();

const lobControl = require("../controllers/lobby");
const dbAcc = require("../db/manage-account");

/** /lobby/create Request to create a lobby.
 * Request body:
 * {
    lobbyName: "_String_required_",
    lobbyPassword: "_String_optional_ Public lobby will be created when password is not specified or is specified as an empty string"
 * }
 * Response on success:
 * {
    lobbyID: "_String_ ID of the created lobby"
 * }
 */
router.post("/create", dbAcc.auth, lobControl.create);

/** /lobby/join Request to join a lobby.
 * Request body:
 * {
    lobbyID: "_String_required_",
    lobbyPassword: "_String_required_ Here should be an empty string if lobby does not require a password to join."
 * }
 *
 * Response on success:
 * {
    name: "_String_ Lobby name",
    players: "_Array_ Array of players that are currently in lobby. Player, who requested to join a lobby is also present in this array."
    [
      {
        _id: {
          wonGames: { first: "_String_ Number of games when user places first.", second: "Number of games when user placed second." },
          playedGames: "_String_ Number of games the user has played",
          username: "_String_ User's username"
        },
        playerID: "_String/Number(does not matter)_ ID that will be used to notify players who called, checked, won, lost and etc.",
        isHost: "_Boolean_ A value which is used to identify whether this particular player is the host of the lobby.",
        isUser: "_Boolean_ A value which is used to identify whether this is the requester who requested to join the lobby."
      },
      {
        _id: {
          wonGames: { first: 0, second: 0 },
          playedGames: 0,
          username: "asd"
        },
        playerID: 1,
        isHost: false,
        isUser: true
      }
    ]
 * }
 */
router.post("/join", dbAcc.auth, lobControl.join);

/** /lobby/list Request to return a list of available servers and brief information about each one of them.
 * Request body:
 * {
    page: "_Number_ Which page of lobby list a client would like to view."
    lobbiesOnPage: "_Number_ Number of lobbies a client would like to dispay on a page."
    search: "_String_ Search lobby by name. String can be empty."
 * }
 * Response on success:
 * [
    {
      status: "_String_ Possible states: "open" - The lobby is open to players to join. / "waiting" - The game has started but waiting for players to prepare for it(UI changes/loading). / "started" - The game is in progress.",
      requiresPassword: "_Boolean_",
      playerCount: "_Number_ Number of players in lobby.",
      _id: "_String_ Lobby ID that should be used to refer to a particular lobby.",
      name: "_String_ Name of the lobby."
    },
    {
      status: "open",
      requiresPassword: false,
      playerCount: 1,
      _id: "5dcd40e8b572424ab0ab08f0",
      name: "123456789's lobby"
    }
 * ]
 */
router.post("/list", dbAcc.auth, lobControl.list);

module.exports = router;
