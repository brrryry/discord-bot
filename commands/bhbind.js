const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fetch = require("node-fetch");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {

  var user = message.author.id;

  message.channel.send("https://imgur.com/a/kXRzWZj");
  message.channel.send("I'll give you 2 minutes to input your ID!").then(msg => {
    const filter = m => m.author.id === message.author.id && !isNaN(m.content);

    message.channel.awaitMessages(filter, {max: 1, time: 120000}).then(async (collected) => {

      var idIsTaken = false;

      let idTaken = new Promise(resolve => {
        db.all(`SELECT * FROM bhbinds`, (err, rows) => {
            if(!rows) idIsTaken = false;
            else {
              rows.forEach(row => {
                if(row.bhID == collected.first().content) idIsTaken = true;
              });
            }
        });

        setTimeout(() => resolve("Y"), 500);
      });

      let idResult = await idTaken;
      if(idIsTaken) return message.reply("that ID is already taken! Try again.");



      //api request
      let output = await fetch("https://api.brawlhalla.com/player/" + collected.first().content + "/stats?api_key=V8TCNU1BJU7SMGZ21V5I").then(response => response.json()).then(data => {
          console.log("you good?");
          if(JSON.stringify(data) == JSON.stringify({})) {
            return message.reply("that's not a valid ID! Try again.");
          }
        });

        let setPromise = await new Promise(resolve => {
            db.all(`SELECT * FROM bhbinds WHERE discordID = "${user}"`, (err, rows) => {
              if(rows.length == 0) db.run("INSERT INTO bhbinds (discordID, discordGuild, bhID) VALUES (?, ?, ?)", [message.member.id, message.guild.id, collected.first().content]);
              else db.run(`UPDATE bhbinds SET bhID = "${collected.first().content}" WHERE discordID = "${user}"`);
            });

            setTimeout(() => resolve("Y"), 500);
        });

        let setResult = await setPromise;

        message.channel.send("Your brawlhalla account was successfully bound!");
      });
  });
}

exports.config = {
  name: "bhbind",
  usage: "bhbind",
  description: "Bind/Update your Discord account to Brawlhalla!",
  category: "brawlhalla",
  permissionLevel: 0
};
