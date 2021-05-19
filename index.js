var XMLHttpRequest = require('xhr2');

const Discord = require('discord.js');
const client = new Discord.Client();

const guildId = '713782418057855057';
const movieUrl = "http://www.omdbapi.com/?apikey=" + process.env.omdbkey + "&plot=full&t="

client.on('ready', async () => {
    console.log('Client is ready.');

    const commands = await getApp(guildId).commands.get();

    console.log(commands);

    await getApp(guildId).commands.post({
        data: {
            name: 'ping',
            description: 'A simple ping pong command'
        }
    });

    await getApp(guildId).commands.post({
        data: {
            name: 'embed',
            description: 'Displays an embed',
            options: [
                {
                    name: 'name',
                    description: 'Your name',
                    required: true,
                    type: 3 // string
                },
                {
                    name: 'age',
                    description: 'Your age',
                    required: false,
                    type: 4 // integer
                }
            ]
        }
    });

    await getApp(guildId).commands.post({
        data: {
            name: 'bulldogs',
            description: 'Whistle Bully'
        }
    });

    await getApp(guildId).commands.post({
        data: {
            name: 'movie',
            description: 'Display information about a given movie',
            options: [
                {
                    name: 'name',
                    description: 'Name of movie to search',
                    required: true,
                    type: 3 // string
                }
            ]
        }
    });

    client.ws.on('INTERACTION_CREATE', async (interaction) => {
        const { name, options } = interaction.data;

        const command = name.toLowerCase();

        const args = {};

        console.log(options);

        if (options) {
            for (const option of options) {
                const { name, value } = option;
                args[name] = value;
            }
        }

        console.log(args);

        switch (command) {
            case 'ping':
                reply(interaction, 'pong');
                break;
            case 'bulldogs':
                reply(interaction, 'RUF RUF')
                break;
            case 'embed':
                const embed = new Discord.MessageEmbed().setTitle('Example Embed');

                for (const arg in args) {
                    const value = args[arg];
                    embed.addField(capitalizeFirstLetter(arg), value);
                }

                reply(interaction, embed);
            case 'movie':
                args.name = args.name.replace(/ /g, "+");

                const requestUrl = movieUrl + args.name;

                makeRequest('GET', requestUrl, function (err, data) {
                    if (err) {
                        console.log("Error receiving movie data" + err);
                    }

                    // Begin accessing JSON data here
                    var responseData = JSON.parse(data);

                    if (responseData.Title == null) {
                        reply(interaction, "Sorry, I couldn't find that one");
                        return;
                    }

                    const embed = new Discord.MessageEmbed().setTitle(responseData.Title + ' (' + responseData.Year + ')');

                    embed.addFields(
                        { name: "Runtime", value: responseData.Runtime },
                        { name: "IMDB Rating", value: responseData.imdbRating },
                        { name: "Genre", value: responseData.Genre },
                        { name: "Director", value: responseData.Director },
                        { name: "Actors", value: responseData.Actors },
                        { name: "Plot", value: responseData.Plot },
                        { name: "Trailer", value: "https://www.youtube.com/watch?v=KfL_V_YaHj8" }
                    )

                    embed.setImage(responseData.Poster);

                    reply(interaction, embed);
                })
                break;
            default:
                console.log("Command not recognised")
                break;
        }
    })
})

const getApp = (guildId) => {
    const app = client.api.applications(client.user.id);

    if (guildId) {
        app.guilds(guildId)
    }

    return app;
}

const reply = async (interaction, response) => {
    let data = {
        content: response
    }

    if (typeof response === 'object') {
        data = await createApiMessage(interaction, response);
    }

    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 4,
            data
        }
    })
}

const createApiMessage = async (interaction, content) => {
    const { data, files } = await Discord.APIMessage.create(
        client.channels.resolve(interaction.channel_id),
        content
    ).resolveData().resolveFiles();

    return { ...data, files };
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function makeRequest(method, url, done) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
        done(null, xhr.response);
    };
    xhr.onerror = function () {
        done(xhr.response);
    };
    xhr.send();
}

client.login(process.env.token);