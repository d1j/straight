const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../models/User");

/**
 * Adds new user or throws an error if: username or email is already taken.
 * @param {username, password, email}
 */
module.exports.registerUser = async ({ username, password, email }) => {
  try {
    //Create new user
    const newUser = new User({ username, password, email });
    //Save new user to DB
    await newUser.save();
    return;
  } catch (err) {
    console.log("\n~~~~ ./src/db.js/registerUser ~~~~");
    if (err.name == "MongoError") {
      //Process mongo errors
      console.log(err.errmsg);
      if (err.code == 11000) {
        switch (Object.keys(err.keyValue)[0]) {
          case "username":
            throw "Username is already taken.";
          case "email":
            throw "E-mail is already taken.";
          default:
            throw "Unexpected internal error, matching entries.";
        }
      }
    } else {
      //Process any other errors
      console.log(err);
      throw "Unexpected internal error.";
    }
  }
};

/**
 * Confirms credentials and generates new authentication token.
 * @param {username, password}
 * @return {string} Authentication token.
 */
module.exports.logIn = async ({ email, password }) => {
  try {
    let user = await User.findOne({ email });
    if (user) {
      if (await user.comparePassword(password)) {
        //correct password
        return await user.newAuthToken();
      } else {
        //invalid password
        throw "Invalid email or password.";
      }
    } else {
      //user does not exist
      console.log("User under sepcified email does not exist");
      throw "Invalid email or password.";
    }
  } catch (err) {
    throw err;
  }
};

/**
 * User authentication middleware used in ExpressJS routes.
 * https://blog.usejournal.com/handling-authentication-with-nodejs-24fc29265e0f
 */
module.exports.auth = async (req, res, next) => {
  try {
    let token;

    if (typeof req.body.token == "undefined") {
      if (typeof req.cookies.token == "undefined") {
        throw "No token is given";
      } else {
        token = req.cookies.token;
      }
    } else {
      token = req.body.token;
    }

    const decoded = jwt.verify(token, config.get("jwtSecret"));

    const user = await User.findOne({
      _id: decoded._id,
      token: token,
    });

    if (!user) {
      throw "Authenticated user not found";
    }
    req.token = token;
    req.user = user;
    req.userID = decoded._id;
    next();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

/**
 * Clears user authentication token.
 * @param {string} userID
 */
module.exports.logOut = async (userID) => {
  try {
    await User.findByIdAndUpdate(userID, { $set: { token: "" } });
  } catch (err) {
    throw err;
  }
};

/**
 * Returns user stats which are shown on the main menu.
 * @param {string} userID
 * @return {Object} {user: User.username, first: User.wonGames.first, second: User.wonGames.second, played: User.playedGames}
 */
module.exports.getUserStats = async (userID) => {
  try {
    const user = await User.findOne({
      _id: userID,
    });
    return {
      username: user.username,
      wonGamesFirst: user.wonGames.first,
      wonGamesSecond: user.wonGames.second,
      playedGames: user.playedGames,
    };
  } catch (err) {
    throw err;
  }
};
