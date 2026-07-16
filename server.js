const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const Message = require('./models/Message');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

app.get('/', (req, res) => res.json({ message: 'Social Network API is running' }));

app.use(notFound);
app.use(errorHandler);

// Socket.io realtime chat - every user joins a private room named after their own id
io.on('connection', (socket) => {
  socket.on('join-user', (userId) => {
    if (userId) socket.join(String(userId));
  });

  socket.on('send-message', async ({ sender, receiver, text }) => {
    if (!sender || !receiver || !String(text || '').trim()) {
      socket.emit('chat-error', { message: 'sender, receiver and text are required' });
      return;
    }
    try {
      const message = await Message.create({ sender, receiver, text: String(text).trim().slice(0, 2000) });
      const populated = await message.populate('sender receiver', 'username');
      io.to(String(receiver)).to(String(sender)).emit('receive-message', populated);
    } catch (error) {
      socket.emit('chat-error', { message: error.message });
    }
  });
});

// Never let an uncaught error kill the whole server during a live demo
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

const PORT = Number(process.env.PORT) || 3000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((error) => { console.error(error.message); process.exit(1); });
