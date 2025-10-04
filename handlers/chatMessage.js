const ChatRoom = require('../models/Chatroom').ChatRoom;

module.exports = async (io, socket, data) => {
    try{
      const chatRoom = await ChatRoom.findOne({roomId});
      if (!chatRoom) return;

      const newMessage = {
      sender,
      text,
      createdAt: new Date(),
      };
      chatRoom.messages.push(newMessage);
      await chatRoom.save();
    } catch (err) {
    console.error("Error saving chat message:", err);
    }

};