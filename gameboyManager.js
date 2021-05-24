const Gameboy = require("serverboy");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const msgpack = require("msgpack");
const { HelperFunctions } = require("./helperFunctions");

const GameboyKeyMap = [
  "RIGHT",
  "LEFT",
  "UP",
  "DOWN",
  "A",
  "B",
  "SELECT",
  "START",
];

class GameboyManager {
  constructor(romPath, framerate, saveDataPath) {
    this.romPath = romPath;
    this.framerate = framerate;
    this.saveDataPath = saveDataPath;
    this.gameboyTimeoutHandle = null;
    this.gameboyIntervalHandle = null;
  }

  start() {
    this.rom = fs.readFileSync(this.romPath);
    this.gameboy = new Gameboy();
  }

  startFrameProcessing() {
    if (this.gameboyTimeoutHandle) {
      clearTimeout(this.gameboyTimeoutHandle);
      this.gameboyTimeoutHandle = null;
    }

    if (this.gameboyIntervalHandle) {
      clearInterval(this.gameboyIntervalHandle);
      this.gameboyIntervalHandle = null;
    }

    this.gameboyIntervalHandle = setInterval(() => {
      this.gameboy.doFrame();
    }, 1000 / this.frameRate);

    this.gameboyTimeoutHandle = setTimeout(() => {
      clearInterval(this.gameboyIntervalHandle);
      this.gameboyIntervalHandle = null;
    }, 30000);
  }

  pressKey(key, amount) {
    return new Promise((resolve, reject) => {
      try {
        for (let i = 0; i < 4; i++) {
          this.gameboy.pressKey(key);
          this.gameboy.doFrame();
        }

        this.startFrameProcessing();

        setTimeout(() => {
          if (amount <= 1) this.takeScreenshot();
          setTimeout(() => {
            if (amount <= 1) {
              resolve("Button press(es) successful");
            } else {
              this.pressKey(key, amount - 1, callback);
            }
          }, 100);
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  takeScreenshot() {
    let screen = this.gameboy.getScreen();

    let png = new PNG({ width: 160, height: 144 });
    for (let i = 0; i < screen.length; i++) {
      png.data[i] = screen[i];
    }

    let buffer = PNG.sync.write(png);

    fs.writeFileSync("screen.png", buffer);
  }

  loadSRAM(url) {
    if (url) {
      HelperFunctions.download(url, "sramcontents.sav", (err) => {
        if (err) {
          console.log("Error loading file, loading rom without save data");
          this.gameboy.loadRom(this.rom);
        } else {
          console.log("Reading save from file");
          const saveData = fs.readFileSync("./sramcontents.sav");
          this.gameboy.loadRom(this.rom, msgpack.unpack(saveData));
        }
        this.startFrameProcessing();
      });
    } else {
      console.log("No attachments found, loading rom without save data");
      this.gameboy.loadRom(this.rom);
      this.startFrameProcessing();
    }
  }

  saveSRAM() {
    return new Promise(function (resolve, reject) {
      const saveDataArray = gameboy.getSaveData();
      if (saveDataArray) {
        writeFile("sramcontents.sav", msgpack.pack(saveDataArray), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve("Successfully saved game to file");
          }
        });
      }
    });
  }
}

exports.GameboyManager = GameboyManager;
exports.GameboyKeyMap = GameboyKeyMap;
