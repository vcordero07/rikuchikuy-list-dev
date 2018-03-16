"use strict";
const express = require("express");
const mongoose = require("mongoose");

const listController = require("./url.controller");
const { jwtAuth } = require("../auth/auth.route");
const router = express.Router();

mongoose.Promise = global.Promise;

router.get("/:shortUrl", jwtAuth, listController.redirectLong);
router.get("/get5Recents", jwtAuth, listController.get5Recents);
router.post("/shorten", listController.createShort);

module.exports = { router };
