var XMLHttpRequest = require('xhr2');

const Discord = require('discord.js');
const client = new Discord.Client();

const guildId = '713782418057855057';

const getApp = (guildId) => {
    const app = client.api.applications(client.user.id);

    if (guildId) {
        app.guilds(guildId)
    }

    return app;
}

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

    console.log('first test')

    await getApp(guildId).commands.post({
        data: {
            name: 'pong',
            description: 'Displays an embed',
            options: [
                {
                    name: 'Name',
                    description: 'Your name',
                    required: true,
                    type: 3, // string
                },
                {
                    name: 'Age',
                    description: 'Your age',
                    required: false,
                    type: 4, // integer
                },
            ],
        },
    })

    console.log('second test')

    client.ws.on('INTERACTION_CREATE', async (interaction) => {
        const { name, options } = interaction.data;

        const command = name.toLowerCase();

        console.log(options);

        if (command === 'ping') {
            reply(interaction, 'pong');
        }
    })
})

const reply = (interaction, response) => {
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 4,
            data: {
                content: response
            }
        }
    })
}

client.login(process.env.token);