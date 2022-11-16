const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id
const fs = require("fs");
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

exports.run = async (client, message, args, level) => {

    if(!args[0]) return message.channel.send("ERROR: Line Missing");

    if(args[0].startsWith("SELECT")) {

      var rowData = 0;


      let rowDataPromise = new Promise(resolve => {
        db.all(args.slice(0).join(" "), (err, rows) => {
          if(!rows) return message.channel.send("ERROR: No rows!");
          var outputString = "```OUTPUT```\n" + JSON.stringify(rows);

          if(outputString.length >= 2000) return message.channel.send("ERROR: Text is too long! Check the console for details.");

          console.log(rows);
          message.channel.send(outputString);
        });

        setTimeout(() => resolve("Y"), 1000);
      })

      let rowDataResult = await rowDataPromise;
    } else if (args[0].startsWith("UPDATE")) {

      db.run(args.slice(0).join(" "));

      message.channel.send("Command executed.");

    }


}

exports.config = {
  name: "sqlexecute",
  usage: "sqlexecute <string>",
  description: "Execute SQL lines directly into the database!",
  category: "utility",
  permissionLevel: 10
};
