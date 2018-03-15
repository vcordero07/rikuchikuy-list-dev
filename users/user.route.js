"use strict";
const express = require("express");
const userController = require("./user.controller");
const { jwtAuth } = require("../auth/auth.route");
const router = express.Router();

router.post("/", userController.newUser);
router.get("/", userController.getAllUsers);
router.get("/me", jwtAuth, userController.getSingleUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = { router };
