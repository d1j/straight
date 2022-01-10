const isEmail = require("validator/lib/isEmail");
const config = require("config");

const tools = require("../util/tools");
const dbAcc = require("../db/manage-account");

const register = async (req, res) => {
  try {
    tools.contentCheck(req.body, ["username", "password", "email"]);

    let userAccCredReqs = config.get("userAccCredReqs");

    //Check if provided creds meet length requirements.
    if (req.body.username.length < userAccCredReqs.minUserLength)
      throw new Error(`Username is too short. Min length required: ${userAccCredReqs.minUserLength}`);
    if (req.body.username.length > userAccCredReqs.maxUserLength)
      throw new Error(`Username is too long. Max length: ${userAccCredReqs.maxUserLength}`);
    if (req.body.password.length < userAccCredReqs.minPassLength)
      throw new Error(`Password is too short. Min length required: ${userAccCredReqs.minPassLength}`);
    if (req.body.password.length > userAccCredReqs.maxPassLength)
      throw new Error(`Password is too long. Max length: ${userAccCredReqs.maxPassLength}`);

    //Check if e-mail format is valid
    if (!isEmail(req.body.email)) {
      throw new Error("The entered e-mail is not valid.");
    }

    //Register new user
    await dbAcc.registerUser(req.body);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const logIn = async (req, res) => {
  try {
    tools.contentCheck(req.body, ["email", "password"]);

    let token = await dbAcc.logIn(req.body);

    res.cookie("token", token, {
      //TODO: I should probably consider a better maxAge value.
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ token: token });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const logOut = async (req, res) => {
  try {
    await dbAcc.logOut(req.userID);
    res.clearCookie("token").sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const stats = async (req, res) => {
  try {
    let data = await dbAcc.getUserStats(req.userID);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

module.exports.register = register;
module.exports.logIn = logIn;
module.exports.logOut = logOut;
module.exports.stats = stats;
