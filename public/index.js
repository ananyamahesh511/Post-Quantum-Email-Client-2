
const socket = io();
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const fileText = document.getElementById("fileText");

// generating id for chatroom
const uid = new ShortUniqueId({ length: 6 });
let currentRoom = uid.rnd();
console.log("room joined: ",currentRoom);
socket.emit("joinRoom", currentRoom);

// Append message to DOM
function appendMessage(msg) {
    const li = document.createElement("li");
    li.textContent = `${msg.sender || "Anonymous"}: ${msg.text || ""}`;

    if (msg.file) {
        if (msg.file.mimeType.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = msg.file.filePath;
            li.appendChild(img);
        } else {
            const a = document.createElement("a");
            a.href = msg.file.filePath;
            a.target = "_blank";
            a.textContent = msg.file.fileName;
            li.appendChild(a);
        }
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = new Date(msg.timeStamp).toLocaleTimeString();
    li.appendChild(meta);

    messages.appendChild(li);
    window.scrollTo(0, document.body.scrollHeight);
}

// Send text message
form.addEventListener("submit", e => {
    e.preventDefault();
    const txt = input.value.trim();
    if (!txt) return;
    socket.emit("chatMessage", { text: txt, sender: "Anonymous", roomId: currentRoom });
    input.value = "";
});

// Upload file in chunks
uploadForm.addEventListener("submit", async e => {
    e.preventDefault();
    const file = fileInput.files[0];
    const text = fileText.value.trim();
    if (!file) return;

    const chunkSize = 64 * 1024; // 64KB
    const fileId = Date.now() + "-" + file.name;

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const ab = await chunk.arrayBuffer();
        const isLast = offset + chunkSize >= file.size;

        socket.emit("fileChunk", {
            fileId,
            chunk: ab,
            fileName: file.name,
            mimeType: file.type,
            text,
            sender: "Anonymous",
            isLastChunk: isLast,
            roomId: currentRoom
        });
    }

    fileInput.value = "";
    fileText.value = "";
})

// Listen for messages
socket.on("chatMessage", appendMessage);
socket.on("chatFile", appendMessage);
socket.on("chatHistory", history => history.forEach(appendMessage));

socket.on("connect", () => console.log("Connected:", socket.id));
socket.on("connect_error", err => console.error("Socket error:", err));
