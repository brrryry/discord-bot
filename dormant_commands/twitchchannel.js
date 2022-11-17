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
  //find twitch channel
  var twitchChannelFound = false;

  if(!args[0]) return message.reply("you need to input a channel! Try again.");

  let channelName = args[0];
  channelName = channelName.replace("https://twitch.tv/", "");
  channelName = channelName.replace("https://www.twitch.tv/", "");
  channelName = channelName.toLowerCase();
  message.channel.send(`Searching for ${channelName}...`)

  let channelSearchError = "";

  let channelSearchPromise = new Promise((reject, resolve) => {
    exec(`twitch api get /users -q login=${channelName}`, (error, out, err) => {
      if(err) reject(error);
      else resolve({err, out});
    });
  }).catch(error => {
    channelSearchError = error;
  });

  let channelSearchResult = await channelSearchPromise;

  //console.log(channelSearchResult);

  if(channelSearchResult == undefined && channelSearchError != undefined) channelSearchResult = channelSearchError;

  if(channelSearchResult == undefined) return message.reply("this channel has no data. Are you sure that it exists?");

  //console.log(channelSearchResult.out);
  let channelInfo = JSON.parse(channelSearchResult.out);
  channelInfo = channelInfo.data[0];
  if(channelInfo == undefined) return message.reply("this channel has no data. Are you sure that it exists?");

  let channelEmbed = new Discord.MessageEmbed().setTitle(`Streamer info: ${channelInfo.display_name}`);
  if(channelInfo.display_name == "YouLikeC3ts") channelEmbed.setColor("A020F0");
  let channelBroadcasterType = "Regular Broadcaster";
  if(channelInfo.broadcaster_type != "") channelBroadcasterType = channelInfo.broadcaster_type.charAt(0).toUpperCase() + channelInfo.broadcaster_type.slice(1) + " Broadcaster";
  channelEmbed.addField(`ID: `, `${channelInfo.id}`);
  channelEmbed.addField(`Link: `, `https://www.twitch.tv/${channelInfo.login}`);
  channelEmbed.addField(`Broadcaster Type: `, `${channelBroadcasterType}`);
  channelEmbed.addField(`Date Created: `, `${channelInfo.created_at.substring(0, 10)}`);
  let channelDesc = "(N/A)";
  if(channelInfo.description != "") channelDesc = channelInfo.description;
  channelEmbed.addField(`Description: `, `${channelDesc}`);

  //get follower count (seperate algorithm)
  let channelFollowError = "";

  let channelFollowPromise = new Promise((reject, resolve) => {
    exec(`twitch api get /users/follows -q to_id=${channelInfo.id} -q first=1`, (error, out, err) => {
      if(error) reject(error);
      else resolve({err, out});
    });
  }).catch(error => {
    channelFollowError = error;
  });

  let channelFollowResult = await channelFollowPromise;
  if(channelFollowResult == undefined && channelFollowError != undefined) channelFollowResult = channelFollowError;
  channelEmbed.addField(`Total Follower Count: `, `${JSON.parse(channelFollowResult.out).total}`);



  channelEmbed.addField(`Total View Count: `, `${channelInfo.view_count}`);
  channelEmbed.setThumbnail(`${channelInfo.profile_image_url}`);




  return message.channel.send(channelEmbed);


}

exports.config = {
  name: "twitchchannel",
  usage: "twitchchannel [Twitch Channel Name]",
  description: "Use this command to find data on a streamer!",
  category: "twitch",
  permissionLevel: 0,
  aliases: ['tc']
};
