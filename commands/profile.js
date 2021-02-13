const Discord = require("discord.js");

const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {
    let Embed = new Discord.MessageEmbed();
    let roles = [];

      var member1 = message.member;
      var id = member1.id

      const memberList = message.guild.members.cache.map(m => m.id);


      if (message.mentions.members.first()) {
        member1 = message.mentions.members.first();
        id = message.mentions.members.first().id;
      }


      if(args[0]) {
        for(i = 0; i < memberList.length; i++) {
          if(args[0] === memberList[i]) {
            id = args[0];
            member1 = message.guild.members.cache.get(args[0]);
          }
        }
      }

      member1.roles.cache.forEach((role) => {
        if(role.name != "everyone") roles.push(role);
      });
      Embed.setTitle(`Your avatar!`);
      Embed.setThumbnail(member1.user.displayAvatarURL());
      Embed.setColor(`RANDOM`);

      var count = 1;
      var found = false;
      var rankxp = "Rank: ";
      var rankadd = await getRankString(message, id);

      //console.log(rankadd);
      if(rankadd == "m") return message.channel.send(`You aren't initialized in this database! Do ${prefix}dbinit to initalize yourself!`);

      rankxp += rankadd;


      Embed.setDescription(
        `Joined: ${Intl.DateTimeFormat("en-US").format(member1.joinedAt)}\nID: ${
          member1.id
        }\nPing: <@!${id}>\nRoles: \n${roles}\n\n${rankxp}`
      );
      return message.channel.send(Embed);
}

async function getRankString(message, lol) {

  let result = await getSQL(message, lol);
  return result;
}

async function getSQL(message, lol) {
  let promise = new Promise(function(resolve) {


     db.all(`SELECT * FROM xp WHERE guild = "${message.guild.id}" ORDER BY xpcount DESC;`, (err, rows) => {
       var count = 1;
       var found = false;
       rows.forEach(row => {

         if(lol === row.id) {
           found = true;
           console.log(count + " (Level " + row.level + ", " + row.xpcount + " XP)");
           resolve(count + " (Level " + row.level + "  |  " + row.xpcount + " XP)");
         }
         if(!found) count++;
        });

        if(!found) resolve("m");
     });
  });

  let result = await promise;
  //console.log(result);
  return result;
}

exports.config = {
  name: "profile",
  usage: "profile <user (optional)>",
  description: "Gets a server profile!",
  category: "misc",
  permissionLevel: 0
};
