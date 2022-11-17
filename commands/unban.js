/*
File: unban.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

exports.run = async (client, message, args, level) => {
  //Check for user and reasons
  if(!args[0]) return message.reply(`you must include the user to ban! Try again.`);
  if(!args[1]) return message.reply(`you must give a reason! Try again.`);
  let userID = args[0];
  const reason = args.slice(1).join(" ");

  //Check if the person is actually banned
  message.guild.fetchBans().then(async bans => {
    if(bans.size == 0) return message.reply("this person isn't banned! Try again.");
    let bUser = bans.find(b => b.user.id === userID);
    if(!bUser) return message.reply("this person isn't banned! Try again.");
    //Otherwise, unban!
    message.guild.members.unban(bUser.user);
  });

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
    
    //Input into Table
    db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, message.author.id, userID, "Unban", 0, reason, now]);
    //Create/Customize embed
    const embed = new Discord.MessageEmbed()
      .setTitle(`User ${user.username} was Unbanned.`)
      .setColor("#ffff00")
      .addField("Time: ", now)
      .addField("Moderator: ", `<@!${message.author.id}>`)
      .addField("Reason: ", reason);
    
    //Send Necessary Data
    message.guild.channels.cache.find(c => c.name === "modlogs").send(embed);
    message.mentions.users.first().send("You were Unbanned for: " + reason).catch(err => {});
    message.mentions.users.first().unban();
    message.channel.send("Moderation Log Successful.")
    return;
}

exports.config = {
  name: "unban",
  usage: "unban <user> <reason>",
  description: "Unban a user!",
  category: "moderation",
  permissionLevel: 5
};
