const { setAntisticker, getAntisticker, removeAntisticker } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const isOwnerOrSudo = require('../lib/isOwner');

async function handleAntistickerCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(12).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`ANTISTICKER SETUP\n\n${prefix}antisticker on\n${prefix}antisticker set delete | kick | warn\n${prefix}antisticker off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                await setAntisticker(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { text: '*_Antisticker has been turned ON_*' }, { quoted: message });
                break;
            case 'off':
                await removeAntisticker(chatId);
                await sock.sendMessage(chatId, { text: '*_Antisticker has been turned OFF_*' }, { quoted: message });
                break;
            case 'set': {
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { text: '*_Invalid action. Choose delete, kick, or warn._*' }, { quoted: message });
                    return;
                }
                await setAntisticker(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { text: `*_Antisticker action set to ${setAction}_*` }, { quoted: message });
                break;
            }
            case 'get': {
                const cfg = await getAntisticker(chatId);
                await sock.sendMessage(chatId, {
                    text: `*_Antisticker Configuration:_*\nStatus: ${cfg?.enabled ? 'ON' : 'OFF'}\nAction: ${cfg?.action || 'Not set'}`
                }, { quoted: message });
                break;
            }
            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antisticker for usage._*` }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in antisticker command:', error);
        await sock.sendMessage(chatId, { text: '*_Error processing antisticker command_*' }, { quoted: message });
    }
}

async function handleStickerDetection(sock, chatId, message, senderId) {
    try {
        const config = await getAntisticker(chatId);
        if (!config?.enabled) return;
        if (message.key?.fromMe) return;
        if (!message.message?.stickerMessage) return;
        if (await isOwnerOrSudo(senderId, sock, chatId)) return;

        const adminStatus = await isAdmin(sock, chatId, senderId);
        if (adminStatus.isSenderAdmin) return;

        await sock.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                fromMe: false,
                id: message.key.id,
                participant: senderId
            }
        }).catch(() => {});

        if (config.action === 'kick') {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove').catch(() => {});
            await sock.sendMessage(chatId, {
                text: `Sticker allowed nahi hai. @${senderId.split('@')[0]} removed.`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: config.action === 'warn'
                ? `Warning @${senderId.split('@')[0]}, stickers allowed nahi hain.`
                : 'Sticker delete kar diya gaya.',
            mentions: [senderId]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in sticker detection:', error);
    }
}

module.exports = {
    handleAntistickerCommand,
    handleStickerDetection
};
