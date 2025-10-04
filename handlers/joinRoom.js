

module.exports = (io, socket, data) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    try {
        const history = await Message.find({ roomId }).sort({ timeStamp: 1 }).limit(50);
        socket.emit("chatHistory", history);
    } catch (err) {
        console.error(err);
    }
};