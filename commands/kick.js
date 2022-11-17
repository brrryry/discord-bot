/*
File: kick.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
  
exports.run = async (client, message, args, level) => {
  //Check for enough arguments
  if(!args[0]) return message.reply(`you must include the user to kick! Try again.`);
  if(!args[1]) return message.reply(`you must give a reason! Try again.`);

  //Find Target (ID or ping)
  var user = message.mentions.users.first();
  if(user == null || user == undefined) {
    try {
      user = client.users.cache.get(args[0]);
    } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!');
    }
  }
  if(user == null || user == undefined) return message.reply("this user cannot be found!");

  //Piece together reason
  const reason = args.slice(1).join(" ");

  //Check if target is a staff member
  if(member.roles.cache.find(r => r.name === "Cat Core Council") && message.author.id != "302923939154493441") return message.reply("you shouldn't be moderating other staff members!");
  //Stringify Time
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

    //Input Modlog into Database
    db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, message.author.id, user.id, "Kick", 0, reason, now]);
    //Create/Customize Embed
    const embed = new Discord.MessageEmbed()
      .setTitle(`User ${user.username} was Kicked.`)
      .setColor("#ffff00")
      .addField("Time: ", now)
      .addField("Moderator: ", `<@!${message.author.id}>`)
      .addField("Reason: ", reason);

    message.guild.channels.cache.find(c => c.name === "modlogs").send(embed);
    message.mentions.users.first().send("You were kicked for: " + reason).catch(err => {});
    message.mentions.members.first().kick();
    return message.channel.send("Moderation Log Successful.")
}

exports.config = {
  name: "kick",
  usage: "kick <user> <reason>",
  description: "Kick a user!",
  category: "moderation",
  permissionLevel: 5,
  aliases: ['yeet']
};
