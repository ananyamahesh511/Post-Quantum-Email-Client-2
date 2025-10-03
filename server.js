const express = require("express");
const { createServer } = require("http");
const { join, basename } = require("path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const fs = require("fs");
const { type } = require("os");

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const UPLOAD_DIR = join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.static(join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/chatApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => console.log("Mongoose connected"));
mongoose.connection.on("error", (err) => console.error("Mongoose error:", err));

// MESSAGE schema
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  sender: { type: String, default: "Anonymous" },
  text: { type: String, default: "" },
  file: {
    fileName: String,
    filePath: String,
    mimeType: String,
  },
  timeStamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

//USER schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: "Anonymus",
  },
  email: {
    type: String,
    required: true,
  },
  chatRooms: {
    type: [String],
    default: [],
  },
});
const User = mongoose.model("User", userSchema);

//Express endpoints - CREATE new user
app.post("/users", async (req,res) => {
  try{
    const { userId, name, email } = req.body;
    if (!userName || !name || !email) {
      return res.status(400).json({error: "Username and emai required"});
    }

    const existingUser = await User.findOne({ $or: [{userId}, {email} ]});
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = new User({ userId, name, email });
    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error("Error creating user:", err);
  }
});

//GET new user
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
  }
});

// Temporary storage for incoming file chunks
const incomingFiles = Object.create(null);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join room
  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Send last 50 messages for that room
    try {
      const history = await Message.find({ roomId }).sort({ timeStamp: 1 }).limit(50);
      socket.emit("chatHistory", history);
    } catch (err) {
      console.error(err);
    }
  });

  // Text message
  socket.on("chatMessage", async ({ text, sender, roomId }) => {
    try {
      const msg = new Message({ roomId, sender: sender || "Anonymous", text });
      await msg.save();
      io.to(roomId).emit("chatMessage", msg);
    } catch (err) {
      console.error("Error saving text message:", err);
    }
  });

  // File chunks
  socket.on("fileChunk", async (data) => {
    try {
      const { fileId, chunk, fileName, mimeType, text, sender, isLastChunk, roomId } = data;
      if (!fileId) return;

      if (!incomingFiles[fileId]) incomingFiles[fileId] = [];
      incomingFiles[fileId].push(Buffer.from(chunk));

      if (isLastChunk) {
        const fileBuffer = Buffer.concat(incomingFiles[fileId]);
        const uniqueName = `${Date.now()}-${basename(fileName)}`;
        const savePath = join(UPLOAD_DIR, uniqueName);

        fs.writeFileSync(savePath, fileBuffer);
        console.log(`Saved uploaded file -> ${savePath} (${fileBuffer.length} bytes)`);

        const fileObj = { fileName, filePath: `/uploads/${uniqueName}`, mimeType };
        const msg = new Message({ roomId, sender: sender || "Anonymous", text: text || "", file: fileObj });
        await msg.save();

        io.to(roomId).emit("chatFile", msg);
        delete incomingFiles[fileId];
      }
    } catch (err) {
      console.error("Error handling file-chunk:", err);
      if (data && data.fileId) delete incomingFiles[data.fileId];
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running at http://localhost:3000"));
