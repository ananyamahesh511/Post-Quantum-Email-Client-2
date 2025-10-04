const mongoose = require("mongoose");


const MessageSchema = new mongoose.Schema({
    messageId: {type: String, required: true},
    roomId: { type: String, required: true },
    sender: { type: String, default: "Anonymous" },
    text: { type: String, default: "", required: true },
    file: {
        fileName: String,
        filePath: String,
        mimeType: String,
    },
    timeStamp: { type: Date, default: Date.now() },
    seen: {type:Boolean, default: false},
    ttl: Number,
});

const ChatroomSchema = new mongoose.Schema({
    messages: [messageSchema],
    users: [String]
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = {
    Message: MessageSchema,
    ChatRoom: ChatRoom
}