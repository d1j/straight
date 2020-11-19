const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Card = mongoose.Schema(
  { s: { type: Number }, r: { type: Number } },
  { _id: false }
);

const LobbySchema = new Schema({
  ruler: { type: Schema.Types.ObjectId, ref: "User", index: { unique: true } },
  status: { type: String, default: "open" },
  requiresPassword: { type: Boolean, default: false },
  name: { type: String, required: true },
  password: { type: String },
  playerCount: { type: Number, default: 0 },
  players: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "User" },
      cards: [Card],
      playerID: { type: Number },
      numCards: { type: Number },
      status: { type: String, default: "playing" },
    },
  ],
  cards: [Card],
  previousPlayer: { type: Schema.Types.ObjectId, ref: "User" },
  currentPlayer: { type: Schema.Types.ObjectId, ref: "User" },
  numCards: { type: Number },
  currentCall: {
    comb: { type: Number, default: -1 },
    rankA: { type: Number, default: -1 },
    rankB: { type: Number, default: -1 },
    suit: { type: Number, default: -1 },
  },
});

module.exports = mongoose.model("Lobby", LobbySchema);
