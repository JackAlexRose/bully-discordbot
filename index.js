var XMLHttpRequest = require('xhr2');
const Discord = require('discord.js');
const fetch = require("node-fetch");
var FormData = require('form-data');
const CodApi = require('call-of-duty-api')({ platform: "uno" });
const Client = new Discord.Client();
let movieHttp = new XMLHttpRequest();
let ratherHttp = new XMLHttpRequest();
var movieChannel, ratherChannel, codChannel;
var url;
const MyActivisionName = 'PLAGUESPITTER#3141115';
var codStatToTrack = 'wzkills';

Client.once('ready', () => {
  console.log('Client ready!');
});

Client.on('message', async message => {
  if (message.author.username == "Groovy"){
    console.log(message.embeds[0]);
  }
  if (message.content.toUpperCase().startsWith(`-MOVIE `)) {
    url = "http://www.omdbapi.com/?apikey=" + process.env.omdbkey + "&plot=full&t="
    var request = message.content.slice(7);

    request = request.replace(/ /g, "+");
    url = url + request;

    movieChannel = message.channel;

    movieHttp.open('GET', url, true);
    movieHttp.send();
  }
  else if (message.content.toUpperCase().startsWith(`-RATHER`) || message.content.toUpperCase().startsWith(`-WYR`)) {
    url = "https://www.rrrather.com/botapi";
    ratherChannel = message.channel;

    ratherHttp.open('GET', url, true);
    ratherHttp.send();
  }
  else if (message.content.toUpperCase().startsWith(`-BULLDOGS`)) {
    message.channel.send("RUF RUF");
  }
  else if (message.content.toUpperCase().startsWith(`-COD`)) {
    if (message.content.toUpperCase().startsWith(`-COD WZ KILLS`)) {
      codStatToTrack = 'wzkills';
    } else if (message.content.toUpperCase().startsWith(`-COD WZ WINS`)) {
      codStatToTrack = 'wzwins';
    } else if (message.content.toUpperCase().startsWith(`-COD WZ KD`)) {
      codStatToTrack = 'wzkd';
    } else if (message.content.toUpperCase().startsWith(`-COD WZ DEATHS`)) {
      codStatToTrack = 'wzdeaths';
    } else if (message.content.toUpperCase().startsWith(`-COD MP KILLS`)) {
      codStatToTrack = 'mpkills';
    } else if (message.content.toUpperCase().startsWith(`-COD MP WINS`)) {
      codStatToTrack = 'mpwins';
    } else if (message.content.toUpperCase().startsWith(`-COD MP KD`)) {
      codStatToTrack = 'mpkd';
    } else if (message.content.toUpperCase().startsWith(`-COD MP DEATHS`)) {
      codStatToTrack = 'mpdeaths';
    } else if (message.content.toUpperCase().startsWith(`-COD MP STREAK`)) {
      codStatToTrack = 'mpstreak';
    } else if (message.content.toUpperCase().startsWith(`-COD MP BESTKILLS`)) {
      codStatToTrack = 'mpbestkills';
    } else {
      message.channel.send("Usage is:\n-cod wz kills\n-cod wz wins\n-cod wz kd\n-cod wz deaths\n-cod mp kills\n-cod mp wins\n-cod mp kd\n-cod mp deaths\n-cod mp streak\n-cod mp bestkills");
      return;
    }

    codChannel = message.channel;

    CodApi.login(`${process.env.codAccountEmail}`, `${process.env.codAccountPassword}`).then((response) => {
      var people = [];

      CodApi.MWmp(MyActivisionName).then(data => {
        data.username = data.username.slice(0, data.username.indexOf('#'));
        people.push(data);
      }).catch(err => {
        console.log(err);
      });

      CodApi.MWfriends(MyActivisionName).then(data => {
        var counter = data.length;

        for (let key in data) {
          data[key].username = data[key].username.slice(0, data[key].username.indexOf('#'));
          people.push(data[key]);
          counter--;
          if (counter == 0) {
            codCallback(people);
          }
        }

      }).catch(err => {
        console.log(err);
      });
    })
  }
})

// Movie callback
movieHttp.onload = function () {
  // Begin accessing JSON data here
  var data = JSON.parse(this.response);

  if (movieHttp.status >= 200 && movieHttp.status < 400) {
    // Send the message
    if (data.Title == null) {
      movieChannel.send("Sorry, I couldn't find that one");
      return;
    }
    movieChannel.send("Title: " + data.Title + "\nYear: " + data.Year + "\nDirector: " + data.Director + "\nGenre: " + data.Genre + "\nCast: " + data.Actors + "\nRuntime: " + data.Runtime + "\nLanguage: " + data.Language + "\nPlot: " + data.Plot + "\n" + data.Poster);
  } else {
    console.log('Movie http status error');
  }
}

