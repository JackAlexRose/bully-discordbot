const { HelperFunctions } = require("./helperFunctions");
const { MovieManager } = require("./movieManager");
const { GameboyManager, GameboyKeyMap } = require("./gameboyManager");
const pokemonGameboy = new GameboyManager(
  "./PokemonRed.gb",
  240,
  "./pokemonRed.sav"
);

const p4k = require("pitchfork-bnm");

const Discord = require("discord.js");
const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

client.on("ready", async () => {
  bullyLogger("Bully is online");

  const commands = await getApp(process.env.testguildid).commands.get();

  console.log(commands);

  await getApp(process.env.testguildid).commands.post({
    data: {
      name: "ping",
      description: "A simple ping pong command",
    },
  });

  await getApp(process.env.testguildid).commands.post({
    data: {
      name: "pitchfork",
      description: "Get best new music from pitchfork",
    },
  });

  await getApp(process.env.testguildid).commands.post({
    data: {
      name: "embed",
      description: "Displays an embed",
      options: [
        {
          name: "name",
          description: "Your name",
          required: true,
          type: 3, // string
        },
        {
          name: "age",
          description: "Your age",
          required: false,
          type: 4, // integer
        },
      ],
    },
  });

  await getApp().commands.post({
    data: {
      name: "bulldogs",
      description: "Whistle Bully",
    },
  });

  await getApp().commands.post({
    data: {
      name: "movie",
      description: "Display information about a given movie",
      options: [
        {
          name: "name",
          description: "Name of movie to search",
          required: true,
          type: 3, // string
        },
      ],
    },
  });

  await getApp().commands.post({
    data: {
      name: "pokemon",
      description: "Pokemon Red on a Gameboy Emulator",
      options: [
        {
          name: "button",
          description: 'Button to press, type "help" for help',
          required: false,
          type: 3, // string
        },
        {
          name: "amount",
          description: "Amount of times you want to press this button",
          required: false,
          type: 4, // integer
        },
      ],
    },
  });

  client.ws.on("INTERACTION_CREATE", async (interaction) => {
    const { name, options } = interaction.data;

    const command = name;

    const args = {};

    if (options) {
      for (const option of options) {
        const { name, value } = option;
        args[name] = value;
      }
    }

    switch (command) {
      case "ping":
        reply(interaction, "pong");
        break;
      case "bulldogs":
        reply(interaction, "RUF RUF");
        break;
      case "embed":
        const exampleEmbed = new Discord.MessageEmbed().setTitle(
          "Example Embed"
        );

        for (const arg in args) {
          const value = args[arg];
          exampleEmbed.addField(
            HelperFunctions.capitalizeFirstLetter(arg),
            value
          );
        }

        reply(interaction, exampleEmbed);
        break;
      case "movie":
        if (args?.name) {
          sendMovieRequest(interaction, args.name);
        }
        break;
      case "pokemon":
        const buttonPressed = args?.button?.toUpperCase().trim();

        const pokemonEmbed = new Discord.MessageEmbed();

        if (buttonPressed == "HELP") {
          pokemonEmbed.setTitle("Gameboy User Manual");
          pokemonEmbed.addFields(
            {
              name: "Buttons",
              value:
                "Type /gameboy and one of the available buttons: a, b, left, down, right, up, select or start",
            },
            {
              name: "Saving",
              value:
                "Save in game and then type /gameboy with save as the button to store the save file for later",
            }
          );
        } else if (buttonPressed == "SAVE") {
          pokemonEmbed.addFields({
            name: "Saving SRAM contents",
            value:
              "Please ensure you have saved ingame before running this command",
          });
          gameboySaveGame();
        } else if (GameboyKeyMap.includes(buttonPressed)) {
          if (!args.amount) args.amount = 1;

          if (args.amount >= 100 || args.amount < 1) {
            pokemonEmbed.addFields({
              name: "Invalid amount entered",
              value: "Please enter an amount for key presses between 1 and 100",
            });
          } else {
            pokemonEmbed.addFields({
              name: `${buttonPressed} Button Pressed ${args?.amount} times`,
              value: "Processing frames...",
            });

            pokemonGameboy.pressKey(buttonPressed, args.amount).then(() => {
              client.channels
                .resolve(interaction.channel_id)
                .send({ files: ["./screen.png"] });
            });
          }
        } else {
          pokemonEmbed.addFields({
            name: "Invalid button press",
            value: "Type help for gameboy button if you need to see the manual",
          });
        }

        reply(interaction, pokemonEmbed);
        break;
      case "pitchfork":
        newPitchforkAlbum();
        break;
      default:
        bullyLogger("Command not recognised");
        break;
    }
  });

  newPitchforkAlbum();
  pokemonGameboy.start();
  gameboyLoadSaveGame();
});

