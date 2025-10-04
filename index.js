const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const adminRoutes = fs
	.readdirSync('./routes/admin')
	.filter((file) => file.endsWith('.js'));

const clientRoutes = fs
	.readdirSync('./routes/client')
	.filter((file) => file.endsWith('.js'));

const PORT = 3000;
const HANDLERS_PATH = path.join(__dirname, 'handlers');

const eventHandlers = new Map();

async function connect() {
	console.log(
		'------------------ HACKATHON - Websocket Server ------------------------------------------------',
	);
	mongoose.connect("mongodb://127.0.0.1:27017/chatApp", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Established connection with Database'))
    .catch((error) => console.error(error));

	await handleRoutes();

	server.listen(process.env.PORT, () => {
		console.log(
			`API running on: http://localhost:${process.env.PORT}/`,
		);
	});
}

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

const routePaths = {
	adminRoutes: 'admin',
	clientRoutes: 'client',
};

const routeRegistry = new Map();

async function loadEndpoint(routePath, fileName) {
	const endpointPath = path.join(__dirname, 'routes', routePath, fileName);
	return require(endpointPath);
}

async function registerRoute(App, basePath, methods) {
	const [fileName] = basePath.split('/').slice(-1);
	const endpoint = await loadEndpoint(
		basePath.split('/').slice(1, -1).join('/'),
		`${fileName}.js`,
	);

	methods.forEach((method) => {
		if (endpoint[method]) {
			App[method](basePath, async (req, res) => {
				try {
					await endpoint[method](req, res);
				} catch (error) {
					console.error(`Error handling route: ${error}`);
					res.sendStatus(500);
				}
			});
			routeRegistry.set(
				`${basePath}_${method.toLowerCase()}`,
				endpoint[method],
			);
		}
	});
}

async function handleRequest(req, res) {
	const { method, originalUrl } = req;
	const handler = routeRegistry.get(`${originalUrl}_${method.toLowerCase()}`);

	if (handler) {
		try {
			await handler(req, res);
		} catch (error) {
			console.error(`Error handling route: ${error}`);
			res.sendStatus(500);
		}
	} else {
		console.log(
			`Request sent from IP: ${req.ip} for invalid method  ${method}: ${originalUrl}`,
		);
		res.sendStatus(404);
	}
}

async function handleRoutes() {
	const methods = ['get', 'post', 'put', 'delete'];
	const routeDirs = [adminRoutes, clientRoutes];

	for (const dir of routeDirs) {
		const routePath =
			routePaths[dir === adminRoutes ? 'adminRoutes' : 'clientRoutes'];
		const fileNames = await fsProm.readdir(
			path.join(__dirname, 'routes', routePath),
		);

		for (const fileName of fileNames) {
			if (fileName.endsWith('.js')) {
				const basePath = `/${routePath}/${path.basename(fileName, '.js')}`;
				await registerRoute(app, basePath, methods);
			}
		}
	}
	app.use(handleRequest);
	console.log('Registered all Routes');
}

app.use(express.static('public'));

connect();