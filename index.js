/*
File: index.js
Contributors:
  -vKitsu
*/

//Basic Requirements/Dependencies
const Discord = require('discord.js');
const curl = require('curl');
const request = require('request');
const fetch = require("node-fetch").default;
var exec = require('child_process').exec;
const fs = require ("fs");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid, twitchusername} = require("./config.json"); //get config variables
const botroom = "797358307781509140";

//SQL database setup
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

//Map Commands for Dynamic + Automatic Command Adding
const client = new Discord.Client();
client.commands = new Discord.Collection();

//Song Queues
global.squeue = new Map();

//Message Log, Modlog and XP Variables
let messageLogs = []; //Messages will be found here.
let warnLogs = []; //Warn Logs will be found here.
let xpMessage = []; //For each user, track the messaage they sent in the last 60 seconds.

//Mapping Commands
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js")); //Get JS Command Files

for(const file of commandFiles) { //Loop Through Files
  const command = require(`./commands/${file}`);
  client.commands.set(command.config.name, command); //Put in Collection
  if(command.config.aliases) { //If there's aliases, add them
    for(i = 0; i < command.config.aliases.length; i++) { 
      console.log(`\tALIAS: ${command.config.aliases[i]}`);
      client.commands.set(command.config.aliases[i], command);
    }

  }
  console.log(`Loaded ${command.config.name}. (Level ${command.config.permissionLevel})`); //Verify that command loaded in terminal
}

//Setup for Twitch Status Infinite Loop
let twitchlive = false;
var accesstoken = "1";
let twitchSearchResult = "";

//TWITCH CODE STARTS
const twitchLive = async function Run() {
  //When this function is called, it checks to see if the streamer in twitchSearch is live. (twitchSearch is in config.json)
  //First, check to make sure that the token works:
  fetch('https://id.twitch.tv/oauth2/validate', {"headers": {"Authorization": "Bearer " + accesstoken}}).then(response => response.json()).then(async response => {
    if(response.status && response.status == 401) { //if status 401, the token is invalid, change it
      let twitchAuthPromise = new Promise((reject, resolve) => {
        exec('twitch token', (error, err, out) => {
            accesstoken = out.substring(38).replace("\n", ""); //set accesstoken to the access token from twitch cli
            resolve("Twitch Token Refreshed");
        });
      }).catch(error =>{});
      let twitchAuthResult = await twitchAuthPromise;
    }
  });

  //Now, search using twitchusername (in config)!
  let twitchSearchResultError = "";
  let twitchSearchPromise = new Promise((reject, resolve) => {
    exec(`twitch api get /streams -q user_login=${twitchusername}`, (error, out, err) => {
      if(error) reject(error);
      else resolve({err, out});
    })
  }).catch(error => {
    twitchSearchResultError = error;
  });

  twitchSearchResult = await twitchSearchPromise;
  
  //if there is NO result and an ERROR, try to parse the error to see if a stream is live!
  if(twitchSearchResult == undefined && twitchSearchResultError != undefined) twitchSearchResult = twitchSearchResultError;
  //try to see if the response can be parsed into a JSON. If it can, there's a stream! Otherwise, return and end here.
  try {
    twitchSearchResult = JSON.parse(twitchSearchResult.out);
  } catch (error) {
    twitchlive = false; //set it so that the live variable is off
    return;
  }

  if(twitchSearchResult.data != undefined && twitchSearchResult.data.length > 0 && twitchlive === false) { //if there's data from the stream and it just started...
    //NOTE: twitchlive == false is IMPORTANT. This prevents the bot from pinging every single time this function is called while the stream is live.
    var twitchuser = twitchSearchResult.data[0].user_name; //twitch username
    var twitchgame = twitchSearchResult.data[0].game_name; //stream game
    var twitchtitle = twitchSearchResult.data[0].title; //stream title
    let twitchthumbnail = twitchSearchResult.data[0].thumbnail_url.replace("-{width}x{height}", "-1920x1080"); //provide a thumbnail!

    //Create + Customize embed!
    const twitchEmbed = new Discord.MessageEmbed().setColor("A020F0");
    twitchEmbed.setTitle(`${twitchuser} is live!`);
    twitchEmbed.addField("Link:", "https://twitch.tv/youlikec3ts");
    twitchEmbed.addField("Title:", `${twitchtitle}`);
    twitchEmbed.addField("Game:", `${twitchgame}`);
    twitchEmbed.setImage(`${twitchthumbnail}`);
    twitchEmbed.setThumbnail(`${twitchthumbnail}`);

    //Get Send Channel Data
    const twitchGuild = client.guilds.cache.get("796168991458066453");
    const twitchChannel = twitchGuild.channels.cache.get("796169933180239894");
    twitchChannel.send(`@everyone, ${twitchuser} is streaming!\n`, {embed: twitchEmbed});
    twitchlive = true; //Now, we're streaming!
    return;
  } else if ((twitchSearchResult.data == undefined || twitchSearchResult.data.length == 0) && twitchlive === true) {
    twitchlive = false; //If we STOP streaming, turn twitchlive to false.
  }
}
setInterval(twitchLive, 60000); //Checks every MINUTE to see if the stream is live
//TWITCH CODE ENDS


