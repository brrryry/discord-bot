const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const exec = require('child_process').exec;
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

  var user = message.author.id;
  message.channel.send("Please enter your twitch login name. Your login name should be ALL lowercase.\nI'll give you two minutes.").then(msg => {
    const filter = msg => msg.author.id === message.author.id;
    message.channel.awaitMessages(filter, {max: 1, time: 120000}).then(async (collected) => {

      var idTaken = false;
      let idTakenPromise = new Promise(resolve => {
        db.all(`SELECT * FROM bhbinds`, (err, rows) => {
          rows.forEach(row => {
            if(row.twitchID == collected.first().content) idTaken = true;
          });
        });
      });

      let idResult = await idTakenPromise;
      if(idResult) return message.reply("this ID is already taken!");

      let twitchCheckError = "";
      let twitchCheckPromise = new Promise((reject, resolve) => {
        message.channel.send(`Binding twitch account "${collected.first().content.toLowerCase()}"`)
        exec(`twitch api get /users -q login=${collected.first().content.toLowerCase()}`, (error, out, err) => {
          if(error) reject(error);
          else resolve({err, out});
        });
      }).catch(error => {
        twitchCheckError = error;
      });

      let twitchCheckResult = await twitchCheckPromise;
      if(twitchCheckResult == undefined && twitchCheckError != undefined) twitchCheckResult = twitchCheckError;

      try {
        twitchCheckResult = JSON.parse(twitchCheckResult.out);
      } catch (error) {
        console.log(error);
        return message.channel.send("An error occured. (Code 0x01: JSON Parse)");
      }

      console.log(twitchCheckResult);
      if(twitchCheckResult.data != undefined && twitchCheckResult.data.length > 0) {
        //twitch account found

        let twitchWritePromise = new Promise(resolve => {
          db.all(`SELECT * FROM twitchbinds WHERE id=${message.member.id} AND guild=${message.guild.id}`, (err, rows) => {
            if(!rows || rows.length == 0) db.run(`INSERT INTO twitchbinds (id, guild, twitchID) VALUES (?, ?, ?)`, [message.member.id, message.guild.id, twitchCheckResult.data[0].id]);
            else {
              rows.forEach(row => {
                db.run(`UPDATE twitchbinds SET twitchID=${twitchCheckResult.data[0].id} WHERE id=${message.member.id} AND guild=${message.guild.id}`);
              });
            }
          });
          setTimeout(() => resolve("Done!"), 500);
        });

        let twitchWriteResult = await twitchWritePromise;
        return message.channel.send("Channel successfuly bound!");
      }
      return message.channel.send("Something happened...");

    });
  });

}

exports.config = {
  name: "twitchbind",
  usage: "twitchbind",
  description: "Use this command to bind your twitch account!",
  category: "twitch",
  permissionLevel: 0,
  aliases: ['tbind']
};
