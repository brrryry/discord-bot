const Discord = require("discord.js");

const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const {prefix, token, currencyname, status, gatewaychannelid, modlogchannelid, messagechannelid, k_score, score_constant} = require("../config.json"); //get the prefix, token, status and welcome channel id


exports.run = async (client, message, args, level) => {
    let Embed = new Discord.MessageEmbed();
    var mode = "1v1s";
    var description = "";
    var sqlStatement = "SELECT * FROM bhelo1 ORDER BY elo DESC LIMIT 15";
    var counter = 1;

    if(args[0] && args[0].includes("2")) {
        mode = "2v2s";
        sqlStatement = "SELECT * FROM bhelo2 ORDER BY elo DESC LIMIT 15";
    }
    Embed.setTitle(`Brawlhalla PR Leaderboard (${mode})`);
    let getLeaderboard = new Promise(resolve => {
        db.all(sqlStatement, (err, rows) => {
            rows.forEach(row => {
                description += `**\n${counter}**: <@!${row.discordID}> (ELO: ${row.elo.toFixed(3)})`;
            });
            resolve("Y");
        });
        setTimeout(() => resolve("yee"), 500);
    });

    let gotLeaderboard = await getLeaderboard;
    Embed.setDescription(description);
    Embed.setFooter(`Ranking System Details:\nK-Score: ${k_score}\nScore Constant: ${score_constant}`);
    return message.channel.send(Embed)
    
}

exports.config = {
  name: "bhleaderboard",
  usage: "bhleaderboard <1v1s/2v2s (1s by default>",
  description: "Get the server's Brawlhalla PR leaderboard!",
  category: "brawlhalla",
  permissionLevel: 0,
  aliases: ["bhl"]
};
