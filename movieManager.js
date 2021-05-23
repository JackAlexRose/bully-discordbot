const movieUrl =
  "http://www.omdbapi.com/?apikey=" + process.env.omdbkey + "&plot=full&t=";

const { HelperFunctions } = require("./helperFunctions");

class MovieManager {
  static sendMovieRequest(movieName) {
    return new Promise(function (resolve, reject) {
      movieName = movieName.replace(/ /g, "+");

      const requestUrl = movieUrl + movieName;

      HelperFunctions.makeRequest("GET", requestUrl, function (err, data) {
        if (err) {
          console.log("Error receiving movie data" + err);
        }

        // Begin accessing JSON data here
        let responseData = JSON.parse(data);

        if (responseData.Title == null && interaction) {
          reply(interaction, "Sorry, I couldn't find that one");
          reject("Sorry, I couldn't find that one");
          return;
        }

        resolve(responseData);
      });
    });
  }
}

exports.MovieManager = MovieManager;
