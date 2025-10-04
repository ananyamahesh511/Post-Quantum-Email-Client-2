# WebSocket Communication API Documentation

This repository provides a real-time chat application with WebSocket events and REST API endpoints for managing users, chatrooms, and permissions.

## Table of Contents
- [WebSocket Events](#websocket-events)
- [REST API Endpoints](#rest-api-endpoints)
- [Data Models](#data-models)

---

## WebSocket Events

The application uses Socket.IO for real-time communication. Connect to the WebSocket server and emit/listen to the following events:

### 1. `joinRoom`
Join a chat room and receive chat history.

**Emit:**
```javascript
socket.emit('joinRoom', {
  roomId: 'string',    // Required: Chat room ID
  userId: 'string'     // Optional: User ID to track online status
});
```

**Listen:**
- `chatHistory` - Receives all messages from the room
```javascript
socket.on('chatHistory', (messages) => {
  // messages: Array of message objects
});
```

- `userStatusChanged` - Broadcasts when user goes online/offline
```javascript
socket.on('userStatusChanged', (data) => {
  // data: { userId: 'string', online: boolean }
});
```

**Description:**
- Joins the specified room
- Sets user online status if userId provided
- Returns chat history from the room
- Automatically handles user disconnect to update online status

---

### 2. `chatMessage`
Send a text message to a chat room.

**Emit:**
```javascript
socket.emit('chatMessage', {
  sender: 'string',      // Required: Sender identifier
  text: 'string',        // Required: Message text
  roomId: 'string',      // Required: Target room ID
  ttl: number            // Optional: Time-to-live in seconds (default: -1 for permanent)
});
```

**Listen:**
- `chatMessage` - Receives new messages in the room
```javascript
socket.on('chatMessage', (message) => {
  // message: {
  //   messageId: 'string',
  //   sender: 'string',
  //   text: 'string',
  //   timeStamp: Date,
  //   seen: boolean,
  //   ttl: number
  // }
});
```

- `deleteMessage` - Notifies when a message is auto-deleted (if TTL was set)
```javascript
socket.on('deleteMessage', (messageId) => {
  // messageId: 'string'
});
```

**Description:**
- Saves the message to the database
- Broadcasts the message to all clients in the room
- Optionally auto-deletes message after TTL expires (in seconds)

---

### 3. `fileChunk`
Upload files to a chat room in chunks.

**Emit:**
```javascript
socket.emit('fileChunk', {
  fileId: 'string',        // Required: Unique file identifier
  chunk: ArrayBuffer,      // Required: File chunk data
  fileName: 'string',      // Required: Original file name
  mimeType: 'string',      // Required: File MIME type
  text: 'string',          // Optional: Message text accompanying the file
  sender: 'string',        // Optional: Sender identifier (default: "Anonymous")
  isLastChunk: boolean,    // Required: True if this is the last chunk
  roomId: 'string'         // Required: Target room ID
});
```

**Listen:**
- `chatFile` - Receives notification when file upload is complete
```javascript
socket.on('chatFile', (message) => {
  // message: {
  //   roomId: 'string',
  //   sender: 'string',
  //   text: 'string',
  //   file: {
  //     fileName: 'string',
  //     filePath: 'string',
  //     mimeType: 'string'
  //   }
  // }
});
```

**Description:**
- Allows chunked file uploads for large files
- Reassembles chunks on the server
- Saves file to `/uploads` directory
- Broadcasts file message to all clients in the room

---

### 4. `messageSeen`
Mark messages as seen/read.

**Emit:**
```javascript
socket.emit('messageSeen', {
  roomId: 'string',           // Required: Room ID
  messageIds: ['string']      // Required: Array of message IDs to mark as seen
});
```

**Listen:**
- `messageSeenUpdate` - Receives confirmation of seen status update
```javascript
socket.on('messageSeenUpdate', (data) => {
  // data: { messageIds: ['string'] }
});
```

**Description:**
- Marks all messages in the room as seen
- Broadcasts the update to all clients in the room

---

### 5. `disconnect`
Automatically handled by Socket.IO when a client disconnects.

**Listen:**
```javascript
socket.on('disconnect', () => {
  // Handle disconnect
});
```

**Description:**
- Logs the disconnection
- Automatically triggered by the `joinRoom` handler to update user offline status

---

### Error Handling

If an error occurs during event handling, the server may emit:

```javascript
socket.on('server_error', (error) => {
  // error: { event: 'string', message: 'string' }
});
```

---

## REST API Endpoints

All REST endpoints are prefixed with `/client/`.

### Users

#### `GET /client/users`
Retrieve all users.

**Request:**
```http
GET /client/users
```

**Response:**
```json
[
  {
    "userId": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "chatRooms": ["string"],
    "online": false,
    "isExports": true,
    "isScreenshots": true
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

#### `POST /client/users`
Create a new user.

**Request:**
```http
POST /client/users
Content-Type: application/json

{
  "userId": "string",
  "name": "string",
  "email": "string"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "userId": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "chatRooms": [],
    "online": false,
    "isExports": true,
    "isScreenshots": true
  }
}
```

**Status Codes:**
- `201 Created` - User created successfully
- `400 Bad Request` - Missing required fields or user already exists
- `500 Internal Server Error` - Server error

---

### Chatrooms

#### `POST /client/chatrooms`
Create or retrieve a chatroom between two users.

**Request:**
```http
POST /client/chatrooms
Content-Type: application/json

{
  "person1": {
    "email": "string",
    "name": "string",
    "phone": "string"
  },
  "person2": {
    "email": "string",
    "name": "string",
    "phone": "string"
  }
}
```

**Response:**
```json
{
  "roomId": "string",
  "users": ["userId1", "userId2"]
}
```

**Status Codes:**
- `200 OK` - Chatroom created or retrieved
- `500 Internal Server Error` - Server error

**Description:**
- Creates users if they don't exist
- Finds existing chatroom between the two users or creates a new one
- Returns the room ID and user IDs

---

### Permissions

#### `GET /client/permissions`
Get user permissions for exports and screenshots.

**Request:**
```http
GET /client/permissions?userId=string
```

**Query Parameters:**
- `userId` (required) - User ID to fetch permissions for

**Response:**
```json
{
  "isExports": true,
  "isScreenshots": true
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing userId or user not found
- `500 Internal Server Error` - Server error

---

#### `POST /client/permissions`
Toggle user permission (exports or screenshots).

**Request:**
```http
POST /client/permissions
Content-Type: application/json

{
  "field": "isExports"  // or "isScreenshots"
}
```

**URL Parameters:**
- `userId` - User ID (from route params)

**Response:**
```json
{
  "isExports": false,
  "isScreenshots": true
}
```

**Status Codes:**
- `200 OK` - Permission toggled successfully
- `400 Bad Request` - Invalid field name
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

**Description:**
- Toggles the specified permission field
- Returns updated permission values

---

## Data Models

### User
```javascript
{
  userId: String,          // Unique user identifier
  name: String,            // User's display name (default: "Anonymous")
  email: String,           // User's email address (required)
  phone: String,           // User's phone number (required)
  chatRooms: [String],     // Array of chatroom IDs the user is part of
  online: Boolean,         // Online status (default: false)
  isExports: Boolean,      // Permission to export data (default: true)
  isScreenshots: Boolean   // Permission to take screenshots (default: true)
}
```

### ChatRoom
```javascript
{
  roomId: String,          // Unique room identifier
  users: [String],         // Array of user IDs in the room
  messages: [Message]      // Array of message objects
}
```

### Message
```javascript
{
  messageId: String,       // Unique message identifier (10 characters)
  sender: String,          // Sender identifier
  text: String,            // Message text content
  timeStamp: Date,         // When the message was sent
  seen: Boolean,           // Whether the message has been read
  ttl: Number,             // Time-to-live in seconds (-1 for permanent)
  file: {                  // Optional file attachment
    fileName: String,      // Original file name
    filePath: String,      // Server path to the file
    mimeType: String       // File MIME type
  }
}
```

---

## Getting Started

### Installation
```bash
npm install
```

### Running the Server
```bash
npm start
```

The server runs on port 3000 by default.

### Connecting via WebSocket (Client)
```javascript
const socket = io('http://localhost:3000');

// Join a room
socket.emit('joinRoom', { roomId: 'room123', userId: 'user456' });

// Listen for chat history
socket.on('chatHistory', (messages) => {
  console.log('Chat history:', messages);
});

// Send a message
socket.emit('chatMessage', {
  sender: 'John Doe',
  text: 'Hello, World!',
  roomId: 'room123'
});
```

### Making REST API Calls
```javascript
// Fetch all users
fetch('http://localhost:3000/client/users')
  .then(response => response.json())
  .then(users => console.log(users));

// Create a chatroom
fetch('http://localhost:3000/client/chatrooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    person1: { email: 'alice@example.com', name: 'Alice' },
    person2: { email: 'bob@example.com', name: 'Bob' }
  })
})
  .then(response => response.json())
  .then(data => console.log('Room ID:', data.roomId));
```

---

## Notes

- All WebSocket events use the event name as defined in the handlers directory
- File uploads are stored in the `/uploads` directory
- Messages with TTL will auto-delete after the specified time (in seconds)
- The server uses MongoDB for data persistence
- All REST endpoints return JSON responses

---

## License

ISC
