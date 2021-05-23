const fs = require("fs");
let https = require("https");

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
}

exports.HelperFunctions = HelperFunctions;
