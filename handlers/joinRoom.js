const ChatRoom = require('../models/Chatroom').ChatRoom;
const User = require('../models/User');

module.exports = async (io, socket, data) => {
    try{
      const {roomId, userId} = data; 

      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);

      if (userId) {
        socket.data.userId = userId;
        await User.findOneAndUpdate({userId}, {online: true});
        io.emit("userStatusChanged", { userId, online: true });
      }

      //finding the chatroom and returning messages
      const chatRoom = await ChatRoom.findOne({roomId}).populate("users");
      if (!chatRoom) {
        socket.emit('chatHistory', []);
        return;
      }

      //sending all messages stored in chat room
      socket.emit("chatHistory", chatRoom.messages);

      socket.on("disconnect", async() => {
        if(socket.data.userId) {
            await User.findOneAndUpdate({userId: socket.data.userId}, {online: false});
            io.emit("userStatusChanged", { userId: socket.data.userId, online: false });
            console.log(`User ${socket.data.userId} went offline`);
        }
      });
    } catch (err) {
      console.error("Error fetching chatroom messages:", err);
      socket.emit("chatHistory", []);
    }

};