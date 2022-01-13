const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
  message.channel.send("Checking...");

  const memberIDList = message.guild.members.cache.map(m => m.id);
  var updated = 0;


  let updatePromise = new Promise(resolve => {
    memberIDList.forEach(async id => {

      var flag = false;

      let loopPromise = new Promise(resolve => {

        db.all(`SELECT * FROM xp WHERE id = ${id} AND guild = ${message.guild.id}`, (err, rows) => {
          if(rows.length == 0) {
           db.run(`INSERT INTO xp (id, guild, level, xpcount) VALUES (?, ?, ?, ?)`, [id, message.guild.id, 0, 0]);
           flag = true;
          }
        });

        setTimeout(() => resolve("!"), 250);
      });

      let loopResult = await loopPromise;
      if(flag) updated++;
      console.log(updated);
    });

    setTimeout(() => resolve("!"), 30000);
  });

  let updatedResult = await updatePromise;

  message.channel.send("Update Complete! " + updated + " members have been initialized.");
}

exports.config = {
  name: "dbupdate",
  usage: "dbupdate",
  description: "Universal dbinit command",
  category: "utility",
  permissionLevel: 10
};
