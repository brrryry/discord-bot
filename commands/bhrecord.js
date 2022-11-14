const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fetch = require("node-fetch");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid, k_score, score_constant} = require("../config.json"); //get the prefix, token, status and welcome channel id


exports.run = async (client, message, args, level) => {
    let requestWait = null;
    var user = message.author.id;
    var embed = new Discord.MessageEmbed()

    if(args.length != 2 && args.length != 4) return message.channel.send("You don't have the right number of arguments. Try again!")

    let mentions = message.mentions.users.toJSON();
    var elos = []

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


    //from here, take different paths depending on whether or not it's a 1v1 or 2v2
    if(args.length == 2) { //1v1
        message.channel.send("Fetching Data...");

        //grab ids and elos
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

        //calculate elo change by winner percentage
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

    } else { //2v2
        message.channel.send("Fetching Data...")
        for(i = 0; i < args.length; i++) {
            var notFound = false
            var id = ""
            var elo = 0
            let getELO = new Promise(resolve => {
                db.all(`SELECT * FROM bhelo2 WHERE discordID = "${mentions[i].id}"`, (err, rows)  => {
                    //console.log(rows);
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
    
        //console.log(elos)
        let winneraverage = (elos[0].elo + elos[1].elo) / 2
        let loseraverage = (elos[2].elo + elos[3].elo) / 2
        let chance = 1 / (1 + Math.pow(10, ((loseraverage - winneraverage) / 1000)))
        let eloChange = k_score * (1 - chance)

        //update values
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
