const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

exports.run = async(client, message, args, level) => {
  var itemNames = ["Prestige"];



  //special algorithm to determine prestige: 1000, 2500, 4500, 7000, 10000
  //250x^2+1250x+1000

}

exports.config = {
  name: "shop",
  usage: "shop",
  description: "Open the shop! Spend some Cat Coins!",
  category: "currency",
  permissionLevel: 0,
  aliases: ['buy']
};
