const { setAntichannel, getAntichannel, removeAntichannel } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const isOwnerOrSudo = require('../lib/isOwner');

async function handleAntichannelCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(12).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`ANTICHANNEL SETUP\n\n${prefix}antichannel on\n${prefix}antichannel set delete | kick | warn\n${prefix}antichannel off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                await setAntichannel(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { text: '*_Antichannel has been turned ON_*' }, { quoted: message });
                break;
            case 'off':
                await removeAntichannel(chatId);
                await sock.sendMessage(chatId, { text: '*_Antichannel has been turned OFF_*' }, { quoted: message });
                break;
            case 'set': {
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { text: '*_Invalid action. Choose delete, kick, or warn._*' }, { quoted: message });
                    return;
                }
                await setAntichannel(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { text: `*_Antichannel action set to ${setAction}_*` }, { quoted: message });
                break;
            }
            case 'get': {
                const cfg = await getAntichannel(chatId);
                await sock.sendMessage(chatId, {
                    text: `*_Antichannel Configuration:_*\nStatus: ${cfg?.enabled ? 'ON' : 'OFF'}\nAction: ${cfg?.action || 'Not set'}`
                }, { quoted: message });
                break;
            }
            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antichannel for usage._*` }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in antichannel command:', error);
        await sock.sendMessage(chatId, { text: '*_Error processing antichannel command_*' }, { quoted: message });
    }
}

async function handleChannelDetection(sock, chatId, message, senderId) {
    try {
        const config = await getAntichannel(chatId);
        if (!config?.enabled) return;
        if (message.key?.fromMe) return;
        if (await isOwnerOrSudo(senderId, sock, chatId)) return;

        const adminStatus = await isAdmin(sock, chatId, senderId);
        if (adminStatus.isSenderAdmin) return;

        const text = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            ''
        );

        const hasChannelLink = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+/i.test(text) ||
            /(?:https?:\/\/)?wa\.me\/channel\/[A-Za-z0-9]+/i.test(text);

        const contextInfo =
            message.message?.extendedTextMessage?.contextInfo ||
            message.message?.imageMessage?.contextInfo ||
            message.message?.videoMessage?.contextInfo ||
            message.message?.documentMessage?.contextInfo ||
            {};

        const hasForwardedChannel = Boolean(
            contextInfo.forwardedNewsletterMessageInfo ||
            message.message?.newsletterAdminInviteMessage ||
            message.message?.newsletterMessage
        );

        if (!hasChannelLink && !hasForwardedChannel) return;

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
                text: `Channel content allowed nahi hai. @${senderId.split('@')[0]} removed.`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: config.action === 'warn'
                ? `Warning @${senderId.split('@')[0]}, channel content allowed nahi hai.`
                : 'Channel content delete kar diya gaya.',
            mentions: [senderId]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in channel detection:', error);
    }
}

module.exports = {
    handleAntichannelCommand,
    handleChannelDetection
};
