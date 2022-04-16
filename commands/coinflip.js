const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const exec = require('child_process').exec;
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id

let signin_ids = [];

exports.run = async (client, message, args, level) => {
  let value = Math.floor(Math.random() * 2); //0 or 1
  if(value == 0) return message.reply("The coin landed on heads!");
  return message.reply("The coin landed on tails!");
}

exports.config = {
  name: "coinflip",
  usage: "coinflip",
  description: "Flip a coin :D",
  category: "fun",
  permissionLevel: 0,
  aliases: ['cf']
};
