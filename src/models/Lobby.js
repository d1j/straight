const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/* s - suit | r - rank. 
By default, only the following ranks are used in this game: 9 10 J Q K A. Those will be represented as follows: 
  ~ 9 will be processed as Number(0)
  ~ 10 - 1
  ~ J  - 2
  ~ Q  - 3
  ~ K  - 4
  ~ A  - 5
There are 4 different card suits and they will be represented as values from range [0-3]. 
It does not matter which suit will represent which number. 
Client-side can render all {s:0} either as Spades or as Hearts.
*/
const Card = mongoose.Schema(
  { s: { type: Number }, r: { type: Number } },
  { _id: false }
);

const LobbySchema = new Schema({
  ruler: { type: Schema.Types.ObjectId, ref: "User", index: { unique: true } }, //user, who manages the pre-game lobby status (starts the game).
  status: { type: String, default: "open" }, //Currently, only "open" status is relevant. Though certain enhancements might require additional different states to be stored.
  name: { type: String, required: true },
  requiresPassword: { type: Boolean, default: false },
  password: { type: String },
  playerCount: { type: Number, default: 0 }, //TODO: don't really know if this field is necessary as I could check how many players are there with `Lobby.players.length`
  //TODO: Move players array to a separate Schema as I did with cards array.
  players: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "User" },
      cards: [Card],
      playerID: { type: Number },
      numCards: { type: Number },
      status: { type: String, default: "playing" },
    }, //TODO: think I should add {_id: false}, here. Though it would require some code additional restructuring
  ],
  cards: [Card],
  previousPlayer: { type: Schema.Types.ObjectId, ref: "User" }, //player who made the most recetn call.
  currentPlayer: { type: Schema.Types.ObjectId, ref: "User" }, //player who is currently making a decision.
  numCards: { type: Number },
  currentCall: {
    comb: { type: Number, default: -1 },
    rankA: { type: Number, default: -1 },
    rankB: { type: Number, default: -1 },
    suit: { type: Number, default: -1 },
  },
});

module.exports = mongoose.model("Lobby", LobbySchema);
