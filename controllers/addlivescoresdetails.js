const request = require("request");
const axios = require("axios");
const Match = require("../models/match");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const User = require("../models/user");
const getkeys = require("../apikeys");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

const io = 1;
async function getplayerImage(name) {
  const k = name.split(" ")[0];
  const config = {
    method: "get",
    url: `https://cricket.sportmonks.com/api/v2.0/players?filter[lastname]=sachin&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {},
  };

  const s = await axios(config).catch((error) => {
    console.log(error);
  });
  const PlayerS = new Player();

  return s.data.data.length > 0 ? s.data.data[0].image_path : "";
}

function pointCalculator(
  runs,
  fours,
  sixes,
  strikeRate,
  wicket,
  economy,
  balls
) {
  let totalPoints = runs + fours * 1 + sixes * 2 + 25 * wicket;
  while (runs >= 50) {
    totalPoints += 20;
    runs -= 50;
  }
  if (strikeRate < 100 && balls > 10) {
    totalPoints -= 5;
  }
  if (economy >= 12) {
    totalPoints -= 5;
  }
  return totalPoints + 4;
}

module.exports.addLivematchtodb = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime());
  console.log(endDate.getHours(), endDate.getMinutes(), "gettimelive");
  const b = 9 * 60 * 60 * 1000 * 1;
  date = new Date(date.getTime() - b);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  console.log(matches, "match");
  for (let i = 0; i < matches.length; i++) {
    const { matchId } = matches[i];
    const match = await MatchLive.findOne({ matchId });
    const matid = await Match.findOne({ matchId });
    if (!match) {
      console.log("matchalreadyexists");
    } else {
      const keys = await getkeys.getkeys();
      const date1 = matches[i].date;
      const user = await User.findById("63c18c9f2d217ea120307e30");
      user.totalhits += 1;
      await user.save();
      const options = {
        method: "GET",
        url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
        headers: {
          "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
          "X-RapidAPI-Key": keys,
          useQueryString: true,
        },
      };
      const promise = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
          if (error) {
            reject(error);
          }
          const s = JSON.parse(body);

          resolve(s);
        });
      });
      promise
        .then(async (s) => {
          console.log(s, "matchid");
          if (
            s.results.live_details != null &&
            s.results.live_details.teamsheets.home.length != 0
          ) {
            const LiveMatchDet = new MatchLive();
            LiveMatchDet.matchId = matchId;
            LiveMatchDet.date = date1;
            const inPlay = "Yes";
            const { status } = s.results.live_details.match_summary;
            const { toss } = s.results.live_details.match_summary;
            const { result } = s.results.live_details.match_summary;

            let title_fi = "";
            let overs_fi = 0;
            let runs_fi = 0;
            let wickets_fi = 0;
            let fow_fi = "";
            let extrasDetails_fi = "";
            let batting1 = [];
            let bowling1 = [];
            let title_si = "";
            let overs_si = 0;
            let runs_si = 0;
            let wickets_si = 0;
            let fow_si = "";
            let extrasDetails_si = "";
            let batting2 = [];
            let bowling2 = [];
            if (s.results.live_details.scorecard.length > 0) {
              batting1 = s.results.live_details.scorecard[0].batting;
              bowling1 = s.results.live_details.scorecard[0].bowling;
              title_fi = s.results.live_details.scorecard[0].title;
              overs_fi = s.results.live_details.scorecard[0].overs;
              runs_fi = s.results.live_details.scorecard[0].runs;
              wickets_fi = s.results.live_details.scorecard[0].wickets;
              fow_fi = s.results.live_details.scorecard[0].fow;
              extrasDetails_fi =
                s.results.live_details.scorecard[0].extras_detail;
            }
            if (s.results.live_details.scorecard.length > 1) {
              title_si = s.results.live_details.scorecard[1].title;
              overs_si = s.results.live_details.scorecard[1].overs;
              runs_si = s.results.live_details.scorecard[1].runs;
              wickets_si = s.results.live_details.scorecard[1].wickets;
              fow_si = s.results.live_details.scorecard[1].fow;
              extrasDetails_si =
                s.results.live_details.scorecard[1].extras_detail;
              batting2 = s.results.live_details.scorecard[1].batting;
              bowling2 = s.results.live_details.scorecard[1].bowling;
            }
            const { teamHomePlayers } = match;
            const { teamAwayPlayers } = match;

            const batting = batting1.concat(batting2);
            const bowling = bowling1.concat(bowling2);
            for (let i = 0; i < teamHomePlayers.length; i++) {
              const player = teamHomePlayers[i];
              const { playerId } = player;
              for (const batter of batting) {
                if (batter.player_id == playerId) {
                  teamHomePlayers[i].runs = batter.runs;
                  teamHomePlayers[i].balls = batter.balls;
                  teamHomePlayers[i].fours = batter.fours;
                  teamHomePlayers[i].sixes = batter.sixes;
                  teamHomePlayers[i].strikeRate = batter.strike_rate;
                  teamHomePlayers[i].howOut = batter.how_out;
                  teamHomePlayers[i].batOrder = batter.bat_order;
                }
              }
              for (const bowler of bowling) {
                if (bowler.player_id == playerId) {
                  teamHomePlayers[i].overs = bowler.overs;
                  teamHomePlayers[i].maidens = bowler.maidens;
                  teamHomePlayers[i].runsConceded = bowler.runs_conceded;
                  teamHomePlayers[i].wickets = bowler.wickets;
                  teamHomePlayers[i].economy = bowler.economy;
                }
              }
              teamHomePlayers[i].points = pointCalculator(
                teamHomePlayers[i].runs,
                teamHomePlayers[i].fours,
                teamHomePlayers[i].sixes,
                teamHomePlayers[i].strikeRate,
                teamHomePlayers[i].wickets,
                teamHomePlayers[i].economy,
                teamHomePlayers[i].balls
              );
            }
            for (let i = 0; i < teamAwayPlayers.length; i++) {
              const player = teamAwayPlayers[i];
              const { playerId } = player;
              for (const batter of batting) {
                if (batter.player_id == playerId) {
                  teamAwayPlayers[i].runs = batter.runs;
                  teamAwayPlayers[i].balls = batter.balls;
                  teamAwayPlayers[i].fours = batter.fours;
                  teamAwayPlayers[i].sixes = batter.sixes;
                  teamAwayPlayers[i].strikeRate = batter.strike_rate;
                  teamAwayPlayers[i].howOut = batter.how_out;
                  teamAwayPlayers[i].batOrder = batter.bat_order;
                }
              }
              for (const bowler of bowling) {
                if (bowler.player_id == playerId) {
                  teamAwayPlayers[i].overs = bowler.overs;
                  teamAwayPlayers[i].maidens = bowler.maidens;
                  teamAwayPlayers[i].runsConceded = bowler.runs_conceded;
                  teamAwayPlayers[i].wickets = bowler.wickets;
                  teamAwayPlayers[i].economy = bowler.economy;
                }
              }
              teamAwayPlayers[i].points = pointCalculator(
                teamAwayPlayers[i].runs,
                teamAwayPlayers[i].fours,
                teamAwayPlayers[i].sixes,
                teamAwayPlayers[i].strikeRate,
                teamAwayPlayers[i].wickets,
                teamAwayPlayers[i].economy,
                teamAwayPlayers[i].balls
              );
            }
            try {
              const matchUpdate = await MatchLive.updateOne(
                { matchId },
                {
                  $set: {
                    inPlay,
                    status,
                    toss,
                    result,
                    teamHomePlayers,
                    teamAwayPlayers,
                    titleFI: title_fi,
                    oversFI: overs_fi,
                    wicketsFI: wickets_fi,
                    runFI: runs_fi,
                    fowFI: fow_fi,
                    extrasDetailFI: extrasDetails_fi,
                    titleSI: title_si,
                    oversSI: overs_si,
                    wicketsSI: wickets_si,
                    runSI: runs_si,
                    fowSI: fow_si,
                    extrasDetailSI: extrasDetails_si,
                  },
                }
              );
            } catch (err) {
              console.log(`Error : ${err}`);
            }
          }
        })
        .catch((error) => console.log(error));
    }
  }
};