const sendMovieRequest = (interaction, movieName, user = "") => {
  bullyLogger(`Fetching movie ${movieName}`);
  MovieManager.sendMovieRequest(movieName)
    .then((responseData) => {
      const embed = new Discord.MessageEmbed().setTitle(responseData.Title);

      embed.addFields(
        { name: "Year", value: responseData.Year },
        { name: "Runtime", value: responseData.Runtime },
        { name: "IMDB Rating", value: responseData.imdbRating },
        { name: "Genre", value: responseData.Genre },
        { name: "Director", value: responseData.Director },
        { name: "Actors", value: responseData.Actors },
        { name: "Plot", value: responseData.Plot }
        //{ name: "Trailer", value: "https://www.youtube.com/watch?v=KfL_V_YaHj8" }
      );

      embed.setImage(responseData.Poster);

      if (user) {
        user
          .send("Hey, you asked me to add this movie to your watchlist:")
          .then((msg) => msg.delete({ timeout: 10000 }));
        embed.setFooter(
          "Hit the ✅ below to remove this movie from your watchlist"
        );
        user.send(embed).catch(console.error);
        return;
      }

      embed.setFooter("Hit the 📋 below to add this movie to your watchlist");

      reply(interaction, embed);
    })
    .catch((errorMessage) => {
      bullyLogger(errorMessage);
      reply(interaction, errorMessage);
    });
};

client.on("messageReactionAdd", async (reaction, user) => {
  // When a reaction is received, check if the structure is partial
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message: ", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }

  // Now the message has been cached and is fully available
  if (reaction.message.author.id == "713014610344804422" && !user.bot) {
    if (reaction._emoji.name === "📋") {
      const movieTitle = reaction.message.embeds[0].title;
      bullyLogger("Add to watchlist: " + movieTitle + " for: " + user.username);
      sendMovieRequest(undefined, movieTitle, user);
    } else if (
      reaction._emoji.name === "✅" &&
      reaction.message.channel.type === "dm"
    ) {
      console.log("Removing a movie from dms for: ", user.username);
      reaction.message.delete();
    }
  }
});

client.on("message", (message) => {
  try {
    if (
      message.author.id == "713014610344804422" &&
      Object.values(message.embeds[0]?.fields[0]).includes("Year")
    ) {
      if (message.channel.type !== "dm") {
        message.react("📋");
      } else {
        message.react("✅");
      }
    }
  } catch (error) {
    console.log("Not a movie embed, skipping");
  }
});

const getApp = (guildId) => {
  const app = client.api.applications(client.user.id);

  if (guildId) {
    app.guilds(guildId);
  }

  return app;
};

const reply = async (interaction, response) => {
  let data = {
    content: response,
  };

  if (typeof response === "object") {
    data = await createApiMessage(interaction, response);
  }

  client.api.interactions(interaction.id, interaction.token).callback.post({
    data: {
      type: 4,
      data,
    },
  });
};

const createApiMessage = async (interaction, content) => {
  const { data, files } = await Discord.APIMessage.create(
    client.channels.resolve(interaction.channel_id),
    content
  )
    .resolveData()
    .resolveFiles();

  return { ...data, files };
};

const newPitchforkAlbum = () => {
  const myGuild = client.guilds.cache.get(process.env.testguildid);
  const memoryChannel = myGuild.channels.cache.get("845043427761717258");

  memoryChannel.messages
    .fetch({ limit: 1 })
    .then((messages) => {
      const lastMessage = messages.first();
      let lastMessageObject;

      if (lastMessage) {
        try {
          lastMessageObject = JSON.parse(lastMessage);
        } catch (error) {
          console.log("Failed to parse last message as object");
          lastMessageObject = undefined;
        }
      }

      p4k.getBestNewAlbums().then((albums) => {
        if (!lastMessageObject || albums[0].title !== lastMessageObject.title) {
          let trackInfoObject = {};
          ["artist", "title", "genres", "score", "abstract"].forEach(
            (prop) => (trackInfoObject[prop] = albums[0][prop])
          );
          memoryChannel.send(JSON.stringify(trackInfoObject));
        } else {
          bullyLogger("Pitchfork album has already been posted, skipping");
        }
      });
    })
    .catch(console.error);
};

const gameboyLoadSaveGame = () => {
  const saveGameChannel = getSaveGameChannel();

  saveGameChannel.messages.fetch({ limit: 1 }).then((messages) => {
    const lastMessage = messages.first();

    let attachmentUrl = lastMessage?.attachments?.first?.().url;

    pokemonGameboy.loadSRAM(attachmentUrl);
  });
};

const gameboySaveGame = async () => {
  const saveGameChannel = getSaveGameChannel();

  const messages = await saveGameChannel.messages.fetch({ limit: 1 });
  const lastMessage = messages.first();

  try {
    const response = await pokemonGameboy.saveSRAM();
    bullyLogger(response);
    if (lastMessage) {
      lastMessage.delete();
    }
    saveGameChannel.send({ files: ["./sramcontents.sav"] });
  } catch (error) {
    bullyLogger("Error writing to file");
  }
};

const getSaveGameChannel = () => {
  const myGuild = client.guilds.cache.get(process.env.testguildid);
  return myGuild.channels.cache.get(process.env.pokemonsavechannel);
};

const bullyLogger = (log) => {
  console.log(log);

  const myGuild = client.guilds.cache.get(process.env.bulldogsguildid);
  const loggerChannel = myGuild.channels.cache.get(
    process.env.bulldogsloggerid
  );

  loggerChannel.send(log);
};

client.login(process.env.token);
