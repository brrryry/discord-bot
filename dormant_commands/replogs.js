const Discord = require("discord.js");

const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
    let Embed = new Discord.MessageEmbed();

    var member = message.member;
    var id = member.id
    var user = message.author;

    if (message.mentions.members.first()) {
      member = message.mentions.members.first();
      id = message.mentions.members.first().id;
      user = message.mentions.users.first();
    }

    db.all(`SELECT * FROM rep WHERE id = "${id}" AND guild = "${message.guild.id}"`, (err, rows) => {
      if(rows.length == 0) return message.reply("no logs were found!");
      var embed = new Discord.MessageEmbed().setTitle(`${user.username}\`s Reputation Logs: `);
      var value = "";
      var count = 0;

      rows.forEach(row => {
        value = value + `\n\n**TIME: **${row.timestring}\n**REPVALUE: **${row.rep}\n**SENDER: **<@!${row.senderid}>\n**REASON: **${row.reason}`;
        count++;

        if(count % 5 == 0 && count != 0) {
          embed.setDescription(value);
          message.channel.send(embed);
          embed = new Discord.MessageEmbed().setTitle(`${user.username}\`s Reputation Logs: `);
          value = "";
        }
      });

      if(count == 0) return message.channel.send("No logs were found!");
      embed.setDescription(value);
      message.channel.send(embed);

      message.channel.send(count + " logs found!");
    });

}

exports.config = {
  name: "replogs",
  usage: "replogs <user (optional)>",
  description: "Get someone's detailed reputation logs!",
  category: "reputation",
  permissionLevel: 0
};
