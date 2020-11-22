const express = require("express");
const app = express();
const http = require("http").createServer(app);

const mongoose = require("mongoose");
const path = require("path");
const config = require("config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const Account = require("./routes/account");
const Lobby = require("./routes/lobby");
const Test = require("./routes/test");

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("tiny"));

app.use(express.static(path.join(__dirname, "build")));

app.use("/account", Account);
app.use("/lobby", Lobby);
app.use("/test", Test);

//Serves react app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.use("/", (req, res) => res.status(404).send("404, path does not exist"));

//initialize node app.
app.listen(config.get("appPort"), () => {
  if (process.env.NODE_ENV !== "test")
    console.log(`App listening at http://localhost:${config.get("appPort")}`);
});

//dadatabase connection initialization
const { host, port, name } = config.get("dbConfig");
if (process.env.NODE_ENV !== "test") console.log("Connecting to MongoDB...");
const dbUrl = `mongodb://${host}:${port}/${name}`;
const dbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};
mongoose.set("useCreateIndex", true);
mongoose.connect(dbUrl, dbConfig).then(
  () => {
    if (process.env.NODE_ENV !== "test")
      console.log("Successfully connected to MongoDB.");
  },
  (err) => {
    console.log("Failed to connect to MongoDB");
    console.log(err);
  }
);

module.exports = app;
