const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

    var user = message.mentions.users.first();

    if(user == null || user == undefined) {
      try {
        user = client.users.cache.get(args[0]);
      } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!3');
      }
    }

    db.all(`SELECT * FROM modlogs WHERE offender = "${user.id}"`, (err, rows) => {
      if(!rows) return message.reply("no logs were found!");
      var embed = new Discord.MessageEmbed().setTitle(`${user.username}\`s Modlogs: `);
      var value = "";
      var count = 0;
      var totalcount = 0;
      rows.forEach(row => {
        var reasonCheck = row.reason;
        var rowMuteTime = row.modtype;
        if(row.muteTime != 0) rowMuteTime = `Mute (${row.muteTime})`;
        var totalStatement = `\n\n**CASE: **${row.key}\n**TYPE: **${rowMuteTime}\n**MODERATOR: **<@!${row.moderator}>\n**OFFENDER: **<@!${row.offender}>\n**REASON: **${reasonCheck}\n**TIME: **${row.time}`;
        totalcount++;
        if(totalStatement.length + value.length > 2048) {
          embed.setDescription(value);
          message.channel.send(embed);
          embed = new Discord.MessageEmbed().setTitle(`${user.username}\`s Modlogs: `);
          count = 0;
          var rowMuteTime = row.modtype;
          if(row.muteTime != 0) rowMuteTime = `Mute (${row.muteTime})`;
          value = `\n\n**CASE: **${row.key}\n**TYPE: **${rowMuteTime}\n**MODERATOR: **<@!${row.moderator}>\n**OFFENDER: **<@!${row.offender}>\n**REASON: **${reasonCheck}\n**TIME: **${row.time}`;
          count++;
        } else {
          var rowMuteTime = row.modtype;
          if(row.muteTime != 0) rowMuteTime = `Mute (${row.muteTime})`;
          value = value + `\n\n**CASE: **${row.key}\n**TYPE: **${rowMuteTime}\n**MODERATOR: **<@!${row.moderator}>\n**OFFENDER: **<@!${row.offender}>\n**REASON: **${reasonCheck}\n**TIME: **${row.time}`;
          count++;
        }
        if(count == 5) {
          embed.setDescription(value);
          message.channel.send(embed);
          embed = new Discord.MessageEmbed().setTitle(`${user.username}\`s Modlogs: `);
          count = 0;
          value = "";
        }
      });

      embed.setDescription(value);
      message.channel.send(embed);
      message.channel.send(totalcount + " modlogs found!");
    });
}

exports.config = {
  name: "modlogs",
  usage: "modlogs <user/id>",
  description: "Gets the moderation logs of a spefic user!",
  category: "Moderation",
  permissionLevel: 5,
};
