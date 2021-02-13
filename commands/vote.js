const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

  let sendChannel = message.mentions.channels.first();

  var voteTime = parseInt(args[0].slice(0, args[1].length - 1)); //get everything except for the last character which symbolizes the time unit
  var baseTime = voteTime; //used to quantify the original VALUES

  if(isNaN(voteTime)) return message.reply(`that's not a number! Try again.`);

  var unit = "seconds";
  if(voteTime == 1) unit = "second";

  voteTime *= 1000;

  //check for the unit
  if(args[0].includes("t")) {
    voteTime /= 1000;
    if(baseTime == 1) unit = "tick (millisecond)";
    else unit = "ticks (milliseconds)";
  }
  else if(args[0].includes("m")) {
    voteTime *= 60;
    if(baseTime == 1) unit = "minute";
    else unit = "minutes";
  } else if(args[0].includes("h")) {
    voteTime *= 3600;
    if(baseTime == 1) unit = "hour";
    else unit = "hours";
  } else if(args[0].includes("d")) {
    voteTime *= 86400;
    if(baseTime == 1) unit = "day";
    else unit = "days";
  }

  var voteSubject = args.slice(2).join(" "); //voting section

  sendChannel.send("@everyone\nVOTE: " + voteSubject + "\nVote made by <@!" + message.member.id + ">\nYou will have " + baseTime + " " + unit + " to vote. \n(Remember that your vote is FINAL, so think before you react)").then(msg => {
    var thUP = client.emojis.cache.get("768872753125523476");
    var thDOWN = client.emojis.cache.get("768872857345589248");

    msg.react(thUP).then(() => msg.react(thDOWN)); //async reactions sux

    const reactionFilter = (reaction, user) => {
      return reaction.emoji.id === thUP.id || reaction.emoji.id === thDOWN.id;
    };

    const rCollector = msg.createReactionCollector(reactionFilter, {time: voteTime});

    var reactedUsers = [];

    rCollector.on('collect', (reaction, user) => {

      var alreadyReacted = false;

      for(var i = 0; i < reactedUsers.length; i++) {
        if(reactedUsers[i] === user.id) alreadyReacted = true;
      }

      if(alreadyReacted) reaction.users.remove(user);

      if(!user.bot && !alreadyReacted) {
        reactedUsers.push(user.id);
      }
    });

    rCollector.on('end', collected => {
      var yes = collected.get(thUP.id).count - 1;
      var no = collected.get(thDOWN.id).count - 1;

      var choice = "Yes";
      if(no > yes) choice = "No";

      sendChannel.send("<@!302923939154493441> FINAL VOTE: ||" + yes + "-" + no + " (" + choice + ")||");
    });

  });

}

exports.config = {
  name: "vote",
  usage: "vote <channel> <time> <message>",
  description: "Gets the moderation logs of a spefic user!",
  category: "utility",
  permissionLevel: 10,
};
