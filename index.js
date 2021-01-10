//Basic requirements
const Discord = require('discord.js');
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("./config.json"); //get the prefix, token, status and welcome channel id
const fs = require ("fs");

//sql database setup
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const client = new Discord.Client();
client.commands = new Discord.Collection();

//message logs and xp setup
let messageLogs = [];
let warnLogs = [];
let xpMessage = [];

messageLogs.push({
    "message": "1",
    "author": "1",
    "time": "1"
});

xpMessage.push({
  "author": "1",
  "lastTime": "1"
});

warnLogs.push({
  "author": "1",
  "time": "1"
});

//command handler setup
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for(const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
  console.log(`Loaded ${command.config.name}.`);
}

//client startup
client.on('ready', (reaction, user) => {
  client.user.setActivity(` ${status}`, {type: 'PLAYING'}); //set status of bot when it's online

  //fetch message for reaction roles
  client.guilds.cache.get("796168991458066453").channels.cache.get("797261159035306004").messages.fetch("797649294243921961");

  console.log("Bot startup successful!");
});

//client on member join
client.on("guildMemberAdd", async member => {
  var welcomeChannel = member.guild.channels.cache.get(gatewaychannelid); //welcome channel
  welcomeChannel.send(`<@!${member.id}> has just joined the server!`);

  var memberRole = member.guild.roles.cache.get("797260531378552842");
  member.roles.add(memberRole);
  //calculate levels upon joining with await/async stuff
  let setLevelOnJoinPromise = new Promise((resolve) => {
    db.all(`SELECT * FROM xp WHERE id = "${member.id}"`, (err, rows) => {
      if(rows.length == 0) {
        updateLevelRoles(member, 0);
        db.run(`INSERT INTO xp (id, level, xpcount) VALUES (?, ?, ?)`, [member.id, 0, 0]);
      } else {
        rows.forEach(row => {
          updateLevelRoles(member, row.level);
        });
      }
    });

    setTimeout(() => resolve("!"), 1000);
  })

  let setLevelOnJoinResult = await setLevelOnJoinPromise;
});

//client on member remove
client.on("guildMemberRemove", async member => {
  var goodbyeChannel = member.guild.channels.cache.get(gatewaychannelid);
  goodbyeChannel.send(`<@!${member.id}> just left the server!`);
});

//client on edited message
client.on("messageUpdate", async (oldmessage, newmessage) => {
  if(oldmessage.content === newmessage.content || oldmessage.author.bot) return;
  var messageChannel = message.guild.channels.cache.get(messagechannelid);

  var embed = new Discord.MessageEmbed().setTitle("Message Edited").setColor("#ffff00").setDescription(`User: <@!${newmessage.member.id}>\nChannel: <#${newmessage.channel.id}>\n\nOld Message:\n${oldmessage.content}\n\nNew Message:\n${newmessage.content}`);
  return messageChannel.send(embed);
})

//client on deleted message
client.on("messageDelete", async message => {
  if(message.author.bot) return;
  var messageChannel = message.guild.channels.cache.get(messagechannelid);

  var embed = new Discord.MessageEmbed().setTitle("Message Deleted").setColor("#ff0000").setDescription(`User: <@!${message.member.id}>\nChannel: <#${message.channel.id}>\nMessage:\n${message}`);
  return messageChannel.send(embed);
})

//identifiers and reaction role names
var identifiers = ["%E2%8F%AF%EF%B8%8F", "%F0%9F%93%9D", "%F0%9F%8E%AE"];
var reactionRoleNames = ["797261727723945985", "797259962693976066", "797259281057054760"];

//on message react (used for reaction roles)
client.on("messageReactionAdd", async (reaction, user) => {
  console.log(reaction.emoji.identifier);
  for(var i = 0; i < identifiers.length; i++) {
    let reactionRole = reaction.message.guild.roles.cache.get(reactionRoleNames[i]);
    console.log(reactionRole.id);
    if(reaction.emoji.identifier == identifiers[i] && reaction.message.channel.id == "797261159035306004") reaction.message.guild.members.cache.get(user.id).roles.add(reactionRole);
  }
})

