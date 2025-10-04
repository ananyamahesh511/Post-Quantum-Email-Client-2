const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const HANDLERS_PATH = path.join(__dirname, 'socket-handlers');

const eventHandlers = new Map();

/**
 * Dynamically loads and registers all socket event handlers from a directory.
 * @param {string} directoryPath The path to the handlers directory.
 */
function registerHandlers(directoryPath) {
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = path.join(directoryPath, file.name);
        if (file.isDirectory()) {
            // Recurse into subdirectories
            registerHandlers(fullPath);
        } else if (file.name.endsWith('.js')) {
            // Convert file path to event name (e.g., /user/join.js -> user:join)
            const eventName = path.relative(HANDLERS_PATH, fullPath)
                .replace(/\\/g, ':') // Replace backslashes for Windows
                .replace(/\//g, ':') // Replace forward slashes for Linux/Mac
                .replace(/\.js$/, ''); // Remove the .js extension

            try {
                const handler = require(fullPath);
                if (typeof handler === 'function') {
                    eventHandlers.set(eventName, handler);
                    console.log(`Loaded handler for event: '${eventName}'`);
                }
            } catch (error) {
                console.error(`Failed to load handler for ${eventName}:`, error);
            }
        }
    });
}

// Load all handlers on server start
registerHandlers(HANDLERS_PATH);

// --- Main Connection Logic ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // The magic: a single listener that routes to the correct handler
    socket.onAny(async (eventName, ...args) => {
        const handler = eventHandlers.get(eventName);
        const payload = args[0];

        if (handler) {
            try {
                await handler(io, socket, payload);
            } catch (error) {
                console.error(`Error executing handler for '${eventName}':`, error);
                // Optionally, emit an error back to the client
                socket.emit('server_error', { event: eventName, message: 'An internal error occurred.' });
            }
        } else {
            console.warn(`⚠️ No handler found for event: '${eventName}'`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

app.use(express.static('public'));
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
