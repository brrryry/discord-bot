/*
File: profile.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

exports.run = async (client, message, args, level) => {
  //Creating embed
  let Embed = new Discord.MessageEmbed();
  let roles = []; //used to store list of roles

  const memberList = message.guild.members.cache.map(m => m.id); //get all members, map their ids

  //Make variables to find IDs
  var member1 = message.member;
  var id = member1.id

  if(args[0]) {
    try {
      member1 = message.guild.members.cache.get(args[0]);
      id = args[0];
    } catch (error) {
      console.log("Error");
    }
  }

  if (message.mentions.members.first()) {
    member1 = message.mentions.members.first();
    id = message.mentions.members.first().id;
  }

  member1.roles.cache.forEach((role) => {
    if(role.name != "everyone") roles.push(role);
  });
  Embed.setTitle(`Your avatar!`);
  Embed.setThumbnail(member1.user.displayAvatarURL());
  Embed.setColor(`RANDOM`);

  var count = 1;
  var found = false;
  var rankxp = "";

  let getRankPromise = new Promise(resolve => {
    db.all(`SELECT * FROM xp WHERE guild = "${message.guild.id}" ORDER BY xpcount DESC`, (err, rows) => {
      if(!rows || rows.length == 0) return message.reply("This person isn't initialized in the database!")
      rows.forEach(row => {
        if(row.id == id && row.guild == message.guild.id) {
          rankxp += `Rank: ${count} (Level ${row.level} | ${row.xpcount} XP)`;
          resolve(rankxp);
        }
        count++;
      });
    });
  });
  let gotRank = await getRankPromise;
  if(rankxp == "") return message.channel.send(`This person isn't initialized in the database!`);

  //Customize/Send Embed
  Embed.setDescription(
    `Joined: ${Intl.DateTimeFormat("en-US").format(member1.joinedAt)}\nID: ${
      member1.id
    }\nPing: <@!${id}>\nRoles: \n${roles}\n\n${rankxp}`
  );
  return message.channel.send(Embed);
}

exports.config = {
  name: "profile",
  usage: "profile <user (optional)>",
  description: "Gets a server profile!",
  category: "misc",
  permissionLevel: 0,
  aliases: ['avatar']
};
