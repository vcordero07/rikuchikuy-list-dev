"use strict";
global.DATABASE_URL = "mongodb://localhost/rikuchikuy-list-demo-test";
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../server");
const { User } = require("../users/user.index");
const { JWT_SECRET } = require("../config");

const expect = chai.expect;

chai.use(chaiHttp);

describe("Auth endpoints", function() {
  const username = "exampleUser";
  const password = "examplePass";
  const email = "email@example.com";

  before(function() {
    return runServer();
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        username,
        password,
        email
      })
    );
  });

  afterEach(function() {
    return User.remove({});
  });

  describe("/api/auth/login", function() {
    it("Should reject requests with no credentials", function() {
      return chai
        .request(app)
        .post("/api/auth/login")
        .then(() => expect.fail(null, null, "Request should not succeed"))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(400);
        });
    });
    it("Should reject requests with incorrect usernames", function() {
      return chai
        .request(app)
        .post("/api/auth/login")
        .send({ username: "wrongUsername", password })
        .then(() => expect.fail(null, null, "Request should not succeed"))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it("Should reject requests with incorrect passwords", function() {
      return chai
        .request(app)
        .post("/api/auth/login")
        .send({ username, password: "wrongPassword" })
        .then(() => expect.fail(null, null, "Request should not succeed"))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it("Should return a valid auth token", function() {
      return chai
        .request(app)
        .post("/api/auth/login")
        .send({ username, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          const token = res.body.authToken;
          expect(token).to.be.a("string");
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ["HS256"]
          });
          // //console.log("payload:", payload.user);
          expect(payload.user).to.deep.equal({
            id: payload.user.id,
            username,
            email
          });
        });
    });
  });

  describe("/api/auth/refresh", function() {
    it("Should reject requests with no credentials", function() {
      return chai
        .request(app)
        .post("/api/auth/refresh")
        .then(() => expect.fail(null, null, "Request should not succeed"))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it("Should reject requests with an invalid token", function() {
      const token = jwt.sign(
        {
          username,
          email
        },
        "wrongSecret",
        {
          algorithm: "HS256",
          expiresIn: "7d"
        }
      );

      return chai
        .request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${token}`)
        .then(() => expect.fail(null, null, "Request should not succeed"))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it("Should reject requests with an expired token", function() {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          },
          exp: Math.floor(Date.now() / 1000) - 10
        },
        JWT_SECRET,
        {
          algorithm: "HS256",
          subject: username
        }
      );

      return chai
        .request(app)
        .post("/api/auth/refresh")
        .set("authorization", `Bearer ${token}`)
        .then(() => expect.fail(null, null, "Request should not succeed"))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it("Should return a valid auth token with a newer expiry date", function() {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: "HS256",
          subject: username,
          expiresIn: "7d"
        }
      );
      const decoded = jwt.decode(token);

      return chai
        .request(app)
        .post("/api/auth/refresh")
        .set("authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          const token = res.body.authToken;
          expect(token).to.be.a("string");
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ["HS256"]
          });
          expect(payload.user).to.deep.equal({
            username,
            email
          });
          expect(payload.exp).to.be.at.least(decoded.exp);
        });
    });
  });
});
