const fs = require("fs");
let https = require("https");
let XMLHttpRequest = require("xhr2");

class HelperFunctions {
  static download(url, dest, cb) {
    let file = fs.createWriteStream(dest);
    let request = https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", function () {
          file.close(cb); // close() is async, call cb after close completes.
        });
      })
      .on("error", function (err) {
        // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
      });
  }

  static makeRequest(method, url, done) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      done(null, xhr.response);
    };
    xhr.onerror = function () {
      done(xhr.response);
    };
    xhr.send();
  }

  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

exports.HelperFunctions = HelperFunctions;
