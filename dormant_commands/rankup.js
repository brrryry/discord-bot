const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
    console.log("RANKUP TRIGGERED");
    //Requirements [I, II, III, IV, V]
    //Level: [20, 35, 55, 75, 100]
    //CC: [200, 400, 650, 1000, 1500]

    var rankroles = ["952361330797584454", "952363263419637800", "952363751993114655", "952363937733705738", "952364028498432041"];
    var ranklevels = [20, 35, 55, 75, 100];
    var rankcc = [200, 400, 650, 1000, 1500];

    message.channel.send("Checking data...");

    //find user's role
    rolepos = 0;
    for(i = 0; i < rankroles.length; i++) if(message.member.roles.cache.some(role => role.id === rankroles[i])) rolepos = i + 1;

    //find user's level
    var userlevel = 0;
    var levelPromise = new Promise(resolve => {
      db.all(`SELECT * FROM xp WHERE guild = ${message.guild.id} AND id = ${message.member.id}`, (error, rows) => {
        rows.forEach(row => {
          userlevel = row.level;
        });
      });
      setTimeout(() => resolve("Level found"), 500);
    });
    let levelResult = await levelPromise;

    //find user's cat coin value
    var usercc = 0;
    var ccPromise = new Promise(resolve => {
      db.all(`SELECT * FROM currency WHERE guild = ${message.guild.id} AND id = ${message.member.id}`, (error, rows) => {
        rows.forEach(row => {
          usercc = row.currency;
        });
      });
      setTimeout(() => resolve("CC found"), 500);
    });
    let ccResult = await ccPromise;

    //check for valid level and cc
    var levelCheck = "Not Satisfied";
    var ccCheck = "Not Satisfied";

    if(userlevel > ranklevels[rolepos]) levelCheck = "Satisfied";
    if(usercc > rankcc[rolepos]) ccCheck = "Satisfied";

    if(levelCheck == "Not Satisfied" || ccCheck == "Not Satisfied") {
      var failedembed = new Discord.MessageEmbed().setTitle("Request Failed: Requirements Not Satisfied");
      failedembed.setDescription(`**Attempted Rankup: Cat Contributor ${rolepos + 1}**\n**Level: ${userlevel} **(${levelCheck}, Level ${ranklevels[rolepos]} required)\n**Cat Coins: ${usercc}** (${ccCheck}, ${rankcc[rolepos]} Cat Coins required)`);
      failedembed.setColor("FF0000");
      return message.channel.send(failedembed);
    }

    //rankup requirements passed!
    var sembed = new Discord.MessageEmbed().setTitle("Request Completed");
    sembed.setDescription(`**Attempted Rankup: Cat Contributor ${rolepos + 1}**\n**Level: ${userlevel} **(${levelCheck}, Level ${ranklevels[rolepos]} required)\n**Cat Coins: ${usercc}** (${ccCheck}, ${rankcc[rolepos]} Cat Coins required)`);
    sembed.setColor("00FF00");
    message.channel.send(sembed);

    //ask to confirm Rankup
    message.channel.send("Please confirm that you'd like to rank up.").then(async msg => {
      var thUP = client.emojis.cache.get("768872753125523476");
      var thDOWN = client.emojis.cache.get("768872857345589248");

      msg.react(thUP.id).then(() => msg.react(thDOWN.id)); //async reactions sux

      const reactionFilter = (reaction, user) => {
        return (reaction.emoji.id === thUP.id || reaction.emoji.id === thDOWN.id) && user.id == message.member.id;
      };

      msg.awaitReactions(reactionFilter, {max: 1}).then(async collected => {
        const reaction = collected.first();

        if(reaction.emoji.id == thUP.id) {
          message.channel.send("Rankup Confirmed. Processing...");

          //change user cc
          var cc1Promise = new Promise(resolve => {
            db.all(`SELECT * FROM currency WHERE guild = ${message.guild.id} AND id = ${message.member.id}`, (error, rows) => {
              rows.forEach(row => {
                  db.run(`UPDATE currency SET currency = ${row.currency} - ${rankcc[rolepos]} WHERE guild = ${message.guild.id} AND id = ${message.member.id}`);
              });
            });
            setTimeout(() => resolve("CC found"), 500);
          });
          let cc1Result = await cc1Promise;

          message.member.roles.add(rankroles[rolepos]);
          return message.channel.send("Rankup Completed! Enjoy your new role :)");
        } else {
          return message.channel.send("Rankup Cancelled.");
        }
      });

    });

}

exports.config = {
  name: "rankup",
  usage: "rankup",
  description: "Rank up your contribution role!",
  category: "rank",
  permissionLevel: 0,
  aliases: []
};
