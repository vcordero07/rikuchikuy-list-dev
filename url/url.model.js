"use strict";
const mongoose = require("mongoose");
const crypto = require("crypto");

const UrlSchema = mongoose.Schema(
  {
    longUrl: { type: String, unique: true, required: true },
    shortUrl: {
      type: String,
      maxlength: [6, "Error with the length!"],
      unique: true
    },
    visits: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// function for make a unique shortUrl
const makeUniqueUrl = len =>
  crypto
    .randomBytes(Math.ceil(len * (3 / 4)))
    .toString("base64")
    .slice(0, len)
    .replace(/\+/g, "0")
    .replace(/\//g, "0");

// function for add http in front of url who don't have it
// we need that for redirect external
const addHtpp = url => {
  const pattern = /^((http|https|ftp):\/\/)/;

  if (!pattern.test(url)) {
    url = `http://${url}`; // eslint-disable-line
  }
  return url;
};

// make a unique short url + add http if not before saving
UrlSchema.pre("save", function(next, done) {
  console.log("hello");
  this.shortUrl = makeUniqueUrl(6);
  console.log("this.shortUrl:", this.shortUrl);
  this.longUrl = addHtpp(this.longUrl);
  // if we have already this shortUrl we just keep doing until we have a random one
  mongoose.models.Url.findOne({ shortUrl: this.shortUrl })
    .then(url => {
      if (url) {
        this.shortUrl = makeUniqueUrl(6);
      }
      return done();
    })
    .catch(err => done(err));
  next();
});

const Url = mongoose.model("Url", UrlSchema);

module.exports = { Url };
