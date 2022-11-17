/*
File: warn.js
Contributors:
  -vKitsu
*/

//Get Depedencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {modlogchannelid} = require("../config.json");

exports.run = async (client, message, args, level) => {
  //Check for user and reason
  if(!args[0]) return message.reply(`you must include the user to warn! Try again.`);
  if(!args[1]) return message.reply(`you must give a reason! Try again.`);

  //Find User
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
  if(user.roles.cache.find(r => r.name === "Cat Core Council") && message.author.id != "302923939154493441") return message.reply("you shouldn't be moderating other staff members!");

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

    //Input into table
    db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, message.author.id, user.id, "Warn", 0, reason, now]);
    
    //Create/Customize Embed
    const embed = new Discord.MessageEmbed()
      .setTitle(`User ${user.username} was Warned.`)
      .setColor("#ffff00")
      .addField("Time: ", now)
      .addField("Moderator: ", `<@!${message.author.id}>`)
      .addField("Reason: ", reason);

    //Send Necessary Stuff
    message.guild.channels.cache.get(modlogchannelid).send(embed);
    message.mentions.users.first().send("You were warned for: " + reason).catch(err => {});
    message.channel.send("Moderation Log Successful.")
    return;
}

exports.config = {
  name: "warn",
  usage: "warn <user> <reason>",
  description: "Warn a user!",
  category: "moderation",
  permissionLevel: 5,
  aliases: ['boop', 'smack', 'bonk'],
};
