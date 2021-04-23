const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {

  var memberCount = 0;

  let memberPromise = message.guild.members.cache.filter(member => {
    if(!member.user.bot) return member;
  }).forEach(member => {
    memberCount++;
  });

  return message.channel.send(`Member Count: ${memberCount}`);


}

exports.config = {
  name: "membercount",
  usage: "membercount",
  description: "Get the number of members in the server!",
  category: "utility",
  permissionLevel: 0,
  aliases: ['mc']
};
