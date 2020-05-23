var XMLHttpRequest = require('xhr2');
const Discord = require('discord.js');
const Client = new Discord.Client();
let movieHttp = new XMLHttpRequest();
let ratherHttp = new XMLHttpRequest();
let codTokenRequest = new XMLHttpRequest();
let codAuthRequest = new XMLHttpRequest();
let codHttp = new XMLHttpRequest();
var movieChannel, ratherChannel, codChannel;
var url;

Client.once('ready', () => {
	console.log('Client ready!');
});

Client.on('message', message => {
    if(message.content.toUpperCase().startsWith(`-MOVIE `)){
        url = "http://www.omdbapi.com/?apikey="+ process.env.omdbkey + "&plot=full&t="
        var request = message.content.slice(7);

        request = request.replace(/ /g, "+");
        url = url + request;

        movieChannel = message.channel;

        movieHttp.open('GET', url, true);
        movieHttp.send();
    }
    else if(message.content.toUpperCase().startsWith(`-RATHER`)||message.content.toUpperCase().startsWith(`-WYR`)){
        url = "https://www.rrrather.com/botapi";
        ratherChannel = message.channel;

        ratherHttp.open('GET', url, true);
        ratherHttp.send();
    }
    else if(message.content.toUpperCase().startsWith(`-BULLDOGS`)){
      message.channel.send("RUF RUF");
    }
    else if(message.content.toUpperCase().startsWith(`-COD`)){
      url = "https://profile.callofduty.com/cod/login"
      codChannel = message.channel;

      console.log('Sending cod token request');
      codTokenRequest.open('GET', url, true);
      codTokenRequest.send();
    }
})

// Movie callback
movieHttp.onload = function(){
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
ratherHttp.onload = function(){
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

codTokenRequest.onload = function(){
  console.log('Hi test success');
  console.log(this.responseText);
  //var data = JSON.parse(this.response);
  var csrf = this.getResponseHeader('x-csrf-token');
  //codChannel.send(csrf);
  console.log(csrf);
}

Client.login(process.env.token);