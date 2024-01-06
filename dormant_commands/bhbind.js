/*
File: ban.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.run = (client, message, args, level) => {
  var user = message.author.id; //Get User ID

  message.channel.send("https://imgur.com/a/kXRzWZj"); //Imgur Reference: Example of Brawlhalla ID
  message.channel.send("I'll give you 2 minutes to input your ID!").then(msg => { //Send Message, Open Message Collector
    const filter = m => m.author.id === message.author.id && !isNaN(m.content);

    message.channel.awaitMessages(filter, {max: 1, time: 120000}).then(async (collected) => { //Message Collector takes Collected Message
      //Check if a brawlhalla ID is already taken
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
      //If it's taken, return
      if(idIsTaken) return message.reply("that ID is already taken! Try again.");

      //Request API to validate ID
      let output = await fetch("https://api.brawlhalla.com/player/" + collected.first().content + "/stats?api_key=V8TCNU1BJU7SMGZ21V5I").then(response => response.json()).then(data => {
        if(JSON.stringify(data) == JSON.stringify({})) { //If the ID doesn't exist, return
          return message.reply("that's not a valid ID! Try again.");
        }
      });

      //Update bhbinds table
      let setPromise = await new Promise(resolve => {
          db.all(`SELECT * FROM bhbinds WHERE discordID = "${user}"`, (err, rows) => {
            if(rows.length == 0) db.run("INSERT INTO bhbinds (discordID, discordGuild, bhID) VALUES (?, ?, ?)", [message.member.id, message.guild.id, collected.first().content]);
            else db.run(`UPDATE bhbinds SET bhID = "${collected.first().content}" WHERE discordID = "${user}"`);
          });

          setTimeout(() => resolve("Y"), 500);
      });

      let setResult = await setPromise;

      //Send successful message
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
