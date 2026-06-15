const express = require("express");
const router = express.Router();
const { createAdmin } = require("../Controllers/CreateAdminController");

router.post("/create", createAdmin);

module.exports = router;
