let chai = require("chai");
let chaiHttp = require("chai-http");
let server = require("../index.js");
let should = chai.should();
const User = require("../models/User");

chai.use(chaiHttp);

/** Basic unit tests for account management.
 * The tests do not exhaust every possible real-life scenarios.
 * The tests were written just to check how they work and what would be the purpose of them. */

describe("Account", () => {
  let testBody = {
    username: "test",
    password: "test123",
    email: "test@test.test",
  };
  let testToken;

  describe("/POST register", () => {
    it("it should register a new user", (done) => {
      chai
        .request(server)
        .post("/account/register")
        .send(testBody)
        .end((err, res) => {
          if (err) return done(err);
          res.should.have.status(201);
          done();
        });
    });
    //TODO: Run tests when creds length is out of bounds
  });
  describe("/POST login", () => {
    it('it should log in a user, set "token" cookie and return token in the body', (done) => {
      chai
        .request(server)
        .post("/account/login")
        .send({ email: testBody.email, password: testBody.password })
        .end((err, res) => {
          if (err) return done(err);
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("token");
          res.should.have.cookie("token");
          testToken = res.body.token; //ROI: In case res.body.token is not set up properly while cookie is, I could pass the received token from cookies header.
          done();
        });
    });
    //TODO: Run test when body is not set/specified poorly.
  });
  describe("/POST stats", () => {
    it("it should return user stats", (done) => {
      chai
        .request(server)
        .post("/account/stats")
        .send({ token: testToken })
        .end((err, res) => {
          if (err) return done(err);
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.keys(
            "playedGames",
            "username",
            "wonGamesFirst",
            "wonGamesSecond"
          );
          done();
        });
    });
    //TODO: Run test with wrong/no token provided.
  });
  describe("/POST logout", () => {
    it("it should log user out of the system and reset cookie token", (done) => {
      chai
        .request(server)
        .post("/account/logout")
        .send({ token: testToken })
        .end((err, res) => {
          User.deleteMany({}, (err) => {
            if (err) console.log(err);
          });
          if (err) return done(err);
          res.should.have.status(200);
          //TODO: figure out how to check if cookie is deleted
          done();
        });
    });
    //TODO: Run test with wrong/no token provided.
  });
});
