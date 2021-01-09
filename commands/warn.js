exports.run = async (client, message, args, level) => {
  const Discord = require('discord.js');
  const sql = require('sqlite3').verbose();
  var db = new sql.Database("db.sqlite");
  const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

  if(!args[0]) return message.reply(`you must include the user to warn! Try again.`);
  if(!args[1]) return message.reply(`you must give a reason! Try again.`);

  var user = message.mentions.members.first();
  if(user == null || user == undefined) {
    try {
      user = client.users.cache.get(args[0]);
    } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!');
    }
  }

  const reason = args.slice(1).join(" ");
  if(user == null || user == undefined) return message.reply("this user cannot be found!");

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

    db.run(`INSERT INTO modlogs (moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?)`, [message.author.id, user.id, "warn", 0, reason, now]);
    const embed = new Discord.MessageEmbed().setTitle(`User ${user.username} was Warned.`).setColor("#ffff00").addField("Time: ", now).addField("Moderator: ", `<@!${message.author.id}>`).addField("Reason: ", reason);
    message.guild.channels.cache.get(modlogchannelid).send(embed);
    message.mentions.users.first().send("You were warned for: " + reason);
    message.channel.send("Moderation Log Successful.")
    return;
}


exports.config = {
  name: "warn",
  usage: "warn <user> <reason>",
  description: "Warn a user!",
  category: "Moderation",
  permissionLevel: 5,
};