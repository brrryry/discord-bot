const Discord = require("discord.js");

exports.run = (client, message, args, level) => {
  const Discord = require('discord.js');
  const sql = require('sqlite3').verbose();
  var db = new sql.Database("db.sqlite");
  const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

    if(level < 5) return;
    if(!args[0]) return message.reply('you must include the case number! Try again.');

    const caseID = parseInt(args[0]);
   	if (isNaN(caseID)) return message.reply('that\'s not a number! Try again.');

    db.run(`DELETE FROM modlogs WHERE key="${caseID}"`);

    const embed1 = new Discord.MessageEmbed().setTitle(`Moderation Log Sucessfully Deleted.`);
    message.channel.send(embed1);
}

exports.config = {
  name: "dellog",
  usage: "dellog <number>",
  description: "Delete a Moderation Log!",
  category: "moderation",
  permissionLevel: 5
};
