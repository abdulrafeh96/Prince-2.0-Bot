const settings = require("../settings");

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (secs || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
}

async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `*${settings.botName || 'Prince 2.0'} is Active!*\n\n` +
                       `*Version:* ${settings.version}\n` +
                       `*Status:* Online\n` +
                       `*Uptime:* ${formatUptime(process.uptime())}\n` +
                       `*Mode:* ${settings.commandMode || 'public'}\n\n` +
                       `*Features:*\n` +
                       `• Group Security\n` +
                       `• Files / Handouts\n` +
                       `• Downloads\n` +
                       `• AI Tools\n\n` +
                       `Type *.menu* for full command list`;

        await sock.sendMessage(chatId, {
            text: message1
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: `${settings.botName || 'Prince 2.0'} is alive and running!` }, { quoted: message });
    }
}

module.exports = aliveCommand;
