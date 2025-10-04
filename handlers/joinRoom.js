const ChatRoom = require('../models/Chatroom').ChatRoom;

module.exports = async (io, socket, data) => {
    try{
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);

      //finding the chatroom and returning messages
      const chatRoom = await ChatRoom.findOne({roomId}).populate("users");
      if (!chatRoom) {
        socket.emit('chatHistory', []);
        return;
      }

      //sending all messages stored in chat room
      socket.emit("chatHistory", chatRoom.messages);
    } catch (err) {
      console.error("Error fetching chatroom messages:", err);
      socket.emit("chatHistory", []);
    }

};