//On Client Startup
client.on('ready', (reaction, user) => {
  client.user.setActivity(` ${status}`, {type: 'PLAYING'}); //set status of bot when it's online
  console.log("Bot startup successful!");
});

//On Member Joining
client.on("guildMemberAdd", async member => {
  //IF the Gateway channel exists, send a message
  if(member.guild.channels.cache.find(c => c.id == gatewaychannelid) != null) welcomeChannel.send(`<@!${member.id}> has just joined the server!`); 

  //If the bot is in the main server, add the default role
  if(member.guild.id == "796168991458066453") member.roles.add(member.guild.roles.cache.get("797260531378552842"));

  //Load Previous Levels/XP
  let setLevelOnJoinPromise = new Promise((resolve) => {
    db.all(`SELECT * FROM xp WHERE id = "${member.id}" AND guild = ${member.guild.id}`, (err, rows) => {
      if(rows.length == 0) { //If there is no previous data
        updateLevelRoles(member, 0); //Give them basic roles
        db.run(`INSERT INTO xp (id, guild, level, xpcount) VALUES (?, ?, ?, ?)`, [member.id, member.guild.id, 0, 0]); //Insert new data
      } else {
        rows.forEach(row => {
          updateLevelRoles(member, row.level); //Update Level Roles!
        });
      }
    });
      setTimeout(() => resolve("Member Join Roles Updated"), 1000);
  })
  let setLevelOnJoinResult = await setLevelOnJoinPromise;
});

//On Member Leavine
client.on("guildMemberRemove", async member => {
});

//On Edited Message
client.on("messageUpdate", async (oldmessage, newmessage) => {
  //If the old message is the same as the new message OR the old message is a bot, ignore it
  if(oldmessage.content === newmessage.content || oldmessage.author.bot) return;
  var messageChannel = oldmessage.guild.channels.cache.find(c => c.id == messagechannelid);

  //Create Embed to put in the modlogs channel
  var embed = new Discord.MessageEmbed().setTitle("Message Edited").setColor("#ffff00").setDescription(`User: <@!${newmessage.member.id}>\n
    Channel: <#${newmessage.channel.id}>\n\n
    Old Message:\n${oldmessage.content}\n\n
    New Message:\n${newmessage.content}`);

  //If the modlogs channel exists, send the embed. Otherwise, just return.
  if(messageChannel != null) return messageChannel.send(embed); 
  return;
})

//On Deleted Message
client.on("messageDelete", async message => {
  if(message.author.bot) return; //If the message was from a bot, ignore it
  var messageChannel = message.guild.channels.cache.find(c => c.id == messagechannelid); //Look for message channel

  //Create Embed to send in Message Channel
  var embed = new Discord.MessageEmbed().setTitle("Message Deleted").setColor("#ff0000")
    .setDescription(`User: <@!${message.member.id}>\n
    Channel: <#${message.channel.id}>\n
    Message:\n${message}`);

  //If the message channel exists, send the embed. Otherwise return nothing
  if(messageChannel != null) return messageChannel.send(embed);
  return;
})

