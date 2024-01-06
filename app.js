/*
File: index.js
Contributors:
  -vKitsu
*/

//Basic Requirements/Dependencies
const {
  Client,
  Collection,
  ActivityType,
  GatewayIntentBits,
} = require("discord.js");
const fs = require("fs");
const dotenv = require("dotenv");

const { incrementXP } = require("./helpers/xpsystem");

dotenv.config();

//SQL database setup
const { AsyncDatabase } = require("promised-sqlite3");

//static variables
const prefix = process.env.DISCORD_PREFIX;

//Map Commands for Dynamic + Automatic Command Adding
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});
client.commands = new Collection();

//Message Log, Modlog and XP Variables
let messageLogs = []; //Messages will be found here.
let warnLogs = []; //Warn Logs will be found here.
let xpMessage = []; //For each user, track the messaage they sent in the last 60 seconds.

const updateLevelRoles = (member, level) => {
  let levelRoles = member.guild.roles.cache.filter((role) =>
    role.name.startsWith("Level")
  );

  levelRoles = levelRoles.sort(
    (a, b) => parseInt(b.name.split(" ")[1]) - parseInt(a.name.split(" ")[1])
  );

  let memberLevelRoles = levelRoles.filter((role) =>
    member.roles.cache.some((r) => r.id === role.id)
  );

  for (let memberLevelRole of memberLevelRoles) {
    member.roles.remove(member.guild.roles.cache.get(memberLevelRole[0]));
  }

  for (levelRole of levelRoles) {
    if (level >= parseInt(levelRole[1].name.split(" ")[1])) {
      member.roles.add(member.guild.roles.cache.get(levelRole[0]));
      return;
    }
  }
};

//Mapping Commands
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js")); //Get JS Command Files

for (const file of commandFiles) {
  //Loop Through Files
  const command = require(`./commands/${file}`);
  client.commands.set(command.config.name, command); //Put in Collection
  if (command.config.aliases) {
    //If there's aliases, add them
    for (i = 0; i < command.config.aliases.length; i++) {
      console.log(`\tALIAS: ${command.config.aliases[i]}`);
      client.commands.set(command.config.aliases[i], command);
    }
  }
  console.log(
    `Loaded ${command.config.name}. (Level ${command.config.permissionLevel})`
  ); //Verify that command loaded in terminal
}

//On Client Startup
client.on("ready", (user) => {
  client.user.setPresence({
    activities: [
      { name: process.env.DISCORD_STATUS, type: ActivityType.Watching },
    ],
    status: "dnd",
  });

  console.log("Bot startup successful!");
});

//On Member Joining
client.on("guildMemberAdd", async (member) => {
  if (member.guild.id === process.env.MASTER_GUILD_ID)
    member.roles.add(member.roles.cache.find((role) => role.name === "Member"));

  await db.all(
    `SELECT * FROM xp WHERE id=${member.id} AND guild=${member.guild.id}`,
    (err, rows) => {
      if (rows.length === 0) {
        db.run(`INSERT INTO xp (id, level, xp) VALUES (${member.id}, 0, 0)`);
        member.roles.add(
          member.roles.cache.find((role) => role.name.startsWith("Level 0"))
        );
      } else {
        updateLevelRoles(member);
      }
    }
  );
});

//On Member Leavine
client.on("guildMemberRemove", async (member) => {});

//On Edited Message
client.on("messageUpdate", async (oldmessage, newmessage) => {});

//On Deleted Message
client.on("messageDelete", async (message) => {});

//On Message Sent
client.on("messageCreate", async (message) => {
  if (message.member.user.id === client.user.id) return;

  //let the xp system run.

  //figure out if it's been 60 seconds since message was sent
  let date = new Date();
  let counted = false;
  let initialized = false;
  let playerLocation = 0;

  for (let i = 0; i < xpMessage.length; i++) {
    if (message.author.id === xpMessage[i].author) {
      initialized = true;
      playerLocation = i;
      if (date.getTime() - xpMessage[i].lastTime < 60 * 1000) counted = true;
    }
  }

  if (!counted) {
    //at this point, we know that we should count this message.
    if (!initialized) {
      xpMessage.push({
        author: message.author.id,
        lastTime: date.getTime(),
      });
    } else xpMessage[playerLocation].lastTime = date.getTime();

    let levelData = await incrementXP(message.member.id);
    if (levelData.message.length > 0) {
      message.channel.send(levelData.message);
      if (message.guild.id === process.env.MASTER_GUILD_ID)
        updateLevelRoles(message.member, levelData.level);
    }
  }

  //After all the message parsing, look for commands. If there is no command, ignore
  if (!message.content.startsWith(prefix) || !message.guild) return;
  const args = message.content.slice(prefix.length).split(" "); //Dissect Arguments
  const command = args.shift().toLowerCase(); //Find input command

  //Find Permission Levels
  let permissionLevel = 0;

  if (message.author.id === process.env.DEVELOPER_ID) permissionLevel = 10;

  //Execute Command File!
  try {
    //If the command is invalid, return a verbal error.
    if (!client.commands.has(command))
      return message.channel.send(
        "Invalid Command! Do ``" + prefix + "help`` for help!"
      );
    let commandFile = client.commands.get(command); //Find command
    //If person has a sufficient permission level, run the command.
    if (permissionLevel >= commandFile.config.permissionLevel)
      await commandFile.run(client, message, args, permissionLevel);
  } catch (error) {
    //Command doesn't exist
    console.log(error);
    message.channel.send(
      "Invalid Command! Do ``" + prefix + "help`` for help!"
    );
  }
});

//After ALL of that, login!
client.login(process.env.DISCORD_TOKEN);
