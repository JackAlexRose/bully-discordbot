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
    } else {
      message.channel.send("Usage is:\n-cod wz kills\n-cod wz wins\n-cod wz kd\n-cod wz deaths\n-cod mp kills\n-cod mp wins\n-cod mp kd\n-cod mp deaths");
      return;
    }

    codChannel = message.channel;

    CodApi.login(`${process.env.codAccountEmail}`, `${process.env.codAccountPassword}`).then((response) => {
      var people = [];

      if (message.content.toUpperCase().startsWith(`-COD WZ`)) {
        //I want Warzone Data
        CodApi.MWwz(MyActivisionName).then(data => {
          data.br.title = MyActivisionName.slice(0, MyActivisionName.indexOf('#'));
          people.push(data.br);
        }).catch(err => {
          console.log(err);
        });

        CodApi.MWfriends(MyActivisionName).then(data => {
          var counter = data.length;
          var usernames = [];


          for (let key in data) {
            console.log(data[key].lifetime.all);
            usernames[key] = data[key].username;
            CodApi.MWwz(usernames[key]).then(result => {
              result.br.title = usernames[key].slice(0, usernames[key].indexOf('#'));
              people.push(result.br);

              counter--;
              if (counter == 0) {
                codCallback(people);
              }
            }).catch(err => {
              console.log(err);
            });
          }
        }).catch(err => {
          console.log(err);
        });
      }
      else if (message.content.toUpperCase().startsWith(`-COD MP`)) {
        //I want MultiPlayer Data
        CodApi.MWmp(MyActivisionName).then(data => {
          //console.log(data.lifetime.all.properties);
          console.log(data.lifetime);
          // data.br.title = MyActivisionName.slice(0, MyActivisionName.indexOf('#'));
          // people.push(data.br);
        }).catch(err => {
          console.log(err);
        });

        // CodApi.MWfriends(MyActivisionName).then(data => {
        //   var counter = data.length;
        //   var usernames = [];

        //   for (let key in data) {
        //     usernames[key] = data[key].username;
        //     CodApi.MWwz(usernames[key]).then(result => {
        //       result.br.title = usernames[key].slice(0, usernames[key].indexOf('#'));
        //       people.push(result.br);

        //       counter--;
        //       if (counter == 0) {
        //         codCallback(people);
        //       }
        //     }).catch(err => {
        //       console.log(err);
        //     });
        //   }
        // }).catch(err => {
        //   console.log(err);
        // });
      }
    })
  }
})

// Movie callback
movieHttp.onload = function () {
  // Begin accessing JSON data here
  var data = JSON.parse(this.response);

  if (movieHttp.status >= 200 && movieHttp.status < 400) {
    // Send the message
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
      stats.sort((a, b) => (a.kills < b.kills) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].title + ": " + stats[key].kills + "\n";
      }
      break;
    case "wzwins":
      codResponseMessage = "---------Warzone Wins---------\n";
      stats.sort((a, b) => (a.wins < b.wins) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].title + ": " + stats[key].wins + "\n";
      }
      break;
    case "wzkd":
      codResponseMessage = "---------Warzone K/D---------\n";
      stats.sort((a, b) => (a.kdRatio < b.kdRatio) ? 1 : -1);
      for (let key in stats) {
        // Round the k/d to 2dp
        stats[key].kdRatio = Math.round((stats[key].kdRatio + Number.EPSILON) * 100) / 100
        codResponseMessage += stats[key].title + ": " + stats[key].kdRatio + "\n";
      }
      break;
    case "wzdeaths":
      codResponseMessage = "---------Warzone Deaths---------\n";
      stats.sort((a, b) => (a.deaths < b.deaths) ? 1 : -1);
      for (let key in stats) {
        codResponseMessage += stats[key].title + ": " + stats[key].deaths + "\n";
      }
      break;
    default:
      console.log("Unrecognised stat: " + codStatToTrack);
  }

  codChannel.send(codResponseMessage);
}

Client.login(process.env.token);