// Would you rather callback
ratherHttp.onload = function () {
  var data = JSON.parse(this.response);

  if (ratherHttp.status >= 200 && ratherHttp.status < 400) {
    var question = data.title;

    // Capitalise the first letter of the question
    question[0] = question[0].toUpperCase();

    // Send the message
    ratherChannel.send(question + ":\n\n😬 " + data.choicea + "\nOR\n😒 " + data.choiceb + "\n\nReact with your answer!");
  }
  else {
    console.log('Would you rather status error');
  }
}

function codCallback(stats) {
  var codResponseMessage;
  switch (codStatToTrack) {
    case "wzkills":
      codResponseMessage = "---------Warzone Kills---------\n";
      stats.sort((a, b) => (a.lifetime.mode.br.properties.kills < b.lifetime.mode.br.properties.kills) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.mode.br.properties.kills + "\n";
      }
      break;
    case "wzwins":
      codResponseMessage = "---------Warzone Wins---------\n";
      stats.sort((a, b) => (a.lifetime.mode.br.properties.wins < b.lifetime.mode.br.properties.wins) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.mode.br.properties.wins + "\n";
      }
      break;
    case "wzkd":
      codResponseMessage = "---------Warzone K/D---------\n";
      stats.sort((a, b) => (a.lifetime.mode.br.properties.kdRatio < b.lifetime.mode.br.properties.kdRatio) ? 1 : -1);
      for (let key in stats) {
        // Round the k/d to 2dp
        stats[key].lifetime.mode.br.properties.kdRatio = Math.round((stats[key].lifetime.mode.br.properties.kdRatio + Number.EPSILON) * 100) / 100
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.mode.br.properties.kdRatio + "\n";
      }
      break;
    case "wzdeaths":
      codResponseMessage = "---------Warzone Deaths---------\n";
      stats.sort((a, b) => (a.lifetime.mode.br.properties.deaths < b.lifetime.mode.br.properties.deaths) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.mode.br.properties.deaths + "\n";
      }
      break;
    case "mpkills":
      codResponseMessage = "---------Multiplayer Kills---------\n";
      stats.sort((a, b) => (a.lifetime.all.properties.kills < b.lifetime.all.properties.kills) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.all.properties.kills + "\n";
      }
      break;
    case "mpwins":
      codResponseMessage = "---------Multiplayer Wins---------\n";
      stats.sort((a, b) => (a.lifetime.all.properties.wins < b.lifetime.all.properties.wins) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.all.properties.wins + "\n";
      }
      break;
    case "mpkd":
      codResponseMessage = "---------Multiplayer K/D---------\n";
      stats.sort((a, b) => (a.lifetime.all.properties.kdRatio < b.lifetime.all.properties.kdRatio) ? 1 : -1);
      for (let key in stats) {
        // Round the k/d to 2dp
        stats[key].lifetime.all.properties.kdRatio = Math.round((stats[key].lifetime.all.properties.kdRatio + Number.EPSILON) * 100) / 100
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.all.properties.kdRatio + "\n";
      }
      break;
    case "mpdeaths":
      codResponseMessage = "---------Multiplayer Deaths---------\n";
      stats.sort((a, b) => (a.lifetime.all.properties.deaths < b.lifetime.all.properties.deaths) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.all.properties.deaths + "\n";
      }
      break;
    case "mpstreak":
      codResponseMessage = "---------Multiplayer Best Streak---------\n";
      stats.sort((a, b) => (a.lifetime.all.properties.recordKillStreak < b.lifetime.all.properties.recordKillStreak) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.all.properties.recordKillStreak + "\n";
      }
      break;
    case "mpbestkills":
      codResponseMessage = "---------Multiplayer Best Kills In One Game---------\n";
      stats.sort((a, b) => (a.lifetime.all.properties.bestKills < b.lifetime.all.properties.bestKills) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].username + ": " + stats[key].lifetime.all.properties.bestKills + "\n";
      }
      break;
    default:
      console.log("Unrecognised stat: " + codStatToTrack);
  }

  codChannel.send(codResponseMessage);
}

Client.login(process.env.token);