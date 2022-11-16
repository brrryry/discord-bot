/*
File: bhpr.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {k_score, score_constant} = require("../config.json"); //get config stuff

exports.run = async (client, message, args, level) => {
    let Embed = new Discord.MessageEmbed(); //setup embed

    //Locate target and their id
    var target = message.member;
    var id = target.id

    //Try to find target
    if (message.mentions.members.first()) {
        target = message.mentions.members.first();
        id = message.mentions.members.first().id;
    }

    //If the target is ID based and not pinged
    if(args[0]) {
        for(i = 0; i < memberList.length; i++) {
            if(args[0] === memberList[i]) {
            id = args[0];
            target = message.guild.members.cache.get(args[0]);
            }
        }
    }

    //Search in Database
    var description = `Stats for <@!${id}>:\n\n`;

    //Find 1v1s Data
    var counter = 1;
    var rank1 = 1;
    var elo1 = 0;
    var found1 = false;
    let getRanked1Stats = new Promise(resolve => {
        db.all("SELECT * FROM bhelo1 ORDER BY elo DESC", (err, rows) => {
            if(!rows || rows.length == 0) resolve("N");
            else {
                rows.forEach(row => {
                    if(row.discordID == id) {
                        rank1 = counter;
                        elo1 = row.elo
                        found1 = true
                        resolve("found")
                    }
                    counter++;
                });
            }
        });
        setTimeout(() => resolve("Y"), 250);
    });
    let ranked1Stats = await getRanked1Stats;
    var wins1 = 0;
    var losses1 = 0;
    let getWinrate1 = new Promise(resolve => {
        db.all(`SELECT * FROM bhmatches WHERE winner = "${id}" OR loser = "${id}"`, (err, rows) => {
            if(!rows || rows.length == 0) resolve("N");
            else {
                rows.forEach(row => {
                    if(row.winner == id) wins1++;
                    else losses1++;
                });
            }
        });
        setTimeout(() => resolve("Y"), 250);
    });
    let gettingWinRate1 = await getWinrate1
    var winrate1 = 0;
    if(wins1 + losses1 == 0) winrate1 = "N/A";
    else winrate1 = ((wins1) / (wins1 + losses1)) * 100;
    winrate1 = Number(winrate1).toFixed(3)
    description += `**1v1s**\nRank: ${rank1}\nELO: ${elo1.toFixed(3)}\nWinrate: ${winrate1}%\n\n`;

    //Find 2v2s Data
    var counter = 1;
    var rank2 = 1;
    var elo2 = 0;
    var found2 = false;
    let getRanked2Stats = new Promise(resolve => {
        db.all("SELECT * FROM bhelo2 ORDER BY elo DESC", (err, rows) => {
            if(!rows || rows.length == 0) resolve("N");
            else {
                rows.forEach(row => {
                    if(row.discordID == id) {
                        rank2 = counter;
                        elo2 = row.elo
                        found2 = true
                        resolve("found")
                    }
                    counter++;
                });
            }
        });
        setTimeout(() => resolve("Y"), 250);
    });
    let ranked2Stats = await getRanked2Stats;
    var wins2 = 0;
    var losses2 = 0;
    let getWinrate2 = new Promise(resolve => {
        db.all(`SELECT * FROM bhmatches WHERE (winner LIKE '%${id}%' AND winner LIKE '% %') OR (loser LIKE '%${id}%' AND loser LIKE '% %')`, (err, rows) => {
            if(!rows || rows.length == 0) resolve("N");
            else {
                rows.forEach(row => {
                    if(row.winner.includes(id)) wins2++;
                    else losses2++;
                });
            }
        });
        setTimeout(() => resolve("Y"), 250);
    });
    let winRate2 = await getWinrate2;
    var winrate2 = 0;
    if(wins2 + losses2 == 0) winrate2 = "N/A";
    else winrate2 = ((wins2) / (wins2 + losses2)) * 100
    winrate2 = Number(winrate2).toFixed(3)
    description += `**2v2s**\nRank: ${rank2}\nELO: ${elo2.toFixed(3)}\nWinrate: ${winrate2}%`;

    //Fill in and send embed
    Embed.setTitle("Server Brawlhalla PR Data!");
    Embed.setDescription(description);
    Embed.setFooter(`Ranking System Details:\nK-Score: ${k_score}\nScore Constant: ${score_constant}`);
    return message.channel.send(Embed);
}

exports.config = {
  name: "bhpr",
  usage: "bhpr <user (optional)>",
  description: "Gets Brawlhalla server PR statistics for a specific person!",
  category: "brawlhalla",
  permissionLevel: 0,
  aliases: []
};
