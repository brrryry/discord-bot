/*
File: bhstats.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.run = async (client, message, args, level) => {
  //Get user and their ID
   var user = message.author.id;
   var bhIDOutput = ""; //Used to store brawlhalla ID that is found in the table
   var empty = false; //Used to verify that there is data when fetching results
   var legendName = ""; //Specific Legend Names
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

   //Locate brawlhalla ID in table
   let getID = new Promise(resolve => {
     db.all(`SELECT * FROM bhbinds WHERE discordID = "${user}"`, (err, rows)  => {
       rows.forEach(row => {
         bhIDOutput = row.bhID;
       });
     });

     setTimeout(() => {resolve("Y");}, 500);
   });

   let idResults = await getID;

   //If the ID is not found, it's not in the table. Return error.
   if(bhIDOutput == "") return message.reply("this person has not binded their brawlhalla account!");

   //Start setting up Embed variables
   var embed = new Discord.MessageEmbed().setTitle("Brawlhalla Stats!")
   var desc = "";
   var splitline = "\n\n";

   //Fetch Brawlhalla API
   let output = await fetch("https://api.brawlhalla.com/player/" + bhIDOutput + "/stats?api_key=V8TCNU1BJU7SMGZ21V5I").then(response => response.json()).then(async data => {

     var stringField = JSON.stringify(data); //Output JSON'd
     const obj = JSON.parse(stringField); //Parse through output


     var stringField1 = JSON.stringify(obj.legends); //Find legend data
     const obj1 = JSON.parse(stringField1); //Parse legend data

     var mostUsedLegend = "None"; //Used to display the most used legend
     var highestLevel = 0; //Used to display the legend that has the highest level
     var totalHours = 0; //Used to find total hours of gameplay

     //Updaate variables
     for(var i = 0; i < obj1.length; i++) {
       totalHours += obj1[i].matchtime; //Add total matchtime of each legend to total playtime variable
       //Calculate most used legend and highest level
       if(obj1[i].xp > highestLevel) {
         highestLevel = obj1[i].xp;
         const legendWords = obj1[i].legend_name_key.split(" ");

         for(var j = 0 ; j < legendWords.length; j++) {
           legendWords[j] = legendWords[j][0].toUpperCase() + legendWords[j].substr(1);
         }

         mostUsedLegend = legendWords.join(" ");
       }
     }


     //If no specific legend's data is specified in the input
     if(legendName == "") {
       desc += "\n";
       desc += "**ID:** " + obj.brawlhalla_id + splitline;
       desc += "**Name:** " + obj.name + splitline;
       desc += "**Level:** " + obj.level + splitline;
       desc += "**Playtime:** " + Math.floor(totalHours / 3600) +  " hours" + splitline;
       desc += "**XP Percentage To Next Level:** " + Math.floor(obj.xp_percentage * 100) + "%" + splitline;
       desc += "**Win Rate:** " + Math.floor(obj.wins / obj.games * 100) + "%" + splitline;
       desc += "**Most Used Legend:** " + mostUsedLegend + splitline;
     } else if (legendName == "ranked") { //If person wants to see RANKED data
       let output1 = await fetch("https://api.brawlhalla.com/player/" + bhIDOutput + "/ranked?api_key=V8TCNU1BJU7SMGZ21V5I").then(response => response.json()).then(data1 => {
         var rankedString = JSON.stringify(data1);
         const rankobj = JSON.parse(rankedString);

         //If there's no ranked data
         if(JSON.stringify(rankobj) === JSON.stringify({})) {
           empty = true;
           return message.reply ("this person doesn't seem to have a ranked career yet.");
         }

         //Parse through legend data
         var rankedStringLegends = JSON.stringify(rankobj.legends);
         const legends1 = JSON.parse(rankedStringLegends);

         //Add data to embed description
         desc += "**Name: **" + rankobj.name + splitline;
         desc += "**Current ELO: **" + rankobj.rating + splitline;
         desc += "**Peak ELO: **" + rankobj.peak_rating + splitline;
         desc += "**Current Tier: **" + rankobj.tier + splitline;
         desc += "**Winrate: **" + Math.floor(rankobj.wins / rankobj.games * 100) + "%" + splitline;
         desc += "**Region: **" + rankobj.region + splitline;

         //Variables for top legend
         var topLegend = 0;
         var topELO = 0;
         var topGames = 0;
         var y = 0; //Used to find index of legend (no idea why it's named "y")

         //Find highest ELO and legend with the most games
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
     } else { //If there IS  a targeted specific legend
       desc += "\n";
       var legendFound = false;

       for(var i = 0; i < obj1.length; i++) {
         if(obj1[i].legend_name_key == legendName) {
           const legendWords1 = obj1[i].legend_name_key.split(" ");

           for(var j = 0 ; j < legendWords1.length; j++) {
             legendWords1[j] = legendWords1[j][0].toUpperCase() + legendWords1[j].substr(1);
           }

           var selectedLegendName = legendWords1.join(" ");
          
           //Add data to description
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

     //If data isn't empty, send embed and return
     if(!empty) {
       embed.setDescription(desc);
       embed.setColor("#D43FEB");
       return message.channel.send(embed);
     }

     //If data is empty, return notification
     return message.channel.send("There seems to be no data here...");

   });


}

exports.config = {
  name: "bhstats",
  usage: "bhstats <user/id (optional)> <legend name (optional)/ranked>",
  description: "Get some brawlhalla stats!\nNOTE: You cannot get the ranked data of a CERTAIN LEGEND. Do not use these parameters AT THE SAME TIME.",
  category: "brawlhalla",
  permissionLevel: 0
};
