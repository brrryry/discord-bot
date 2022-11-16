/*
File: dellog.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

exports.run = (client, message, args, level) => {
  //If no case number is provided, return
  if(!args[0]) return message.reply('you must include the case number! Try again.');

  //Use case ID to find row in table, and delete row
  const caseID = parseInt(args[0]);
  if (isNaN(caseID)) return message.reply('that\'s not a number! Try again.');
  db.run(`DELETE FROM modlogs WHERE key="${caseID}"`); //Deletion command

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
