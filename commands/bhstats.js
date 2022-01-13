const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fetch = require("node-fetch");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async (client, message, args, level) => {

   var user = message.author.id;

   var legendName = "";

   if(message.mentions.members.first()) {
     user = message.mentions.members.first().id;
     if(args[1]) legendName = args.slice(1).join(" ").toLowerCase();
   }
   else if (message.guild.members.cache.find(m => m.id === args[0])) {
     user = args[0];
     if(args[1]) legendName = args.slice(1).join(" ").toLowerCase();
   } else if (args[0]) {
     legendName = args.slice(0).join(" ").toLowerCase();
   }

   var bhIDOutput = "";

   console.log(user);
   var empty = false;

   let getID = new Promise(resolve => {
     db.all(`SELECT * FROM bhbinds WHERE discordID = "${user}"`, (err, rows)  => {

       rows.forEach(row => {
         bhIDOutput = row.bhID;
       });
     });

     setTimeout(() => {resolve("Y");}, 500);
   });

   let idResults = await getID;

   if(bhIDOutput == "") return message.reply("this person has not binded their brawlhalla account!");

   var embed = new Discord.MessageEmbed().setTitle("Brawlhalla Stats!")
   var desc = "";
   var splitline = "\n\n";

   let output = await fetch("https://api.brawlhalla.com/player/" + bhIDOutput + "/stats?api_key=V8TCNU1BJU7SMGZ21V5I").then(response => response.json()).then(async data => {

     var stringField = JSON.stringify(data);
     const obj = JSON.parse(stringField);


     var stringField1 = JSON.stringify(obj.legends);
     const obj1 = JSON.parse(stringField1);

     var mostUsedLegend = "None";
     var highestLevel = 0;
     var totalHours = 0;

     for(var i = 0; i < obj1.length; i++) {
       totalHours += obj1[i].matchtime;
       if(obj1[i].xp > highestLevel) {
         highestLevel = obj1[i].xp;
         const legendWords = obj1[i].legend_name_key.split(" ");

         for(var j = 0 ; j < legendWords.length; j++) {
           legendWords[j] = legendWords[j][0].toUpperCase() + legendWords[j].substr(1);
         }

         mostUsedLegend = legendWords.join(" ");
       }
     }



     if(legendName == "") {
       desc += "\n";
       desc += "**ID:** " + obj.brawlhalla_id + splitline;
       desc += "**Name:** " + obj.name + splitline;
       desc += "**Level:** " + obj.level + splitline;
       desc += "**Playtime:** " + Math.floor(totalHours / 3600) +  " hours" + splitline;
       desc += "**XP Percentage To Next Level:** " + Math.floor(obj.xp_percentage * 100) + "%" + splitline;
       desc += "**Win Rate:** " + Math.floor(obj.wins / obj.games * 100) + "%" + splitline;
       desc += "**Most Used Legend:** " + mostUsedLegend + splitline;
     } else if (legendName == "ranked") {
       let output1 = await fetch("https://api.brawlhalla.com/player/" + bhIDOutput + "/ranked?api_key=V8TCNU1BJU7SMGZ21V5I").then(response => response.json()).then(data1 => {
         var rankedString = JSON.stringify(data1);
         const rankobj = JSON.parse(rankedString);

         if(JSON.stringify(rankobj) === JSON.stringify({})) {
           empty = true;
           return message.reply ("this person doesn't seem to have a ranked career yet.");
         }

         var rankedStringLegends = JSON.stringify(rankobj.legends);
         const legends1 = JSON.parse(rankedStringLegends);



         desc += "**Name: **" + rankobj.name + splitline;
         desc += "**Current ELO: **" + rankobj.rating + splitline;
         desc += "**Peak ELO: **" + rankobj.peak_rating + splitline;
         desc += "**Current Tier: **" + rankobj.tier + splitline;
         desc += "**Winrate: **" + Math.floor(rankobj.wins / rankobj.games * 100) + "%" + splitline;
         desc += "**Region: **" + rankobj.region + splitline;


         var topLegend = 0;
         var topELO = 0;
         var topGames = 0;
         var y = 0;

         for(var i = 0; i < legends1.length; i++) {
           if(legends1[i].rating > topELO) {
             topLegend = i;

             topELO = legends1[i].rating;
           }
           if(legends1[i].games > topGames) {
             y = i;
             topGames = legends1[i].games;
           }
         }


         const legendWords = legends1[topLegend].legend_name_key.split(" ");

         for(var j = 0 ; j < legendWords.length; j++) {
           legendWords[j] = legendWords[j][0].toUpperCase() + legendWords[j].substr(1);
         }

         var toplegendName = legendWords.join(" ");

         const legendWords1 = legends1[y].legend_name_key.split(" ");

         for(var j = 0 ; j < legendWords1.length; j++) {
           legendWords1[j] = legendWords1[j][0].toUpperCase() + legendWords1[j].substr(1);
         }

         var toplegendName1 = legendWords1.join(" ");

         desc += "**Best Legend: **" + toplegendName + " (" + legends1[topLegend].rating + " ELO, " + legends1[topLegend].tier + ", " + Math.floor(legends1[topLegend].wins / legends1[topLegend].games * 100) + "% winrate)" + splitline;
         desc += "**Most Used Legend: **" + toplegendName1 + " (" + legends1[y].rating + " ELO, " + legends1[y].tier + ", " + Math.floor(legends1[y].wins / legends1[y].games * 100) + "% winrate)" + splitline;
       });
     } else {
       desc += "\n";
       var legendFound = false;

       for(var i = 0; i < obj1.length; i++) {
         if(obj1[i].legend_name_key == legendName) {
           console.log("LEGEND FOUND");
           const legendWords1 = obj1[i].legend_name_key.split(" ");

           for(var j = 0 ; j < legendWords1.length; j++) {
             legendWords1[j] = legendWords1[j][0].toUpperCase() + legendWords1[j].substr(1);
           }

           var selectedLegendName = legendWords1.join(" ");

           legendFound = true;
           desc += "**Legend Name: **" + selectedLegendName + splitline;
           desc += "**Level: **" + obj1[i].level + splitline;
           desc += "**Playtime: **" + Math.floor(obj1[i].matchtime / 3600) + " hours" + splitline;
           desc += "**XP Percentage to Next Level: **" + Math.floor(obj1[i].xp_percentage * 100) + "%" + splitline;
           desc += "**Total Damage Dealt: **" + obj1[i].damagedealt + splitline;
           desc += "**Total Damage Taken: **" + obj1[i].damagetaken + splitline;
           desc += "**Total KOs: **" + obj1[i].kos + splitline;
           desc += "**Total Deaths: **" + (obj1[i].falls + obj1[i].suicides) + splitline;
           desc += "**Win Rate: **" + Math.floor(obj1[i].wins / obj1[i].games * 100) + "%" + splitline;

         }
       }

       if(!legendFound) return message.reply("that's not a valid legend! Try again.");


     }

     if(!empty) {
       embed.setDescription(desc);
       embed.setColor("#D43FEB");
       message.channel.send(embed);
     }

   });


}

exports.config = {
  name: "bhstats",
  usage: "bhstats <user/id (optional)> <legend name (optional)/ranked>",
  description: "Get some brawlhalla stats!\nNOTE: You cannot get the ranked data of a CERTAIN LEGEND. Do not use these parameters AT THE SAME TIME.",
  category: "brawlhalla",
  permissionLevel: 0
};
