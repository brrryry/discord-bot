const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
  const serverQueue = squeue.get(message.guild.id);

  if (!serverQueue) return message.channel.send("There are no songs that are currently playing/queued up!");

  var output = "";

  for(i = 0; i < serverQueue.songs.length; i++) {
    output += `${i + 1}. ${serverQueue.songs[i].title} (<@!${serverQueue.songs[i].user}>)\n`;
  }
  return message.channel.send(new Discord.MessageEmbed().setTitle("Song Queue!").setDescription(output));
}

exports.config = {
  name: "queue",
  usage: "queue",
  description: "Get the list of songs that are queued up!",
  category: "music",
  permissionLevel: 0,
  aliases: ['q']
};
