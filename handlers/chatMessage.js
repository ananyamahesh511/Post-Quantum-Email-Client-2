const ChatRoom = require('../models/Chatroom').ChatRoom;
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 10 });

module.exports = async (io, socket, data) => {
    try{
      const {sender, text, roomId, ttl=-1} = data;
      if(!roomId) return;

      const chatRoom = await ChatRoom.findOne({roomId});
      if (!chatRoom) return;

      const newMessage = {
      messageId: uid.randomUUID(),
      sender,
      text,
      timeStamp: new Date(),
      seen: false,
      ttl,
      };

      chatRoom.messages.push(newMessage);
      await chatRoom.save();

      io.to(roomId).emit("chatMessage", newMessage);

      if( ttl != -1 && ttl > 0) {
        setTimeout( async () => {
            try{
                const room = chatRoom.findOne({roomId: roomId});
                if(!room) return;

                room.messages = room.messages.filter(msg => messageId !== newMessage.messageId);
                await room.save();
                io.to(roomId).emit("deleteMessage", newMessage.messageId);
            } catch (err) {
                console.log("Error detected in ttl: ", err);
            }
        }, ttl * 100);
      }
    } catch (err) {
    console.error("Error saving chat message:", err);
    }

};