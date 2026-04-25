const settings = require('../settings');
const fs = require('fs');
const path = require('path');

function readJsonSafe(filePath, fallback) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) {
        return fallback;
    }
}

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

async function helpCommand(sock, chatId, message) {
    const modeData = readJsonSafe('./data/messageCount.json', { isPublic: true });
    const groupData = readJsonSafe('./data/userGroupData.json', {});
    const isGroup = chatId.endsWith('@g.us');
    const groupId = isGroup ? chatId : null;
    const uptime = formatUptime(process.uptime());
    const statusText = sock?.user?.id ? 'Online' : 'Starting';
    const enabledFeatures = [];

    if (groupId && groupData.antilink?.[groupId]?.enabled) enabledFeatures.push('Antilink');
    if (groupId && groupData.antitag?.[groupId]?.enabled) enabledFeatures.push('Antitag');
    if (groupId && groupData.antisticker?.[groupId]?.enabled) enabledFeatures.push('Antisticker');
    if (groupId && groupData.antichannel?.[groupId]?.enabled) enabledFeatures.push('Antichannel');
    if (groupId && groupData.antibadword?.[groupId]?.enabled) enabledFeatures.push('Antibadword');
    if (groupId && groupData.welcome?.[groupId]?.enabled) enabledFeatures.push('Welcome');
    if (groupId && groupData.goodbye?.[groupId]?.enabled) enabledFeatures.push('Goodbye');
    if (groupId && groupData.chatbot?.[groupId]?.enabled) enabledFeatures.push('Chatbot');

    const helpMessage = `
╔════════════════════════════╗
   ${settings.botName || 'Prince 2.0'}
   Control Menu
   Version: ${settings.version || '3.0.0'}
╚════════════════════════════╝

[ SYSTEM ]
• Name: ${settings.botName || 'Prince 2.0'}
• Status: ${statusText}
• Uptime: ${uptime}
• Mode: ${modeData.isPublic ? 'Public' : 'Private'}
• Owner: ${settings.botOwner || 'Owner'}

[ FEATURES ]
• Group Security
• Files / Handouts
• Downloads
• AI Tools
• Admin Controls
• Auto Settings
${enabledFeatures.length ? `• Enabled Here: ${enabledFeatures.join(', ')}` : '• Enabled Here: None'}

[ GENERAL ]
• .help
• .ping
• .alive
• .owner
• .quote
• .news
• .attp <text>
• .groupinfo
• .url
• .ss <link>
• .translate <text>

[ GROUP / ADMIN ]
• .ban @user
• .unban @user
• .promote @user
• .demote @user
• .mute <minutes>
• .unmute
• .kick @user
• .warn @user
• .warnings @user
• .delete
• .clear
• .tag <text>
• .tagall
• .tagnotadmin
• .hidetag <text>
• .antilink
• .antitag <on/off>
• .antisticker <on/off>
• .antichannel <on/off>
• .antibadword
• .welcome <on/off>
• .goodbye <on/off>
• .resetlink
• .setgdesc <text>
• .setgname <text>
• .setgpp

[ OWNER ]
• .mode <public/private>
• .autostatus <on/off>
• .autotyping <on/off>
• .autoread <on/off>
• .anticall <on/off>
• .pmblocker <on/off/status>
• .pmblocker setmsg <text>
• .antidelete
• .cleartmp
• .clearsession
• .setpp
• .settings
• .sudo
• .update

[ MEDIA / DOWNLOAD ]
• .play <query>
• .song <query>
• .tiktok <link>
• .video <query or link>
• .take <packname>
• .emojimix <emoji1>+<emoji2>
• .viewonce

[ AI / UTILITY ]
• .ai <prompt>
• .anime
• .character
• .chatbot
• .compliment @user
• .ping
• .alive
• .pair

[ FILES / HANDOUTS ]
• Example: cs201 mid files
• Example: mgt211 handouts
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage
            }, { quoted: message });
            return;
        }
    } catch (error) {
        console.error('Help image error:', error);
    }

    await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
}

module.exports = helpCommand;

