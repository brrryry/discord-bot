/*
File: members.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");

exports.run = (client, message, args, level) => {
  //Check for role ping
  if (!message.mentions.roles.first())
    return message.channel.send("No role was mentioned. Try again!");
  //Get Role
  let chosenRole = message.mentions.roles.first();

  var embed = new Discord.EmbedBuilder();
  var embedDesc = "";
  var count = 0;

  //Find everyone with role
  message.guild.members.cache
    .filter((member) =>
      member.roles.cache.find((role) => role.id === chosenRole.id)
    )
    .forEach((member) => {
      count++;
      embedDesc += `<@!${member.id}>\n`;

      if (count % 25 === 0) {
        embed.addFields({ name: "\u200b", value: embedDesc, inline: true });
        embedDesc = "";
      }
    });

  embed.setTitle(`Members with the role "${chosenRole.name}" (${count})`);
  embed.addFields({ name: "\u200b", value: embedDesc, inline: true });
  embed.setColor("#D43FEB");

  return message.channel.send({ embeds: [embed] });
};

exports.config = {
  name: "members",
  usage: "members <role ping>",
  description: "Get the number of members with a certain role in the server!",
  category: "utility",
  permissionLevel: 5,
};
