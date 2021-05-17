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

    client.ws.on('INTERACTION_CREATE', async (interaction) => {
        const command = interaction.data.name.toLowerCase();

        if (command === 'ping') {
            client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 4,
                    data: {
                        content: 'pong'
                    }
                }
            })
        }
    })
})

client.login(process.env.token);