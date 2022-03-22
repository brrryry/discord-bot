const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

    const serverQueue = squeue.get(message.guild.id);
    if (!message.member.voice.channel) return message.channel.send("You have to be in a voice channel to stop the music!");
    if (!serverQueue) return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();

    if(serverQueue.songs.length == 1) return message.channel.send("That was the end of the queue. The bot will now leave the voice chat.");
}

exports.config = {
  name: "skip",
  usage: "skip",
  description: "Skip the current song!",
  category: "music",
  permissionLevel: 0,
  aliases: []
};