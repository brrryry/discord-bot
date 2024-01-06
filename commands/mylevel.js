/*
File: mylevel.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");

exports.run = (client, message, args, level) => {
  //Return user's permission level
  return message.channel.send(`You are level ${level}!`);
};

exports.config = {
  name: "mylevel",
  usage: "mylevel",
  description: "Get your bot permission level!",
  category: "misc",
  permissionLevel: 0,
  aliases: ["ml"],
};
