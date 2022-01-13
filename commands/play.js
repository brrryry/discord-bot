const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

    const serverQueue = squeue.get(message.guild.id);

    const voiceChannel = message.member.voice.channel;
    if(!voiceChannel) return message.channel.send("You aren't in a voice channel! You need to be in a voice channel to play music!");

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I do not have permissions to join/speak in this channel!");

    const args0 = args[0];

    if(!args0) return message.channel.send("You need to input a search query! Try again.");
    const songInfo = await ytdl.getInfo(args0);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };

    if(!serverQueue) {
      const queueConstruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };

      squeue.set(message.guild.id, queueConstruct);


      try {
        queueConstruct.songs.push(song);
        var connection = await voiceChannel.join();
        queueConstruct.connection = connection;
        playsong(message.guild, queueConstruct.songs[0]);
      } catch (err) {
        console.log(err);
        squeue.delete(message.guild.id);
        return message.channel.send("There was an error in playing the song...");
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} is queued!`);
    }
}

function playsong(guild, song) {
  const serverQueue = squeue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    squeue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      playsong(guild, serverQueue.songs[0]);
    })
    .on("error", error => message.channel.send("There was an error in playing the song! Maybe the song isn't available..."));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

exports.config = {
  name: "play",
  usage: "play <youtube search query/link>",
  description: "Play a song!",
  category: "misc",
  permissionLevel: 0,
  aliases: ['p']
};