client.on("messageReactionRemove", async (reaction, user) => {
  console.log(reaction.emoji.identifier);
  for(var i = 0; i < identifiers.length; i++) {
    let reactionRole = reaction.message.guild.roles.cache.get(reactionRoleNames[i]);
    if(reaction.emoji.identifier == identifiers[i] && reaction.message.channel.id == "797261159035306004") reaction.message.guild.members.cache.get(user.id).roles.remove(reactionRole);
  }
})

//client on message send
client.on("message", async message => {

  let date = new Date();

  if(!message.author.bot && message.member.roles.cache.some(role => role.name === 'Muted')) return;

  //system variables
  var antiSpamOn = true;
  var xpSystemOn = true;


  messageLogs.push({
      "message": message.content,
      "author": message.author.id,
      "time": date.getTime()
  });

  if(messageLogs.length >= 500) messageLogs.shift();


  //xp system

  if(xpSystemOn && !message.author.bot) {
    var notInitYet = true;
    for(var i = 0; i < xpMessage.length; i++) {
      if(message.author.id == xpMessage[i].author) notInitYet = false;
    }

    var alreadyLooped = false;


    for(var i = 0; i < xpMessage.length; i++) {
      if(!alreadyLooped && (notInitYet || (message.author.id === xpMessage[i].author && date.getTime() - xpMessage[i].lastTime >= 1000 * 60))) { //more than 60 seconds
        //set and add xp
        xpMessage.push({
          "author": message.author.id,
          "lastTime": date.getTime
        });
        if(xpMessage.length >= 500) xpMessage.shift();

        var randomXP = Math.floor(Math.random() * 15) + 10;
        let xpPromise = new Promise(resolve => {
          db.get(`SELECT * FROM xp WHERE id = "${message.author.id}"`, (err, row) => {
            db.run(`UPDATE xp SET xpcount = "${row.xpcount}" + "${randomXP}" WHERE id = "${message.author.id}"`);
            if(row.xpcount >= 5 * Math.pow(row.level, 2) + (75 * row.level) + 100) { //5x^2 + 75x + 100 where x = level = level up
              db.run(`UPDATE xp SET level = "${row.level}" + 1 WHERE id = "${message.member.id}"`);
              updateLevelRoles(message.member, row.level + 1);
              message.reply(`you just reached level ${row.level + 1}! Congratulations!`);
            }
          });

          setTimeout(() => resolve("!"), 1000);
        });

        let xpResult = await xpPromise;
        alreadyLooped = true;
      }
    }
  }

  //anti spam System

  if(antiSpamOn && !message.author.bot) { //anti spam system is on
    var msgCount = 0; //message count
    for(var i = 0; i < messageLogs.length; i++) {
      if(messageLogs[i].author == message.author.id && date.getTime() - messageLogs[i].time <= 3000) msgCount++; //6 msg in 3 seconds
      else if (messageLogs[i].author == message.author.id && messageLogs[i].message == message.content && date.getTime() - messageLogs[i].time <= 15000) msgCount++; //6 repeated msgs in 15 seconds
    }

    var warnSpam = false;
    var muteSpam = false;
    var warnedRecently = false;
    var warnCount = 0;
    var muteCount = 0;

    //check if person was warned warned recently
    for(var i = 0; i < warnLogs.length; i++) {
      if(date.getTime() - warnLogs[i].time < 10000 && message.author.id === warnLogs[i].author) warnedRecently = true;
      if(message.author.id === warnLogs[i].author) warnCount++; //check how many times someone got warned in the past 500 messages
    }

    if(msgCount >= 6 && !message.member.roles.cache.some(role => role.name === 'Muted') && !warnedRecently) warnSpam = true;


    //purge the last 6 messages
    if(warnSpam) {
      message.channel.bulkDelete(6, true).catch(error => {
        console.error(err);
      });

      if((warnCount + 1) % 3 == 0 && warnCount != 0) {
        //mute!
        let muteCountPromise = new Promise(resolve => {
          db.all(`SELECT * FROM modlogs WHERE offender = "${message.author.id}" AND reason = "Spamming [Auto]"`, (error, rows) => {
            //how many times has the person previously been muted?
            if(!rows) muteCount = 0;
            else rows.forEach(row => muteCount++);
          });


          setTimeout(() => resolve("!"), 250);
        })

        let muteCountResult = await muteCountPromise;

        var muteCase = muteCount + 1;

        //get the date in a string
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

        if(muteCase >= 6) { //if this happens more than 6 times, unappealable ban
          message.author.send(`You were banned (unappealable) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was U-Banned.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.get(modlogchannelid).send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?)`, ["797234744277336094", message.author.id, "U-Ban", 0, "Spamming [Auto]", now]);
          message.member.ban();
        } else if (muteCase == 5) { //appealable ban
          message.author.send(`You were banned (appealable) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was A-Banned.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.get(modlogchannelid).send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?)`, ["797234744277336094", message.author.id, "A-Ban", 0, "Spamming [Auto]", now]);
          message.member.ban();
        } else if (muteCase == 4) { //kick
          message.author.send(`You were kicked for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was Kicked.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.get(modlogchannelid).send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?)`, ["797234744277336094", message.author.id, "Kick", 0, "Spamming [Auto]", now]);
          message.member.kick();
        } else { //mute incrementing by 120 minutes and starting at 120
          message.author.send(`You were muted (${muteCase * 120} minutes) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was Muted for ${muteCase * 120} minutes.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.get(modlogchannelid).send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?)`, ["797234744277336094", message.author.id, `Mute`, `${muteCase * 120} minutes`, "Spamming [Auto]", now]);

          const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
          message.member.roles.add(mutedRole);
          setTimeout(() => {message.member.roles.remove(mutedRole);}, 1000 * 60 * 120 * muteCase);
        }
      }
      else message.channel.send(`Do not spam. You will be muted at every 3rd warn. (This is warning #${warnCount + 1})` );


      //warn logs
      warnLogs.push({
        "author": message.author.id,
        "time": date.getTime()
      });
      if(warnLogs.length >= 200) warnLogs.shift();
    }

  }

  if(!message.content.startsWith(prefix) || !message.guild || (message.content.startsWith(prefix) && message.content.length <= 3)) return;
  //NOTE: No command name can be shorter than 3 letters.

  const args = message.content.slice(prefix.length).split(" ");
  const command = args.shift().toLowerCase();
  console.log(command);

  //level analysis
  var permissionLevel = 0;
  if(message.author.id === "302923939154493441") permissionLevel = 10; //my ID
  else if(message.member.roles.cache.find(r => r.id === "796171258508607488")) permissionLevel = 5; //staff member


  //actually execute commandFiles
  if(message.author.bot) return;
  try {
    let commandFile = require(`./commands/${command}.js`);
    if(permissionLevel >= commandFile.config.permissionLevel) commandFile.run(client, message, args, permissionLevel);
  } catch (error) {
    console.log(error);
    message.channel.send("Invalid Command! Do ``" + prefix + "help`` for help!")
  }
});


//update level roles function
function updateLevelRoles(member, level) {

  //level role initialization
  var levelRolesIDs = ["797246667065655326", "797246572974047234", "797246384750723082", "797246247999242240", "797246173542350928", "797246099650773033", "797245893467570216", "797245800912257065", "797245706410655785", "797245575569473577"];
  var levelNumRequirements = [100, 75, 60, 50, 35, 20, 10, 5, 3, 0];
  var levelRoles = [];

  for(const id of levelRolesIDs) {
    var rolePush = member.guild.roles.cache.get(id);
    levelRoles.push(rolePush);
    member.roles.remove(rolePush);

  }

  //calculations
  for(var i = 0; i < levelRoles.length; i++) {
    if(level >= levelNumRequirements[i]) {
      member.roles.add(levelRoles[i]);
      return;
    }
  }

}

client.login(token);
