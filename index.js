//Basic requirements
const Discord = require('discord.js');
const curl = require('curl');
const request = require('request');
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid, twitchclientid, twitchsecret} = require("./config.json"); //get the prefix, token, status and welcome channel id
const fetch = require("node-fetch").default;
var exec = require('child_process').exec;
const fs = require ("fs");

//sql database setup
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const client = new Discord.Client();
client.commands = new Discord.Collection();

global.squeue = new Map();

//message logs and xp setup
let messageLogs = [];
let warnLogs = [];
let xpMessage = [];

messageLogs.push({
    "message": "1",
    "guild": "1",
    "author": "1",
    "time": "1"
});

xpMessage.push({
  "author": "1",
  "guild": "1",
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
  client.commands.set(command.config.name, command);
  if(command.config.aliases) {
    for(i = 0; i < command.config.aliases.length; i++) { //aliases!
      console.log(`\tALIAS: ${command.config.aliases[i]}`);
      client.commands.set(command.config.aliases[i], command);
    }

  }
  console.log(`Loaded ${command.config.name}. (Level ${command.config.permissionLevel})`);
}

//twitch live loop
//id: 629732208
const botroom = "797358307781509140"
let twitchlive = false;
var twitchtoken = "1";
const twitchtokenurl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${twitchclientid}&redirect_uri=https://bryanchan.org&scope=viewing_activity_read`;

const twitchRefreshToken = async function Run() {
  let twitchAuthPromise = new Promise((reject, resolve) => {
      exec('twitch token', (error, err, out) => {
          resolve("!");
      });
  }).catch(error => {
    //do nothing lmao
  });
  let twitchAuthResult = await twitchAuthPromise;
  twitchtoken = twitchAuthResult.out.substring(38).replace("\n", "");
}

let twitchSearchResult = "";

const twitchLive = async function Run() {

  let twitchSearchResultError = "";

  let twitchSearchPromise = new Promise((reject, resolve) => {
    exec(`twitch api get /streams -q user_login=youlikec3ts`, (error, out, err) => {
      if(error) reject(error);
      else resolve({err, out});
    })
  }).catch(error => {
    twitchSearchResultError = error;
  });

  twitchSearchResult = await twitchSearchPromise;
  //console.log(twitchSearchResult);
  //console.log(twitchSearchResultError);

  //in the case that the error gives the result (which apparently happens sometimes?????)
  if(twitchSearchResult == undefined && twitchSearchResultError != undefined) twitchSearchResult = twitchSearchResultError;
  try {
    twitchSearchResult = JSON.parse(twitchSearchResult.out);
  } catch (error) {
    twitchlive = false;
    return;
  }

  if(twitchSearchResult.data != undefined && twitchSearchResult.data.length > 0 && twitchlive === false) {
    //if data result is defined

    var twitchuser = twitchSearchResult.data[0].user_name;
    var twitchgame = twitchSearchResult.data[0].game_name;
    var twitchtitle = twitchSearchResult.data[0].title;
    var twitchstarttime = twitchSearchResult.data[0].started_at;
    let twitchthumbnail = twitchSearchResult.data[0].thumbnail_url;

    twitchthumbnail = twitchthumbnail.replace("-{width}x{height}", "-1920x1080");

    const twitchEmbed = new Discord.MessageEmbed().setColor("A020F0");
    twitchEmbed.setTitle("Cats Is Live!");
    twitchEmbed.addField("Link:", "https://twitch.tv/youlikec3ts");
    twitchEmbed.addField("Title:", `${twitchtitle}`);
    twitchEmbed.addField("Game:", `${twitchgame}`);
    twitchEmbed.setImage(`${twitchthumbnail}`);
    twitchEmbed.setThumbnail(`${twitchthumbnail}`);

    const twitchGuild = client.guilds.cache.get("796168991458066453");
    const twitchChannel = twitchGuild.channels.cache.get("796169933180239894");
    twitchChannel.send(`@everyone, Cats is streaming!\n`, {embed: twitchEmbed});
    twitchlive = true;
  } else if ((twitchSearchResult.data == undefined || twitchSearchResult.data.length == 0) && twitchlive === true) {
    twitchlive = false;
  }

  //console.log(twitchlive);
}
setInterval(twitchLive, 30000);
setInterval(twitchRefreshToken, 1000 * 360);

//client startup
client.on('ready', (reaction, user) => {
  client.user.setActivity(` ${status}`, {type: 'PLAYING'}); //set status of bot when it's online

  //fetch message for reaction roles
  client.guilds.cache.get("796168991458066453").channels.cache.get("797261159035306004").messages.fetch("797649294243921961");

  console.log("Bot startup successful!");
});

//client on member join
client.on("guildMemberAdd", async member => {
  var welcomeChannel = member.guild.channels.cache.find(c => c.name == "server-gateway"); //welcome channel
  if(welcomeChannel != null) welcomeChannel.send(`<@!${member.id}> has just joined the server!`); //only accessible through dev server

  if(member.guild.id == "796168991458066453") {
    var memberRole = member.guild.roles.cache.get("797260531378552842");
    member.roles.add(memberRole);
  }
  //calculate levels upon joining with await/async stuff
  let setLevelOnJoinPromise = new Promise((resolve) => {
    db.all(`SELECT * FROM xp WHERE id = "${member.id}" AND guild = ${member.guild.id}`, (err, rows) => {
      if(rows.length == 0) {
        updateLevelRoles(member, 0);
        db.run(`INSERT INTO xp (id, guild, level, xpcount) VALUES (?, ?, ?, ?)`, [member.id, member.guild.id, 0, 0]);
      } else {
        rows.forEach(row => {
          //console.log("updating!");
          if(member.guild.id == "796168991458066453") updateLevelRoles(member, row.level);
        });
      }
    });
      setTimeout(() => resolve("!"), 1000);
  })
  let setLevelOnJoinResult = await setLevelOnJoinPromise;

  //calculating prestige upon joining with await/async stuffconst Discord = require('discord.js');
  const sql = require('sqlite3').verbose();
  const ytdl = require('ytdl-core');
  const ytpl = require('ytpl');
  const ytsr = require('ytsr');
  var db = new sql.Database("db.sqlite");
  const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

  exports.run = async (client, message, args, level) => {

      const voiceChannel = message.member.voice.channel;
      if(!voiceChannel) return message.channel.send("You aren't in a voice channel! You need to be in a voice channel to play music!");

      const permissions = voiceChannel.permissionsFor(message.client.user);
      if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) return message.channel.send("I do not have permissions to join/speak in this channel!");

      let songSearch = args.slice(0).join(" ");

      if(!songSearch) return message.channel.send("You need to input a search query! Try again.");

      if(songSearch.includes("list=")) { //if it's a playlist
        return message.reply("playlists aren't supported yet! Sorry!");
      } else {
        let video;
        try { //if video is url
          video = await ytdl.getBasicInfo(url);
        } catch (e) { //otherwise
          try {
            const results = await ytsr(songSearch, {limit: 5});
            const videos = results.items;
            console.log(videos);
            let index = 0;

            if(!videos.length) return message.channel.send("No videos were found in the search query! Try again.");

            await message.channel.send([
              "__**Song selection:**__",
              videos.map(v => `${++index} - **${v.title}**`).join("\n"),
              `**Select your song by sending the number from 1 to ${videos.length} in chat.**`
              ].join("\n\n"));

            let response;
            try {
              response = await message.channel.awaitMessages(msg => 0 < parseInt(msg.content) && parseInt(msg.content) < videos.length + 1 && msg.author.id == message.author.id, {
                max: 1,
                time: 30000,
                errors: ['time']
              });
            } catch(e) {
              return message.channel.send("Command cancelled (timeout exception).");
            }

            const videoIndex = parseInt(response.first().content);
            video = await ytdl.getBasicInfo(videos[videoIndex - 1].url.split("?v=")[1]);
          } catch (e) {
            console.log(e)
            return message.channel.send("An error occured.")
          }
        }

        await message.channel.send(`**${video.videoDetails.title}** has been added to the queue!`);
        return await queueSong(video, message, voiceChannel, squeue);
      }

  }

  async function queueSong(video, message, voiceChannel, queue) {
    const serverQueue = queue.get(message.guild.id)

    const song = {
      id: video.videoDetails.videoId,
      title: Discord.escapeMarkdown(video.videoDetails.title),
      url: video.videoDetails.video_url,
      user: message.member.id
    }

    if (!serverQueue) {
      const queueConstruct = {
        textChannel: message.channel,
        voiceChannel,
        connection: null,
        songs: [song],
        volume: 50,
        playing: true
      }

      try {
        const connection = await voiceChannel.join();
        queueConstruct.connection = connection;
        queue.set(message.guild.id, queueConstruct);
        playSong(message.guild, queue, queueConstruct.songs[0]);
      } catch(e) {
        console.log(e)
        message.channel.send("An unknown error occoured.")
        return queue.delete(message.guild.id)
      }
    } else serverQueue.songs.push(song);

    return;
  }

  async function playSong(guild, queue, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }

    serverQueue.connection.play(ytdl(song.id), { bitrate: 'auto' })
      .on("speaking", speaking => {
        if (!speaking) {
          serverQueue.songs.shift();
          playSong(guild, queue, serverQueue.songs[0])
        }
      })
      .on("error", console.error)
      .setVolumeLogarithmic(serverQueue.volume / 100);

    serverQueue.textChannel.send(`Now playing **${song.title}**`)
  }


  exports.config = {
    name: "play",
    usage: "play <youtube search query/link>",
    description: "Play a song!",
    category: "music",
    permissionLevel: 0,
    aliases: ['p']
  };

  let prestigePromise = new Promise((resolve) => {

    db.all(`SELECT * FROM currency WHERE id = ${member.id} AND guild = ${member.guild.id}`, (err, rows) => {
      if(rows.length == 0) {
        db.run(`INSERT INTO currency (id, guild, currency, prestige) VALUES (?, ?, ?, ?)`, [member.id, member.guild.id, 0, 0]);
      } else {
        rows.forEach(row => {
          if(member.guild.id == "796168991458066453") updatePrestigeRoles(member, row.prestige);
        });
      }
    });
    setTimeout(() => resolve("yeyeyeyeyeye"), 1000);
  });

  let prestigeResult = await prestigePromise;

});

