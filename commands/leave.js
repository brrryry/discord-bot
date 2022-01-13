const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
  const serverQueue = squeue.get(message.guild.id);
  if (!message.member.voice.channel) return message.channel.send("You have to be in a voice channel to stop the music!");

  if (!serverQueue) return message.channel.send("There is no song that I could stop!");

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

exports.config = {
  name: "leave",
  usage: "leave",
  description: "Clears the song queue and leaves the call.",
  category: "misc",
  permissionLevel: 0,
  aliases: ['l']
};
