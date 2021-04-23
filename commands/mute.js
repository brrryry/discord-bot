const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = (client, message, args, level) => {
    if(!args[0]) return message.reply('you must include the user to mute! Try again.');

    var user = message.mentions.users.first();

    if(user == null || user == undefined) {
      try {
      user = client.users.cache.get(args[0]);
      } catch (error) {
      return message.reply('Couldn\'t get a Discord user with this userID!');
      }
    }

    const reason = args.slice(2).join(" ");

    if(user == null || user == undefined) return message.reply('Invalid user! Try again.');


    if(user.roles.cache.find(r => r.name === "Staff") && message.author.id != "302923939154493441") return message.reply("you shouldn't be moderating other staff members!");

    if(!args[1]) return message.reply('you need to specify a time! Try again.');

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

    if(muteTime * timeMultiply * 1000 > 2073600000) {
      message.channel.send("Since this number is longer than what the program can parse, muting them for this long will PERMANENTLY mute them.");
    }


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

    db.run("INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)", [message.guild.id, message.author.id, user.id, "Mute", muteStatement, reason, now]);
    //message.reply("Warn Suceeded.");



    const embed = new Discord.MessageEmbed().setTitle(`User ${user.username} was Muted.`).setColor("#ffff00").addField("Time: ", now).addField("Moderator: ", `<@!${message.author.id}>`).addField("Duration: ", `Mute (${duration})`).addField("Reason: ", reason);

    let mutedRole = message.guild.roles.cache.find(role => role.name == "Muted");
    message.guild.channels.cache.find(c => c.name === "modlogs").send(embed);
    if(muteTime * timeMultiply * 1000 <= 2073600000) {
      setTimeout(() => {message.mentions.members.first().roles.remove(mutedRole);}, muteTime * timeMultiply * 1000);
    }


    message.guild.channels.cache.get(modlogchannelid).send(embed);
    message.mentions.users.first().send("You were muted (" + muteStatement + ") for: " + reason);
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
