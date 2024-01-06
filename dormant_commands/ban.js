/*
File: ban.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");
const sql = require("sqlite3").verbose();
var db = new sql.Database("db.sqlite");
const { modlogchannelid } = require("../config.json");

exports.run = async (client, message, args, level) => {
  if (!args[0])
    return message.reply(`you must include the user to ban! Try again.`); //Providing a user
  if (!args[1]) return message.reply(`you must give a reason! Try again.`); //Providing a reason

  //Try to look for a user OR discord ID in args[0]
  var user = message.mentions.users.first();
  if (user == null || user == undefined) {
    try {
      user = client.users.cache.get(args[0]);
    } catch (error) {
      return message.reply("Couldn't get a Discord user with this userID!");
    }
  }

  //Piece together all other args as "reason"
  const reason = args.slice(1).join(" ");
  if (user == null || user == undefined)
    return message.reply("this user cannot be found!");

  //Check if target is a moderator
  if (
    member.roles.cache.find((r) => r.name === "Moderator") &&
    message.author.id != "302923939154493441"
  )
    return message.reply("you shouldn't be moderating other staff members!");

  //Format date
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
    timeZone: "America/New_York",
  });

  //Insert Modlog
  db.run(
    `INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [message.guild.id, message.author.id, user.id, "aban", 0, reason, now]
  );

  //Create/Send Embed
  const embed = new Discord.EmbedBuilder()
    .setTitle(`User ${user.username} was Banned.`)
    .setColor("#ffff00")
    .addField("Time: ", now)
    .addField("Moderator: ", `<@!${message.author.id}>`)
    .addField("Reason: ", reason);
  message.guild.channels.cache.find((c) => c.id == modlogchannelid).send(embed);

  message.mentions.users
    .first()
    .send("You were banned (appealable) for: " + reason)
    .catch((err) => {}); //DM Ban Notification
  message.mentions.members.first().ban(); //Ban
  message.channel.send("Moderation Log Successful."); //Report Successful Logs
  return;
};

exports.config = {
  name: "ban",
  usage: "ban <user> <reason>",
  description: "Ban a user!",
  category: "moderation",
  permissionLevel: 5,
  aliases: ["poof", "byebye", "thanossnap"],
};
