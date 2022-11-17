/*
File: membercount.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');

exports.run = (client, message, args, level) => {
  var memberCount = 0; //Used to count members!

  let memberPromise = message.guild.members.cache.filter(member => {
    if(!member.user.bot) return member;
  }).forEach(member => {
    memberCount++;
  });

  //Send Member Count!
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
