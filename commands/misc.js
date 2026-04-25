const noop = async function (sock, chatId) {
    if (sock && chatId) {
        await sock.sendMessage(chatId, { text: 'This command is not available in this build yet.' }).catch(() => {});
    }
};

module.exports = {
    miscCommand: noop,
    handleHeart: noop
};
