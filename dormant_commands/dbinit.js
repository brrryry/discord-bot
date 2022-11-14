const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {
  message.channel.send("Checking...");

  db.all(`SELECT * FROM xp WHERE id = "${message.author.id}" AND guild = "${message.guild.id}"`, (err, rows) => {
    if(rows.length == 0) {
      db.run("INSERT INTO xp (id, guild, level, xpcount) VALUES (?, ?, ?, ?)", [message.author.id, message.guild.id, 0, 0]);
      message.channel.send("XP Database Initialized!");
    } else {
      message.channel.send("Your XP Database is already initialized.")
      console.log(rows);
    }
  });

}

exports.config = {
  name: "dbinit",
  usage: "dbinit",
  description: "Initialize yourself in the database!",
  category: "utility",
  permissionLevel: 0
};
