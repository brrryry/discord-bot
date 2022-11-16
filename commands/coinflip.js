/*
File: coinflip.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');

exports.run = async (client, message, args, level) => {
  let value = Math.floor(Math.random() * 2); //0 or 1
  //Output based on value!
  if(value == 0) return message.reply("The coin landed on heads!");
  return message.reply("The coin landed on tails!");
}

exports.config = {
  name: "coinflip",
  usage: "coinflip",
  description: "Flip a coin :D",
  category: "fun",
  permissionLevel: 0,
  aliases: ['cf']
};
