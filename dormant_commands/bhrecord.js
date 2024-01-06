/*
File: bhrecord.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const {k_score, score_constant} = require("../config.json"); //get config stuff


exports.run = async (client, message, args, level) => {
    var embed = new Discord.MessageEmbed(); //Create Embed

    //If incorrect amount of arguments (2 - 1v1s, 4 - 2v2s)
    if(args.length != 2 && args.length != 4) return message.channel.send("You don't have the right number of arguments. Try again!")
    let mentions = message.mentions.users.toJSON(); //get all mentions
    var elos = [] //list to store ids and elos

    //Format Current Time
    var now = new Date().toLocaleDateString("en-US", {
        hourCycle: "h12",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
        timeZone: "America/New_York"
      });


    //Check for 1v1s or 2v2s data
    //NOTE: This code can be optimized. TBD
    if(args.length == 2) { //1v1s
        message.channel.send("Fetching Data...");

        //Grab IDs and ELOs from each necessary row
        for(i = 0; i < args.length; i++) {
            var notFound = false;
            var id = ""
            var elo = 0
            let getELO = new Promise(resolve => {
                db.all(`SELECT * FROM bhelo1 WHERE discordID = "${mentions[i].id}"`, (err, rows)  => {
                    if(!rows || rows.length == 0){
                        notFound = true;
                        id = mentions[i].id
                        elo = 1000
                    }
                    else {
                        rows.forEach(row => {
                            id = row.discordID
                            elo = row.elo
                        });
                    }
                });
                setTimeout(() => {resolve("Y");}, 500);
            });
    
            let eloPromise = await getELO;
            if(notFound) db.run("INSERT INTO bhelo1 (discordID, elo) VALUES (?, ?)", [mentions[i].id, 1000]);
            elos.push({
                "id": String(id),
                "elo": elo
            });
        }

        //Calculate ELO
        let chance = 1 / (1 + Math.pow(10, ((elos[1].elo - elos[0].elo) / 1000)))
        let eloChange = k_score * (1 - chance)
        winnerElo = elos[0].elo + eloChange
        loserElo = elos[1].elo - eloChange
        
        message.channel.send("Updating Tables...")
        //update ELO values in database
        db.run(`UPDATE bhelo1 SET elo = ${winnerElo} WHERE discordID = ${elos[0].id}`);
        db.run(`UPDATE bhelo1 SET elo = ${loserElo} WHERE discordID = ${elos[1].id}`);
        db.run("INSERT INTO bhmatches (winner, loser, date) VALUES (?, ?, ?)", [elos[0].id, elos[1].id, now]);

        embed.setTitle("Match Recorded (1v1)");
        embed.setDescription(`Winner: <@!${elos[0].id}> (Updated ELO: ${winnerElo.toFixed(3)})\nLoser: <@!${elos[1].id}> (Updated ELO: ${loserElo.toFixed(3)})`);

    } else { //2v2s
        message.channel.send("Fetching Data...")
        for(i = 0; i < args.length; i++) {
            var notFound = false
            var id = ""
            var elo = 0
            let getELO = new Promise(resolve => {
                db.all(`SELECT * FROM bhelo2 WHERE discordID = "${mentions[i].id}"`, (err, rows)  => {
                    if(!rows || rows.length == 0){
                        notFound = true;
                        id = mentions[i].id
                        elo = 1000
                    }
                    else {
                        rows.forEach(row => {
                            id = row.discordID
                            elo = row.elo
                        });
                    }
                });
                setTimeout(() => {resolve("Y");}, 500);
            });
    
            let eloPromise = await getELO;
            if(notFound) db.run("INSERT INTO bhelo2 (discordID, elo) VALUES (?, ?)", [mentions[i].id, 1000]);
            elos.push({
                "id": String(id),
                "elo": elo
            });
        }

        //Calculate ELOs by AVERAGE of each team's solo ELO
        let winneraverage = (elos[0].elo + elos[1].elo) / 2
        let loseraverage = (elos[2].elo + elos[3].elo) / 2
        let chance = 1 / (1 + Math.pow(10, ((loseraverage - winneraverage) / 1000)))
        let eloChange = k_score * (1 - chance)

        //Update Table Values
        message.channel.send("Updating Tables...")
        for(i = 0; i < 4; i++) {
            if(i < 2) elos[i].elo += eloChange
            else elos[i].elo -= eloChange
            db.run(`UPDATE bhelo2 SET elo = ${elos[i].elo} WHERE discordID = ${elos[i].id}`);
        }
        db.run("INSERT INTO bhmatches (winner, loser, date) VALUES (?, ?, ?)", [`${elos[0].id} ${elos[1].id}`, `${elos[2].id} ${elos[3].id}`, now]);

        embed.setTitle("Match Recorded (2v2)");
        description = `Winner: <@!${elos[0].id}> + <@!${elos[1].id}>\nLoser: <@!${elos[2].id}> + <@!${elos[3].id}>\n\nUPDATED ELOS:`
        for(i = 0; i < 4; i++) {
            description += `\n<@!${elos[i].id}>: ${elos[i].elo.toFixed(3)}`;
        }
        embed.setDescription(description);
    }

    //Return Embed, confirm that scores are in the table
    embed.setFooter(`Ranking System Details:\nK-Score: ${k_score}\nScore Constant: ${score_constant}`);
    return message.channel.send(embed);

}

exports.config = {
  name: "bhrecord",
  usage: "bhrecord <@winner1 @winner2> <@loser1 @loser2> (2v2 if applicable)",
  description: "Record a tournament outcome!",
  category: "brawlhalla",
  permissionLevel: 8
};
