const flagURLs = require("country-flags-svg");
const otpGenerator = require("otp-generator");
const express = require("express");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");

const router = express.Router();

router.post("/saveteam/:id", async (req, res) => {
  const players = [];
  let points = 0;
  for (p in req.body.players) {
    players.push({
      playerId: req.body.players[p].playerId,
      playerName: req.body.players[p].playerName,
      position: req.body.players[p].position,
      point: req.body.players[p].points,
      image: req.body.players[p].image,
    });
    points += req.body.players[p].points;
  }
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const team = await Team.create({
    matchId: req.body.matchId,
    captainId: req.body.captainId,
    viceCaptainId: req.body.vicecaptainId,
    userId: req.body.userid,
    teamId: otp,
    players,
    points: 44,
  });

  res.status(200).json({
    team,
    message: "team created successfully",
  });
});

router.get("/getteam", async (req, res) => {
  console.log(req.query, "ok");
  const team = await Team.find({
    matchId: req.query.matchId,
    userId: req.query.userid,
  });
  res.status(200).json({
    message: "team created successfully",
    team,
  });
});

router.get("/getteam/:id", async (req, res) => {
  const team = await Team.findById(req.params.id);
  res.status(200).json({
    message: "team got successfully",
    team,
  });
});

module.exports = router;
