const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");

router.get("/getcontests/:id", async (req, res) => {
  const contests = await Contest.find({ matchId: req.params.id });
  res.status(200).json({
    contests: contests,
  });
});

router.get("/getcontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  res.status(200).json({
    contest: contest,
  });
});

router.get("/", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  res.status(200).json({
    contest: contest,
  });
});

router.get("/getcontestsofuser/:id", async (req, res) => {
  const contests = await Contest.find({
    matchId: req.params.id,
    userIds: req.query.userid,
  });
  res.status(200).json({
    contests: contests,
  });
});

router.get("/getteamsofcontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  const teams = [];
  for (let i = 0; i < contest.teamsId.length; i++) {
    let team = await Team.findById(contest.teamsId[i]);
    teams.push(team);
  }
  const match = await Matches.findOne({ matchId: contest.matchId });
  for (let i = 0; i < teams.length; i++) {
    const user = await User.findById(teams[i].userId);
    const users = { user: user };
    teams[i] = { ...teams[i], ...users };
  }
  res.status(200).json({
    teams: teams,
    match: match,
  });
});

router.get("/getjoinedcontest/:id", async (req, res) => {
  const contests = await Contest.find({
    matchId: req.params.id,
    userIds: req.query.userid,
  });
  const teams = [];
  const contestsArray = [];
  for (let i = 0; i < contests.length; i++) {
    for (let j = 0; j < contests[i].teamsId.length; j++) {
      console.log(contests[i].teamsId[j]);
      const team = await Team.findById(contests[i].teamsId[j]);
      contestsArray.push({ contests: contests[i], team: team });
    }
  }
  res.status(200).json({
    contests: contestsArray,
  });
});

router.get("/joincontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  const user = await User.findOne({ _id: req.query.userid });
  if (user.wallet > contest.price / contest.totalSpots) {
    user.wallet = user.wallet - contest.price;
    contest.userIds.push(req.query.userid);
    contest.teamsId.push(req.query.teamid);
    contest.spotsLeft = contest.spotsLeft - 1;
    await contest.save();
    res.status(200).json({
      contest: contest,
    });
  } else {
    res.status(200).json({
      contest: contest,
    });
  }
});

module.exports = router;
