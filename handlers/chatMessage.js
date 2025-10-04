

module.exports = (io, socket, data) => {
    try {
        const msg = new Message({ roomId, sender: sender || "Anonymous", text });
        await msg.save();
        io.to(roomId).emit("chatMessage", msg);
    } catch (err) {
        console.error("Error saving text message:", err);
    }
};