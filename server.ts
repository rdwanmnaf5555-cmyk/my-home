import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json());

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API to send OTP via Email
  app.post('/api/send-otp', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    if (!resend) {
      console.warn('RESEND_API_KEY is not set. OTP email was not sent (Simulation only).');
      return res.json({ status: 'simulated', message: 'API Key missing, simulation only' });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'My Home <onboarding@resend.dev>',
        to: [email],
        subject: 'My Home Verification Code',
        html: `
          <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">Welcome to My Home</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for registering with My Home Smart System. To activate your account, please use the following code:
            </p>
            <div style="background: #fdfdfd; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px dashed #f59e0b;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 15px; color: #000; font-family: monospace;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #666;">
              هذا الرمز صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              مي هوم - مساعدك الذكي المتكامل
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend Error:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ status: 'success', data });
    } catch (err: any) {
      console.error('Internal Server Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Initial State
  let homeState = {
    rooms: {
      'living-room': {
        id: 'living-room',
        name: 'غرفة المعيشة',
        lights: [
          { id: 1, name: 'الإضاءة الرئيسية', isOn: false },
          { id: 2, name: 'إضاءة خافتة', isOn: false },
          { id: 3, name: 'مصباح القراءة', isOn: false },
          { id: 4, name: 'إضاءة جدارية', isOn: false },
        ],
        currentAmperes: 0.5,
        lastUpdate: new Date().toISOString()
      },
      'kitchen': {
        id: 'kitchen',
        name: 'المطبخ',
        lights: [
          { id: 1, name: 'إضاءة السقف', isOn: false },
          { id: 2, name: 'إضاءة الخزائن', isOn: false },
          { id: 3, name: 'إضاءة الكاونتر', isOn: false },
          { id: 4, name: 'إضاءة المخزن', isOn: false },
        ],
        currentAmperes: 1.2,
        lastUpdate: new Date().toISOString()
      },
      'bedroom': {
        id: 'bedroom',
        name: 'غرفة النوم',
        lights: [
          { id: 1, name: 'الإضاءة الرئيسية', isOn: false },
          { id: 2, name: 'مصباح السرير يسار', isOn: false },
          { id: 3, name: 'مصباح السرير يمين', isOn: false },
          { id: 4, name: 'إضاءة الخزانة', isOn: false },
        ],
        currentAmperes: 0.3,
        lastUpdate: new Date().toISOString()
      },
      'office': {
        id: 'office',
        name: 'المكتب',
        lights: [
          { id: 1, name: 'الإضاءة الرئيسية', isOn: false },
          { id: 2, name: 'مصباح المكتب', isOn: false },
          { id: 3, name: 'إضاءة الرفوف', isOn: false },
          { id: 4, name: 'مصباح أرضي', isOn: false },
        ],
        currentAmperes: 0.8,
        lastUpdate: new Date().toISOString()
      }
    },
    alertThreshold: 5.0
  };

  // API for ESP32 to update data
  app.post('/api/esp32/update', (req, res) => {
    const { roomId, currentAmperes, lights } = req.body;
    
    if (homeState.rooms[roomId]) {
      homeState.rooms[roomId].currentAmperes = currentAmperes;
      if (lights) {
        homeState.rooms[roomId].lights = lights;
      }
      homeState.rooms[roomId].lastUpdate = new Date().toISOString();
      
      // Broadcast to all clients
      io.emit('stateUpdate', homeState);
      res.json({ status: 'success' });
    } else {
      res.status(404).json({ status: 'error', message: 'Room not found' });
    }
  });

  // API for Frontend to control lights
  app.post('/api/control', (req, res) => {
    const { roomId, lightId, action } = req.body;
    
    if (homeState.rooms[roomId]) {
      const light = homeState.rooms[roomId].lights.find(l => l.id === lightId);
      if (light) {
        if (action === 'ON') light.isOn = true;
        else if (action === 'OFF') light.isOn = false;
        else if (action === 'TOGGLE') light.isOn = !light.isOn;
        
        homeState.rooms[roomId].lastUpdate = new Date().toISOString();
        
        // Broadcast to all clients
        io.emit('stateUpdate', homeState);
        
        // In a real scenario, we would also notify the ESP32
        // For example, by sending a message over a persistent socket or 
        // having the ESP32 poll a command queue.
        io.emit('esp32Command', { roomId, lightId, isOn: light.isOn });
        
        res.json({ status: 'success', newState: light.isOn });
      } else {
        res.status(404).json({ status: 'error', message: 'Light not found' });
      }
    } else {
      res.status(404).json({ status: 'error', message: 'Room not found' });
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('stateUpdate', homeState);
    
    socket.on('requestState', () => {
      socket.emit('stateUpdate', homeState);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Mock ESP32 Simulator (for demo purposes)
  setInterval(() => {
    Object.keys(homeState.rooms).forEach(roomId => {
      // Randomly fluctuate amperes slightly
      const room = homeState.rooms[roomId];
      const fluctuation = (Math.random() - 0.5) * 0.1;
      room.currentAmperes = Math.max(0, room.currentAmperes + fluctuation);
      
      // Occasionally spike for testing alerts
      if (Math.random() > 0.98) {
        room.currentAmperes += 4.0;
      }
    });
    io.emit('stateUpdate', homeState);
  }, 5000);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