//client on member remove
client.on("guildMemberRemove", async member => {
  var goodbyeChannel = member.guild.channels.cache.find(c => c.name == "server-gateway");
  if(goodbyeChannel != null) goodbyeChannel.send(`<@!${member.id}> just left the server!`);
});

//client on edited message
client.on("messageUpdate", async (oldmessage, newmessage) => {
  if(oldmessage.author.bot) return;
  if(oldmessage.content === newmessage.content || oldmessage.author.bot) return;
  var messageChannel = oldmessage.guild.channels.cache.find(c => c.name == "message-logs");

  var embed = new Discord.MessageEmbed().setTitle("Message Edited").setColor("#ffff00").setDescription(`User: <@!${newmessage.member.id}>\nChannel: <#${newmessage.channel.id}>\n\nOld Message:\n${oldmessage.content}\n\nNew Message:\n${newmessage.content}`);
  return messageChannel.send(embed);
})

//client on deleted message
client.on("messageDelete", async message => {
  if(message.author.bot) return;
  var messageChannel = message.guild.channels.cache.find(c => c.name == "message-logs");

  var embed = new Discord.MessageEmbed().setTitle("Message Deleted").setColor("#ff0000").setDescription(`User: <@!${message.member.id}>\nChannel: <#${message.channel.id}>\nMessage:\n${message}`);
  return messageChannel.send(embed);
})

