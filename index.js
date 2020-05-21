var XMLHttpRequest = require('xhr2');
const Discord = require('discord.js');
// const { prefix, token, omdbkey } = require('./config.json');
const client = new Discord.Client();
let xhttp = new XMLHttpRequest();
var channel;

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
    if(message.content.startsWith(`-movie `)){
        var url = "http://www.omdbapi.com/?apikey="+ process.env.omdbkey + "&plot=full&t="
        var request = message.content.slice(7);

        request = request.replace(/ /g, "+");
        url = url + request;

        channel = message.channel;

        // message.channel.send("Hey Searching for movie '" + request + "', POST URL will be: " + url);

        xhttp.open('GET', url, true);
        xhttp.send();
    }
})

xhttp.onload = function(){
    // Begin accessing JSON data here
  var data = JSON.parse(this.response);

  if (xhttp.status >= 200 && xhttp.status < 400) {
    channel.send("Title: " + data.Title + "\nYear: " + data.Year + "\nDirector: " + data.Director + "\nGenre: " + data.Genre + "\nCast: " + data.Actors + "\nRuntime: " + data.Runtime + "\nLanguage: " + data.Language + "\nPlot: " + data.Plot + "\n" + data.Poster);
    } else {
    console.log('error');
  }
}

client.login(process.env.token);