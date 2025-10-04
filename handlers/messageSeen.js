const ChatRoom = require("../models/Chatroom").ChatRoom;

module.exports = async (io, socket, data) => {
    const { roomId, messageIds } = data;
        try{
            const chatRoom = await ChatRoom.findOne({roomId});
            if (!chatRoom) return;

            chatRoom.messages = chatRoom.messages.map(msg => {
                if(messageIds.includes(msg.messageId)) {
                    return {...msg.toObject(), seen: true};
                }
            });
            await chatRoom.save();

            io.to(roomId).emit("messageSeenUpdate", {messageIds});
        } catch (err) {
            console.error("Error updating message seen status: ", err);
        }
}