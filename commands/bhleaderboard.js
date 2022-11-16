/*
File: bhleaderboard.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {k_score, score_constant} = require("../config.json");


exports.run = async (client, message, args, level) => {
    //Setup Variables
    let Embed = new Discord.MessageEmbed(); //Embed to be returned
    var mode = "1v1s"; //Default mode
    var description = ""; //Embed Description
    var sqlStatement = "SELECT * FROM bhelo1 ORDER BY elo DESC LIMIT 15"; //SQL statement
    var counter = 1; //Used to count and display row numbers

    //If person wants 2v2s
    if(args[0] && args[0].includes("2")) {
        //Change mode and SQL statement
        mode = "2v2s";
        sqlStatement = "SELECT * FROM bhelo2 ORDER BY elo DESC LIMIT 15";
    }
    Embed.setTitle(`Brawlhalla PR Leaderboard (${mode})`); //set Embed Title

    //Fetch Leaderboard from table
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

    //Add data to the Embed
    Embed.setDescription(description);
    Embed.setFooter(`Ranking System Details:\nK-Score: ${k_score}\nScore Constant: ${score_constant}`);
    return message.channel.send(Embed); //Return embed
    
}

exports.config = {
  name: "bhleaderboard",
  usage: "bhleaderboard <1v1s/2v2s (1s by default>",
  description: "Gets the Brawlhalla PR leaderboard!",
  category: "brawlhalla",
  permissionLevel: 0,
  aliases: ["bhl"]
};