//identifiers and reaction role names
var identifiers = []; //music, programming, voter, random, Brawlhalla, Overwatch, MC, MapleStory
var reactionRoleNames = [];

//on message react (used for reaction roles)
client.on("messageReactionAdd", async (reaction, user) => {
  console.log(reaction.emoji.identifier);
  for(var i = 0; i < identifiers.length; i++) {
    let reactionRole = reaction.message.guild.roles.cache.get(reactionRoleNames[i]);
    if(reaction.emoji.identifier == identifiers[i] && reaction.message.channel.id == "797261159035306004") {
      reaction.message.guild.members.cache.get(user.id).roles.add(reactionRole);
    }
  }
})

client.on("messageReactionRemove", async (reaction, user) => {
  console.log(reaction.emoji.identifier);
  for(var i = 0; i < identifiers.length; i++) {
    let reactionRole = reaction.message.guild.roles.cache.get(reactionRoleNames[i]);
    if(reaction.emoji.identifier == identifiers[i] && reaction.message.channel.id == "797261159035306004") {
      reaction.message.guild.members.cache.get(user.id).roles.remove(reactionRole);
    }
  }
})

//client on message send
client.on("message", async message => {

  //system variables
  var antiSpamOn = true;
  var xpSystemOn = true;
  var debugMode = false;

  if(debugMode && message.channel.id != "797358307781509140") return;


  let date = new Date();

  if(!message.author.bot && message.member.roles.cache.some(role => role.name === 'Muted')) return;

  //secret codes!
  if(message.content.toLowerCase().includes("eggbot")) {
    message.channel.send(`[Secret Code]: Thanks for watching my twitch :D`).then(msg => {
      msg.delete({timeout: 3000});
    });
  }



  messageLogs.push({
      "message": message.content,
      "author": message.author.id,
      "time": date.getTime()
  });

  if(messageLogs.length >= 500) messageLogs.shift();


  //xp system
  if(xpSystemOn && !message.author.bot && message.channel.id != "835002640688480297" && message.channel.id != "797358307781509140") { //not in bot room
    var notInitYet = true;
    for(var i = 0; i < xpMessage.length; i++) {
      if(message.author.id == xpMessage[i].author && message.guild.id == xpMessage[i].guild) notInitYet = false;
    }

    var alreadyLooped = false;


    for(var i = 0; i < xpMessage.length; i++) {
      if(!alreadyLooped && (notInitYet || (message.author.id === xpMessage[i].author && date.getTime() - xpMessage[i].lastTime >= 60000))) { //more than 60 seconds
        //set and add xp
        if(notInitYet) {
          xpMessage.push({
            "author": message.author.id,
            "guild": message.guild.id,
            "lastTime": date.getTime()
          })
        }
        else xpMessage[i].lastTime = date.getTime();
        if(xpMessage.length >= 500) xpMessage.shift();

        var randomXP = Math.floor(Math.random() * 15) + 10;
        let xpPromise = new Promise(resolve => {
          db.get(`SELECT * FROM xp WHERE id = "${message.author.id}" AND guild = "${message.guild.id}"`, (err, row) => {
            if(!row) message.reply(`Your XP database isn't initalized! Do ${prefix}dbinit to fix this.`);
            else {
              db.run(`UPDATE xp SET xpcount = ${row.xpcount} + ${randomXP} WHERE id = ${message.author.id} AND guild = ${message.guild.id}`);
              if(row.xpcount >= 5 * Math.pow(row.level, 2) + (75 * row.level) + 100) { //5x^2 + 75x + 100 where x = level = level up
                db.run(`UPDATE xp SET level = ${row.level} + 1 WHERE id = ${message.member.id} AND guild = ${message.guild.id}`);
                if(message.member.guild.id === "796168991458066453") updateLevelRoles(message.member, row.level + 1);
                message.reply(`you just reached level ${row.level + 1}! Congratulations!`);
              }
            }
          });

          setTimeout(() => resolve("!"), 1000);
        });
        let xpResult = await xpPromise;

        var randomCoinChance = Math.floor(Math.random() * 20);

        if(randomCoinChance == 0) { //chance of getting Cat Coins WITH an XP gain
          console.log("got currency");
          var randomCoin = Math.floor(Math.random() * 5) + 5;
          let coinPromise = new Promise(resolve => {
            db.get(`SELECT * FROM currency WHERE id = "${message.author.id}" AND guild = "${message.guild.id}"`, (err, row) => {
              if(!row) db.run("INSERT INTO currency (id, guild, currency, prestige) VALUES (?, ?, ?, ?)", [message.member.id, message.guild.id, randomCoin, 0]);
              else {
                db.run(`UPDATE currency SET currency = ${row.currency} + ${randomCoin} WHERE id = ${message.author.id} AND guild = ${message.guild.id}`);
              }
            });

            setTimeout(() => resolve("a"), 1000);
          });

          message.reply(`you just gained ${randomCoin} Cat Coins! Congratulations!`);
          let coinResult = await coinPromise;
        }
        alreadyLooped = true;
      }
    }
  }

  //anti spam System

  if(antiSpamOn && !message.author.bot) { //anti spam system is on
    var msgCount = 0; //message count
    for(var i = 0; i < messageLogs.length; i++) {
      if(messageLogs[i].author == message.author.id && date.getTime() - messageLogs[i].time <= 3000 /*&& messageLogs[i].guild == message.guild.id*/) {
        msgCount++; //6 msg in 3 seconds
      }
      else if (messageLogs[i].author == message.author.id && messageLogs[i].message == message.content && date.getTime() - messageLogs[i].time <= 15000 && messageLogs[i].guild == message.guild.id) msgCount++; //6 repeated msgs in 15 seconds
    }

    console.log(msgCount);

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
      message.channel.bulkDelete(msgCount, true).catch(error => {
        console.error(err);
      });

      if((warnCount + 1) % 3 == 0 && warnCount != 0) {
        //mute!
        let muteCountPromise = new Promise(resolve => {
          db.all(`SELECT * FROM modlogs WHERE offender = "${message.author.id}" AND reason = "Spamming [Auto]" AND guild = ${message.guild.id}`, (error, rows) => {
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
          message.guild.channels.cache.find(c => c.name == "modlogs").send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, "797234744277336094", message.author.id, "U-Ban", 0, "Spamming [Auto]", now]);
          message.member.ban();
        } else if (muteCase == 5) { //appealable ban
          message.author.send(`You were banned (appealable) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was A-Banned.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.find(c => c.name == "modlogs").send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, "797234744277336094", message.author.id, "A-Ban", 0, "Spamming [Auto]", now]);
          message.member.ban();
        } else if (muteCase == 4) { //kick
          message.author.send(`You were kicked for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was Kicked.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.find(c => c.name == "modlogs").send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, "797234744277336094", message.author.id, "Kick", 0, "Spamming [Auto]", now]);
          message.member.kick();
        } else { //mute incrementing by 120 minutes and starting at 120
          message.author.send(`You were muted (${muteCase * 120} minutes) for: Spamming [Auto] (x${muteCase})`);
          const embed = new Discord.MessageEmbed().setTitle(`User ${message.author.username} was Muted for ${muteCase * 120} minutes.`).setColor("#ff0000").addField("Time: ", now).addField("Moderator: ", "Bot [Auto]").addField("Reason: ", "Spam [Auto]");
          message.guild.channels.cache.find(c => c.name == "modlogs").send(embed);

          //put that modlog in
          db.run(`INSERT INTO modlogs (guild, moderator, offender, modtype, muteTime, reason, time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [message.guild.id, "797234744277336094", message.author.id, `Mute`, `${muteCase * 120} minutes`, "Spamming [Auto]", now]);

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

  if(!message.content.startsWith(prefix) || !message.guild) return;
  //NOTE: No command name can be shorter than 3 letters.

  const args = message.content.slice(prefix.length).split(" ");
  const command = args.shift().toLowerCase();
  console.log(command);

  //level analysis
  var permissionLevel = 0;
  if(message.author.id === "302923939154493441") permissionLevel = 10; //my ID

  //actually execute commandFiles
  if(message.author.bot) return;

  //Secret Codes LOL!


  try {
    if(!client.commands.has(command)) return message.channel.send("Invalid Command! Do ``" + prefix + "help`` for help!");
    let commandFile = client.commands.get(command); //get the command/alias
    if(permissionLevel >= commandFile.config.permissionLevel) commandFile.run(client, message, args, permissionLevel);
  } catch (error) {
    console.log(error);
    message.channel.send("Invalid Command! Do ``" + prefix + "help`` for help!");
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

function updatePrestigeRoles(member, prestige) {
  var prestigeRoleIDs = ["818671806441455628", "818671880843165747", "818671960137269279", "818672014608695328", "818672107000823840"];
  var prestigeRoles = [];

  for(const id of prestigeRoleIDs) {
    var rolePush = member.guild.roles.cache.get(id);
    member.roles.remove(rolePush);
  }

  for(var i = 1; i <= prestigeRoleIDs.length; i++) {
    if(prestige == i) {
      member.roles.add(prestigeRoles[i - 1]);
      return;
    }
  }

}

client.login(token);
