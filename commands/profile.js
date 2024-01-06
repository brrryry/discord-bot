/*
File: profile.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");
const { AsyncDatabase } = require("promised-sqlite3");

exports.run = async (client, message, args, level) => {
  const db = await AsyncDatabase.open("db.sqlite");
  //Creating embed
  let Embed = new Discord.EmbedBuilder();
  let roles = []; //used to store list of roles

  //Make variables to find IDs
  var member1 = message.member;
  var id = member1.id;

  if (args[0]) {
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
    if (role.name !== "@everyone") roles.push(role);
  });

  Embed.setTitle(`Your avatar!`);
  Embed.setThumbnail(member1.user.displayAvatarURL());
  Embed.setColor(0x6a5b8e);

  var count = 1;
  var found = false;
  var rankxp = "";

  let rows = await db.all(`SELECT * FROM xp ORDER BY xp DESC`);

  if (!rows || rows.length == 0)
    return message.reply("This person isn't initialized in the database!");
  rows.forEach((row) => {
    if (row.id === id)
      rankxp += `Rank: ${count} (Level ${row.level} | ${row.xp} XP)`;
    else count++;
  });

  //Customize/Send Embed
  Embed.setDescription(
    `Joined: ${Intl.DateTimeFormat("en-US").format(member1.joinedAt)}\nID: ${
      member1.id
    }\nPing: <@!${id}>\nRoles: \n${roles}\n\n${rankxp}`
  );
  return message.channel.send({ embeds: [Embed] });
};

exports.config = {
  name: "profile",
  usage: "profile <user (optional)>",
  description: "Gets a server profile!",
  category: "misc",
  permissionLevel: 0,
  aliases: ["avatar, me"],
};
