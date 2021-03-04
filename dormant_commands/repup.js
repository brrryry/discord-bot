const Discord = require("discord.js");

const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
    let Embed = new Discord.MessageEmbed();

    var member = message.member;
    var id = member.id
    var user = message.author;

    if (message.mentions.members.first()) {
      member = message.mentions.members.first();
      id = message.mentions.members.first().id;
      user = message.mentions.users.first();
    } else {
      return message.reply("you need to mention someone to give them reputation!");
    }

    if(!args[1]) return message.reply("you need to give a reason! Try again.");
    if(message.mentions.members.first().id == message.author.id) return message.channel.send("You can't give reputation to yourself! Try again.");


    var reason = args.slice(1).join(" ");

    var no = false;

    let timePromise = new Promise(resolve => {
      db.all(`SELECT * FROM rep WHERE senderid = ${message.author.id} AND guild = ${message.guild.id}`, (err, rows) => {
        rows.forEach(row => {
          if(Date.now() - row.time < 1000 * 60 * 60 * 24) no = true;
        });
      });
      setTimeout(() => resolve("Y"), 500);
    });

    let timeResult = await timePromise;

    if(no) return message.reply("you've already given reputation in the last 24 hours!");

    //rep values depending on staff roles, etc.
    //default is 1 for everyone
    var repvalue = 1;


    //get local Date
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

    db.run(`INSERT INTO rep (id, senderid, guild, rep, reason, time, timestring) VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, message.author.id, message.guild.id, repvalue, reason, Date.now(), now]);
    message.channel.send("Log Successful!");

}

exports.config = {
  name: "repup",
  usage: "repup <user> <reason>",
  description: "Give someone some reputation! [POSITIVE]",
  category: "reputation",
  permissionLevel: 0
};
