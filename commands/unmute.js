const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {
    if(!args[0]) return message.reply('you must include the user to unmute! Try again.');

    var user = message.mentions.users.first();

    if(user == null || user == undefined) {
      try {
      user = client.users.cache.get(args[0]);
      } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!');
      }
    }

    const reason = args.slice(1).join(" ");

    if(user == null || user == undefined) return message.reply('Invalid user! Try again.');

    if(user.roles.cache.find(r => r.name === "Staff") && message.author.id != "302923939154493441") return message.reply("you shouldn't be moderating other staff members!");

    var now = new Date().toLocaleDateString("en-US", {
      hourCycle: "h12",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
      timeZone: "America/New_York"
    });

    let mutedRole = message.guild.roles.cache.find(role => role.name == "Muted");
    if(!message.mentions.members.first().roles.cache.find(r => r.name === 'Muted')) return message.reply("this person isn't muted!");
    else message.mentions.members.first().roles.remove(mutedRole);

    db.run("INSERT INTO modlogs (moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?)", [message.author.id, user.id, "Unmute", "0", reason, now]);

    const embed = new Discord.MessageEmbed().setTitle(`User ${user.username} was Unmuted.`).setColor("#ffff00").addField("Time: ", now).addField("Moderator: ", `<@!${message.author.id}>`).addField("Duration: ", `Mute (${duration})`).addField("Reason: ", reason);


    message.guild.channels.cache.get(modlogchannelid).send(embed);
    message.mentions.users.first().send("You were muted (" + muteStatement + ") for: " + reason);
    message.channel.send("Moderation Log Successful.")
    return;
}

exports.config = {
  name: "unmute",
  usage: "unmute <user> <reason>",
  description: "Unmute a User!",
  category: "moderation",
  permissionLevel: 5
};
