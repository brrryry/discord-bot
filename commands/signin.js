const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const exec = require('child_process').exec;
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

let signin_ids = [];

exports.run = async (client, message, args, level) => {
    let date = new Date();
    var streaming = false;

    let streamCheckError = "";

    let streamCheckPromise = new Promise((reject, resolve) => {
      exec('twitch api get /streams -q user_login=youlikec3ts', (error, out, err) => {
        if(error) reject(error);
        else resolve({err, out});
      });
    }).catch((error) => {
      streamCheckError = error;
      return;
    });

    let twitchCheckResult = await streamCheckPromise;

    if(twitchCheckResult == undefined && streamCheckError != undefined) twitchCheckResult = streamCheckError;

    if(twitchCheckResult != undefined && twitchCheckResult.data.length > 0) streaming = true;
    //if they're streaming..then...
    if(streaming) {
      for(i = 0; i < signin_ids.length; i++) {
        if(signin_ids[i].id == message.member.id && date.getTime() - signin_ids[i].time <= 1000 * 60 * 60 * 24) return message.reply("You've already signed in within the past 24 hours. Try again later.");
        else {
            signin_ids.push({
              "id": message.member.id,
              "time": date.getTime()
            });
            if(signin_ids.length >= 1000) messageLogs.shift();

            //give cat coins
            let ccPromise = new Promise((reject, resolve) => {
              db.all(`SELECT * FROM currency WHERE guild=${message.guild.id} AND id=${message.member.id}`, (err, rows) => {
                rows.forEach(row => {
                  db.run(`UPDATE currency SET currency=${row.currency} + 15 WHERE guild=${message.guild.id} AND id=${message.member.id}`);
                });
              });

              setTimeout(() => resolve("!"), 500);
            });
            let ccResult = await ccPromise;

            return message.channel.send("Thanks for tuning in! You have been given 15 Cat Coins.");

        }
      }

    } else {
      return message.reply("the stream is not currently live. Try again later.");
    }
}

exports.config = {
  name: "signin",
  usage: "signin",
  description: "Use this command during a stream to earn some Cat Coins!",
  category: "twitch",
  permissionLevel: 0,
  aliases: []
};
