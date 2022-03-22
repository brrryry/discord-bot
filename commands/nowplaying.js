const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
  const serverQueue = squeue.get(message.guild.id);

  if (!serverQueue) return message.channel.send("There are no songs that are currently being played!");

  return message.channel.send(`Current Song: ${serverQueue.songs[0].title}\nURL: ${serverQueue.songs[0].url}`);
}

exports.config = {
  name: "nowplaying",
  usage: "nowplaying",
  description: "Gives you the current song name!",
  category: "music",
  permissionLevel: 0,
  aliases: ['np']
};
