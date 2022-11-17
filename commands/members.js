/*
File: members.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');

exports.run = (client, message, args, level) => {
  //Check for role ping
  if(message.mentions.roles.first()) return message.channel.send("No role was mentioned. Try again!");
  //Get Role
  let chosenRole = message.mentions.roles.first();

  var embed = new Discord.MessageEmbed();
  var embedDesc = "";
  var count = 0;

  //Find everyone with role
  let memberPromise = message.guild.members.cache.filter(member => {
    return member.roles.cache.find(r => r.id === chosenRole.id);
  }).forEach(member => {
    count++;
    embedDesc += `<@!${member.id}>\n`;

    if(count % 25 == 0) {
      //Create a new column/section
      embed.addField('\u200b', embedDesc, true);
      embedDesc = "";
    }
  });

  embed.setTitle(`Members with the role "${chosenRole.name}" (${count})`);
  embed.addField('\u200b', embedDesc, true);
  embed.setColor("#D43FEB");

  return message.channel.send(embed);
}

exports.config = {
  name: "members",
  usage: "members <role ping>",
  description: "Get the number of members with a certain role in the server!",
  category: "utility",
  permissionLevel: 5
};
