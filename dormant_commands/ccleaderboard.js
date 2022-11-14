const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {

    db.all(`SELECT * FROM currency WHERE guild = "${message.guild.id}" ORDER BY currency DESC LIMIT 15`, (err, rows) => {
      var embed = new Discord.MessageEmbed().setTitle("Most Active Members").setFooter("Our most active members!");
      var value = "";
      var count = 0;
      rows.forEach(row => {
        count++;
        value += `**${count}**. <@!${row.id}>: ${row.currency} CC\n`;
      });
      embed.setDescription(value);
      return message.channel.send(embed);
    });



}

exports.config = {
  name: "ccleaderboard",
  usage: "ccleaderboard",
  description: "The most active people in the server.",
  category: "misc",
  permissionLevel: 10,
  aliases: ['ccl']
};
