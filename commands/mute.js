/*
File: mute.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {modlogchannelid} = require("../config.json"); //get modlog channel

exports.run = (client, message, args, level) => {
    //Check if target is identified
    if(!args[0]) return message.reply('you must include the user to mute! Try again.');
    //Check that time is identified
    if(!args[1]) return message.reply('you need to specify a time! Try again.');

    //Find User
    var user = message.mentions.users.first();
    if(user == null || user == undefined) {
      try {
      user = client.users.cache.get(args[0]);
      } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!');
      }
    }
    let member = message.guild.members.cache.get(user.id);
    if(user == null || user == undefined) return message.reply('Invalid user! Try again.');

    //Piece together reason
    const reason = args.slice(2).join(" ");

    //Check if target is a staff member
    if(member.roles.cache.find(r => r.name === "Cat Core Council") && message.author.id != "302923939154493441") return message.reply("you shouldn't be moderating other staff members!");

    var muteTime = parseInt(args[1].slice(0, args[1].length - 1));
   	if (isNaN(muteTime)) return message.reply('that\'s not a number! Try again.');

    var timeMultiply;
    var unit = "";
    var checker = args[1];

    if(checker.includes("m")) {
      timeMultiply = 60;
      unit = " minute(s)";
    } else if(checker.includes("h")) {
      timeMultiply = 3600;
      unit = " hour(s)";
    } else if (checker.includes("d")) {
      timeMultiply = 86400;
      unit = " day(s)";
    } else if (checker.includes("s")) {
      timeMultiply = 1;
      unit = " second(s)";
    } else {
      return message.reply("you used an invalid time unit! You must use <d, h, m, s>.");
    }

    //Warn user for numbers that aren't parsable
    if(muteTime * timeMultiply * 1000 > 2073600000) {
      message.channel.send("Since this number is longer than what the program can parse, muting them for this long will PERMANENTLY mute them.");
    }

    //Stringify time
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

    var duration = muteTime + unit;
    if(muteTime * timeMultiply * 1000 > 2073600000) duration = "Permanent";
    var muteStatement = `${muteTime} ${unit}`;
    if(duration == "Permanent") muteStatement = "Permanent";

    //Insert into table
    db.run("INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)", [message.guild.id, message.author.id, user.id, "Mute", muteStatement, reason, now]);
    const embed = new Discord.MessageEmbed()
      .setTitle(`User ${user.username} was Muted.`)
      .setColor("#ffff00")
      .addField("Time: ", now)
      .addField("Moderator: ", `<@!${message.author.id}>`)
      .addField("Duration: ", `Mute (${duration})`)
      .addField("Reason: ", reason);

    //Give Target muted role
    let mutedRole = message.guild.roles.cache.find(role => role.name == "Muted");
    member.roles.add(mutedRole);

    //If mute time is NOT permanent, set timer to remove muted role
    if(muteTime * timeMultiply * 1000 <= 2073600000) {
      setTimeout(() => {message.mentions.members.first().roles.remove(mutedRole);}, muteTime * timeMultiply * 1000);
    }

    //Send necessary information to user
    message.guild.channels.cache.get(modlogchannelid).send(embed);
    message.mentions.users.first().send("You were muted (" + muteStatement + ") for: " + reason).catch(err => {});
    message.channel.send("Moderation Log Successful.")
    return;
}

exports.config = {
  name: "mute",
  usage: "mute <user> <time amount+ time unit> <reason>",
  description: "Mute a User!",
  category: "moderation",
  permissionLevel: 5,
  aliases: ['shutup', 'silence']
};
