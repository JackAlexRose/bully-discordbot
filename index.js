var XMLHttpRequest = require('xhr2');
const p4k = require('pitchfork-bnm');

const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

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
            name: 'pitchfork',
            description: 'Get best new music from pitchfork'
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

    await getApp().commands.post({
        data: {
            name: 'bulldogs',
            description: 'Whistle Bully'
        }
    });

    await getApp().commands.post({
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

        if (options) {
            for (const option of options) {
                const { name, value } = option;
                args[name] = value;
            }
        }

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
                break;
            case 'movie':
                sendMovieRequest(interaction, args.name);
                break;
            case 'pitchfork':
                newPitchforkAlbum();
                break;
            default:
                console.log("Command not recognised")
                break;
        }
    })
})

const sendMovieRequest = (interaction, movieName, user = '') => {
    movieName = movieName.replace(/ /g, "+");

    const requestUrl = movieUrl + movieName;

    makeRequest('GET', requestUrl, function (err, data) {
        if (err) {
            console.log("Error receiving movie data" + err);
        }

        // Begin accessing JSON data here
        var responseData = JSON.parse(data);

        if (responseData.Title == null && interaction) {
            reply(interaction, "Sorry, I couldn't find that one");
            return;
        }

        const embed = new Discord.MessageEmbed().setTitle(responseData.Title);

        embed.addFields(
            { name: "Year", value: responseData.Year },
            { name: "Runtime", value: responseData.Runtime },
            { name: "IMDB Rating", value: responseData.imdbRating },
            { name: "Genre", value: responseData.Genre },
            { name: "Director", value: responseData.Director },
            { name: "Actors", value: responseData.Actors },
            { name: "Plot", value: responseData.Plot },
            //{ name: "Trailer", value: "https://www.youtube.com/watch?v=KfL_V_YaHj8" }
        )

        embed.setImage(responseData.Poster);

        if (user) {
            user.send('Hey, you asked me to add this movie to your watchlist:').then(msg => msg.delete({ timeout: 10000 }));
            embed.setFooter('Hit the ✅ below to remove this movie from your watchlist')
            user.send(embed).catch(console.error);
            return;
        }

        embed.setFooter('Hit the 📋 below to add this movie to your watchlist');

        reply(interaction, embed);
    })
}

client.on('messageReactionAdd', async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }

    // Now the message has been cached and is fully available
    if (reaction.message.author.id == '713014610344804422' && !user.bot) {
        if (reaction._emoji.name === '📋') {
            const movieTitle = reaction.message.embeds[0].title;
            console.log('Add to watchlist: ', movieTitle, ' for: ', user.username);
            sendMovieRequest(undefined, movieTitle, user);
        }
        else if (reaction._emoji.name === '✅' && reaction.message.channel.type === 'dm') {
            console.log('Removing from dms for: ', user.username);
            reaction.message.delete();
        }
    }
});

client.on('message', message => {
    try {
        if (message.author.id == '713014610344804422' && Object.values(message.embeds[0]?.fields[0]).includes("Year")) {
            if (message.channel.type !== 'dm') {
                message.react('📋');
            } else {
                message.react('✅');
            }
        };
    }
    catch (error) {
        console.log("Not a movie embed, skipping");
    }
});

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

const newPitchforkAlbum = () => {
    const myGuild = client.guilds.cache.get(guildId);
    const memoryChannel = myGuild.channels.cache.get('845043427761717258');
    console.log("TEST Memory channel: ", memoryChannel);

    memoryChannel.messages.fetch({ limit: 1 }).then(messages => {
        const lastMessage = messages.first();
        console.log("TEST Last message: ", lastMessage);
        var lastMessageObject;

        if (lastMessage) {
            lastMessageObject = JSON.parse(lastMessage);
        }

        p4k.getBestNewAlbums().then((albums) => {
            if (albums[0].title !== lastMessageObject.title) {
                var trackInfoObject = {};
                ['artist', 'title', 'genres', 'score', 'abstract'].forEach(prop => trackInfoObject[prop] = albums[0][prop]);
                console.log("TEST track info: ", trackInfoObject);
                memoryChannel.send(JSON.stringify(trackInfoObject));
            }
        });
    })
        .catch(console.error);
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