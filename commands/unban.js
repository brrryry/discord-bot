exports.run = async (client, message, args, level) => {
  const Discord = require('discord.js');
  const sql = require('sqlite3').verbose();
  var db = new sql.Database("db.sqlite");
  const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

  if(!args[0]) return message.reply(`you must include the user to ban! Try again.`);
  if(!args[1]) return message.reply(`you must give a reason! Try again.`);
  let userID = args[0];
  const reason = args.slice(1).join(" ");

  message.guild.fetchBans().then(async bans => {
    if(bans.size == 0) return message.reply("this person isn't banned! Try again.");
    let bUser = bans.find(b => b.user.id === userID);
    if(!bUser) return message.reply("this person isn't banned! Try again.");

    var unappealable = false;


    let unappealPromise = new Promise(resolve => {
      db.all(`SELECT * FROM modlogs WHERE id = "${bUser.id}"`, (err, rows) => {
        if(rows) {
          rows.forEach(row => {
            if(row.modtype === "uban") unappealable = true;
          })
        }
      });

      setTimeout(() => resolve("!"), 500);
    });

    let unappealResult = await unappealPromise;

    if(unappealable) return message.reply("this person has an unappealed ban!");

    message.guild.members.unban(bUser.user);
  });

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

    db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, message.author.id, userID, "Unban", 0, reason, now]);
    const embed = new Discord.MessageEmbed().setTitle(`User ${user.username} was Unbanned.`).setColor("#ffff00").addField("Time: ", now).addField("Moderator: ", `<@!${message.author.id}>`).addField("Reason: ", reason);
    message.guild.channels.cache.find(c => c.name === "modlogs").send(embed);
    message.mentions.users.first().send("You were Unbanned for: " + reason);
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
