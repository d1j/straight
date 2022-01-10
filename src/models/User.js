const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    index: { unique: true },
    trim: true,
  },
  password: { type: String, required: true },
  email: { type: String, required: true, index: { unique: true }, trim: true },
  wonGames: {
    first: {
      //Times user placed first
      type: Number,
      default: 0,
    },
    second: {
      //Times user placed second
      type: Number,
      default: 0,
    },
  },
  playedGames: {
    type: Number,
    default: 0,
  },
  /**Token probably shouldn't be stored like that. 
  If was wondering how the first user would become unauthorized in case second one logged in on another platform with the same account.
  My solution was to store the token server-side and always compare it with the token I receive from client.
  I guess I should have looked into something called "sessions".
  */
  token: {
    type: String,
    required: false,
  },
});

//Password hashing middleware
//https://stackoverflow.com/questions/14588032/mongoose-password-hashing
UserSchema.pre("save", function (next) {
  let user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  // generate a salt
  bcrypt.genSalt(config.get("saltWorkFactor"), function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (error, hash) {
      if (error) return next(error);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

//Password checking method
//NOTICE: I should consider using these methods more. They look convenient.
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    throw err;
  }
};

//Token generating method
//https://blog.usejournal.com/handling-authentication-with-nodejs-24fc29265e0f
UserSchema.methods.newAuthToken = async function () {
  try {
    const user = this;
    const token = jwt.sign(
      { _id: user.id.toString() },
      config.get("jwtSecret"),
      {
        expiresIn: "7 days",
      }
    );
    user.token = token;
    await user.save();
    return token;
  } catch (err) {
    throw err;
  }
};

module.exports = mongoose.model("User", UserSchema);
