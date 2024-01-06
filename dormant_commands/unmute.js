/*
File: unmute.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

exports.run = (client, message, args, level) => {
    //Check for user
    if(!args[0]) return message.reply('you must include the user to unmute! Try again.');
    //Find user
    var user = message.mentions.users.first();
    if(user == null || user == undefined) {
      try {
      user = client.users.cache.get(args[0]);
      } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!');
      }
    }
    if(user == null || user == undefined) return message.reply('Invalid user! Try again.');

    //Piece together reason
    const reason = args.slice(1).join(" ");

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

    //Check if person is actually muted!
    let mutedRole = message.guild.roles.cache.find(role => role.name == "Muted");
    if(!message.mentions.members.first().roles.cache.find(r => r.name === 'Muted')) return message.reply("this person isn't muted!");
    else message.mentions.members.first().roles.remove(mutedRole);

    //Input into Table
    db.run("INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)", [message.guild.id, message.author.id, user.id, "Unmute", "0", reason, now]);

    //Create/Customize Embed
    const embed = new Discord.MessageEmbed()
      .setTitle(`User ${user.username} was Unmuted.`)
      .setColor("#ffff00")
      .addField("Time: ", now)
      .addField("Moderator: ", `<@!${message.author.id}>`)
      .addField("Reason: ", reason);

    //Send Necessary Data
    message.guild.channels.cache.find(c => c.name === "modlogs").send(embed);
    message.mentions.users.first().send("You were unmuted for: " + reason).catch(err => {});
    return message.channel.send("Moderation Log Successful.");
}

exports.config = {
  name: "unmute",
  usage: "unmute <user> <reason>",
  description: "Unmute a User!",
  category: "moderation",
  permissionLevel: 5,
  aliases: ['openmouf']
};
