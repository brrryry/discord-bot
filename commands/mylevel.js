const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {
    return message.channel.send(`You are level ${level}!`);
}

exports.config = {
  name: "mylevel",
  usage: "mylevel",
  description: "Get your bot permission level!",
  category: "misc",
  permissionLevel: 0,
  aliases: ['mlllll']
};
