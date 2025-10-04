const fs = require('fs');
const Message = require('../models/Chatroom').Message;


module.exports = (io, socket, data) => {
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
};