const Message = require('../models/Chatroom').Message;

module.exports = async (io, socket, data) => {
    const { roomId } = data;
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    try {
        const history = await Message.find({ roomId }).sort({ timeStamp: 1 }).limit(50);
        socket.emit("chatHistory", history);
    } catch (err) {
        console.error(err);
    }
};