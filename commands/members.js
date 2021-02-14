const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {

  let chosenRole = message.mentions.roles.first();

  var embed = new Discord.MessageEmbed();
  var embedDesc = "";
  var count = 0;

  let memberPromise = message.guild.members.cache.filter(member => {
    return member.roles.cache.find(r => r.id === chosenRole.id);
  }).forEach(member => {
    count++;
    embedDesc += `<@!${member.id}>\n`;

    if(count % 25 == 0) {
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
  name: "membercount",
  usage: "membercount",
  description: "Get the number of members in the server!",
  category: "utility",
  permissionLevel: 5
};
