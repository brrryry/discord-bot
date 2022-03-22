const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

    const voiceChannel = message.member.voice.channel;
    if(!voiceChannel) return message.channel.send("You aren't in a voice channel! You need to be in a voice channel to play music!");

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I do not have permissions to join/speak in this channel!");

    let songSearch = args.slice(0).join(" ");

    if(!songSearch) return message.channel.send("You need to input a search query! Try again.");

    if(songSearch.includes("list=")) { //if it's a playlist
      return message.reply("playlists aren't supported yet! Sorry!");
    } else {
      let video;
      try { //if video is url
        video = await ytdl.getBasicInfo(url);
      } catch (e) { //otherwise
        try {
          const results = await ytsr(songSearch, {limit: 5});
          const videos = results.items;
          console.log(videos);
          let index = 0;

          if(!videos.length) return message.channel.send("No videos were found in the search query! Try again.");

          await message.channel.send([
            "__**Song selection:**__",
            videos.map(v => `${++index} - **${v.title}**`).join("\n"),
            `**Select your song by sending the number from 1 to ${videos.length} in chat.**`
            ].join("\n\n"));

          let response;
          try {
            response = await message.channel.awaitMessages(msg => 0 < parseInt(msg.content) && parseInt(msg.content) < videos.length + 1 && msg.author.id == message.author.id, {
              max: 1,
              time: 30000,
              errors: ['time']
            });
          } catch(e) {
            return message.channel.send("Command cancelled (timeout exception).");
          }

          const videoIndex = parseInt(response.first().content);
          video = await ytdl.getBasicInfo(videos[videoIndex - 1].url.split("?v=")[1]);
        } catch (e) {
          console.log(e)
          return message.channel.send("An error occured.")
        }
      }

      await message.channel.send(`**${video.videoDetails.title}** has been added to the queue!`);
      return await queueSong(video, message, voiceChannel, squeue);
    }

}

async function queueSong(video, message, voiceChannel, queue) {
  const serverQueue = queue.get(message.guild.id)

  const song = {
    id: video.videoDetails.videoId,
    title: Discord.escapeMarkdown(video.videoDetails.title),
    url: video.videoDetails.video_url,
    user: message.member.id
  }

  if (!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel,
      connection: null,
      songs: [song],
      volume: 50,
      playing: true
    }

    try {
      const connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      queue.set(message.guild.id, queueConstruct);
      playSong(message.guild, queue, queueConstruct.songs[0]);
    } catch(e) {
      console.log(e)
      message.channel.send("An unknown error occoured.")
      return queue.delete(message.guild.id)
    }
  } else serverQueue.songs.push(song);

  return;
}

async function playSong(guild, queue, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  serverQueue.connection.play(ytdl(song.id), { bitrate: 'auto' })
    .on("speaking", speaking => {
      if (!speaking) {
        serverQueue.songs.shift();
        playSong(guild, queue, serverQueue.songs[0])
      }
    })
    .on("error", console.error)
    .setVolumeLogarithmic(serverQueue.volume / 100);

  serverQueue.textChannel.send(`Now playing **${song.title}**`)
}


exports.config = {
  name: "play",
  usage: "play <youtube search query/link>",
  description: "Play a song!",
  category: "music",
  permissionLevel: 0,
  aliases: ['p']
};