//On Message Sent
client.on("message", async message => {

  //System Variables
  var antiSpamOn = true;
  var xpSystemOn = true;
  var debugMode = false;

  let date = new Date();

  //If person is muted, disregard the message
  if(!message.author.bot && message.member.roles.cache.some(role => role.name === 'Muted')) return;

  //Push the message into the MessageLogs list. This will be used to find spam.
  messageLogs.push({
      "message": message.content,
      "author": message.author.id,
      "time": date.getTime()
  });
  if(messageLogs.length >= 500) messageLogs.shift(); //If the list is too long, start shifting to delete earlier messages


  //XP SYSTEM
  if(xpSystemOn && !message.author.bot && message.channel.id != "835002640688480297" && message.channel.id != "797358307781509140") { //not in bot room
    var counted = false; //Detects if message was already counted for XP
    var initialized = false;

    for(var i = 0; i < xpMessage.length; i++) {
      if(message.author.id == xpMessage[i].author && message.guild.id == xpMessage[i].guild) { //if a person is already in the list
        initialized = true;
        //if a message was sent in the last 60 seconds, counted becomes true
        if(date.getTime() - xpMessage[i].lastTime < 60000) counted = true;
      }
    }

    if(!counted) { //If the message was longer than 60 seconds...
      //Update/Add user into the XPLogs list
      if(!initialized) { //If they aren't in the list yet, push their value in
        xpMessage.push({
          "author": message.author.id,
          "guild": message.guild.id,
          "lastTime": date.getTime()
        })
      }
      else xpMessage[i].lastTime = date.getTime(); //Otherwise, update the time.

      //Calculate and input XP into the database
      var randomXP = Math.floor(Math.random() * 15) + 10; //Random value from 10-25
      let xpPromise = new Promise(resolve => {
        db.get(`SELECT * FROM xp WHERE id = "${message.author.id}" AND guild = "${message.guild.id}"`, (err, row) => { //Get row in table
          //If there's no row, create one
          if(!row) db.run("INSERT INTO xp (id, guild, level, xpcount) VALUES (?, ?, ?, ?)", [message.member.id, message.guild.id, 0, 0]);
          else {
            db.run(`UPDATE xp SET xpcount = ${row.xpcount} + ${randomXP} WHERE id = ${message.author.id} AND guild = ${message.guild.id}`); //update xp
            if(row.xpcount >= 5 * Math.pow(row.level, 2) + (75 * row.level) + 100) { //5x^2 + 75x + 100 where x = level --> Formula to level up
              db.run(`UPDATE xp SET level = ${row.level} + 1 WHERE id = ${message.member.id} AND guild = ${message.guild.id}`); //Update Level
              if(message.member.guild.id === "796168991458066453") updateLevelRoles(message.member, row.level + 1); //Update Roles according to Level
              message.reply(`you just reached level ${row.level + 1}! Congratulations!`); //Send Message of Congratulations
            }
          }
        });

        setTimeout(() => resolve("XP Given"), 1000);
      });
      let xpResult = await xpPromise;
    }
  }
    
  //ANTI SPAM SYSTEM
  if(antiSpamOn && !message.author.bot) {
    //Get number of message sent in the last couple time intervals.
    var msgCount = 0;
    for(var i = 0; i < messageLogs.length; i++) {
      //If message was sent in the last 3 seconds, increment
      if(messageLogs[i].author == message.author.id && date.getTime() - messageLogs[i].time <= 3000) msgCount++;
      //If the SAME message was sent in the last 15 seconds, increment
      else if (messageLogs[i].author == message.author.id && messageLogs[i].message == message.content && date.getTime() - messageLogs[i].time <= 15000 && messageLogs[i].guild == message.guild.id) msgCount++; //6 repeated msgs in 15 seconds
    }

    var warnSpam = false;
    var muteSpam = false;
    var warnedRecently = false;
    var warnCount = 0;
    var muteCase = 1;

    for(var i = 0; i < warnLogs.length; i++) {
      //Get number of warns given in the last 5 minutes.
      if(date.getTime() - warnLogs[i].time < (1000 * 60 * 5) && message.author.id === warnLogs[i].author) warnedRecently = true;
      //If person was warned within the last 500 messages, increment warnCount
      if(message.author.id === warnLogs[i].author) warnCount++;
    }

    //If someone spammed more than 6 messages, trigger code below.
    if(msgCount >= 6 && !message.member.roles.cache.some(role => role.name === 'Muted') && !warnedRecently) warnSpam = true;

    if(warnSpam) { //^^
      //Purge the spammed messages
      message.channel.bulkDelete(msgCount, true).catch(error => {
        console.error(err);
      });

      //If person has been warned any multiple of 3 times...
      if((warnCount + 1) % 3 == 0 && warnCount != 0) {
        //Check number of times person has been muted
        let muteCountPromise = new Promise(resolve => {
          db.all(`SELECT * FROM modlogs WHERE offender = "${message.author.id}" AND reason = "Spamming [Auto]" AND guild = ${message.guild.id}`, (error, rows) => {
            if(!rows) muteCase = 0;
            else rows.forEach(row => muteCase++);
          });


          setTimeout(() => resolve("!"), 250);
        });
        let muteCountResult = await muteCountPromise;

        //Get Date in String
        var now = date.toLocaleDateString("en-US", {
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

        //If there were more than 6 mutes, ban
        if(muteCase >= 6) {
          message.author.send(`You were banned (unappealable) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was A-Banned.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.find(c => c.id = modlogchannelid).send(embed);

          //Input Modlog
          db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, "797234744277336094", message.author.id, "U-Ban", 0, "Spamming [Auto]", now]);
          message.member.ban(); //Ban Person
        } else { //Otherwise, mute by increment of 2 hours
          message.author.send(`You were muted (${muteCase * 120} minutes) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was Muted for ${muteCase * 120} minutes.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.find(c => c.id == modlogchannelid).send(embed);

          //Input Modlog
          db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, "797234744277336094", message.author.id, `Mute`, `${muteCase * 120} minutes`, "Spamming [Auto]", now]);

          //Add Muted Role
          const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
          message.member.roles.add(mutedRole);
          setTimeout(() => {message.member.roles.remove(mutedRole);}, 1000 * 60 * 120 * muteCase);
        }
      }
      //Otherwise, send a verbal warning!
      else message.channel.send(`Do not spam. You will be muted at every 3rd warn. (This is warning #${warnCount + 1})` );


      //Push verbal warn to warnLogs list
      warnLogs.push({
        "author": message.author.id,
        "time": date.getTime()
      });
      if(warnLogs.length >= 200) warnLogs.shift();
    }

  }

  //After all the message parsing, look for commands. If there is no command, ignore
  if(!message.content.startsWith(prefix) || !message.guild) return;
  const args = message.content.slice(prefix.length).split(" "); //Dissect Arguments
  const command = args.shift().toLowerCase(); //Find input command

  //Find Permission Levels
  var permissionLevel = 0;
  if(message.author.id === "302923939154493441") permissionLevel = 10; //my ID
  else if(message.author.roles.find(r => r.id == "834812051665846284")) permissionLevel = 8; //Cat Core Council

  //Execute Command File!
  try {
    //If the command is invalid, return a verbal error.
    if(!client.commands.has(command)) return message.channel.send("Invalid Command! Do ``" + prefix + "help`` for help!");
    let commandFile = client.commands.get(command); //Find command
    //If person has a sufficient permission level, run the command.
    if(permissionLevel >= commandFile.config.permissionLevel) commandFile.run(client, message, args, permissionLevel);
  } catch (error) { //Command doesn't exist
    console.log(error);
    message.channel.send("Invalid Command! Do ``" + prefix + "help`` for help!");
  }
});

//Function to update Level roles
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

//After ALL of that, login!
client.login(token);
