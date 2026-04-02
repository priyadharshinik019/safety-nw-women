# 🛡️ SafeNet — Smart Safety Network

Full-stack emergency safety app for women. One-tap SOS triggers **phone calls**, **SMS**, **push notifications**, and **live GPS tracking** to trusted contacts — simultaneously.

---

## 📁 Project Structure

```
safenet-full/
├── backend/         Node.js + Express + MongoDB + Socket.io
└── frontend/        React web app (deployable as PWA)
```

---

## ⚡ What Happens When SOS is Triggered

| Step | Action | Timing |
|------|--------|--------|
| 1 | User taps SOS or says "Help me" | Instant |
| 2 | GPS coordinates captured | <1s |
| 3 | SMS sent to **Priya (Mom)** with live map link | ~2s |
| 4 | SMS sent to **Rani (Sister)** | ~2s |
| 5 | 📞 **Phone call to Priya** — voice reads emergency message | ~5s |
| 6 | 📞 **Phone call to Rani** (5 second stagger) | ~10s |
| 7 | Push to nearby volunteers within 500m | ~3s |
| 8 | Live GPS streams to all watchers via Socket.io | Continuous |
| 9 | Auto-escalate to police if unresolved (configurable) | 2 min |

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
npm start
```

---

## 🔑 Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong random secret |
| `TWILIO_ACCOUNT_SID` | From [twilio.com/console](https://twilio.com/console) |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_PHONE_NUMBER` | Your Twilio number (e.g. +1234567890) |
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase private key (in quotes) |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email |
| `SERVER_URL` | Public URL of your backend (for Twilio webhooks) |
| `VOLUNTEER_SEARCH_RADIUS` | Metres to search for volunteers (default: 500) |
| `POLICE_ESCALATION_DELAY` | Seconds before police notified (default: 120) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET  | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/fcm-token` | Update push token |
| PATCH | `/api/auth/settings` | Update SOS settings |
| PATCH | `/api/auth/change-password` | Change password |

### SOS Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sos/trigger` | 🚨 Trigger SOS alert |
| PATCH | `/api/sos/:id/resolve` | Mark user as safe |
| PATCH | `/api/sos/:id/cancel` | Cancel countdown |
| GET  | `/api/sos/active` | Get active SOS |
| GET  | `/api/sos/history` | Paginated alert history |
| GET  | `/api/sos/:id` | Full SOS details |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Add contact |
| PATCH | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| PATCH | `/api/contacts/reorder` | Reorder by priority |

### Volunteers
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/volunteers/register` | Opt-in as volunteer |
| DELETE | `/api/volunteers/unregister` | Opt-out |
| POST | `/api/volunteers/respond/:sosId` | Accept volunteer call |
| GET  | `/api/volunteers/nearby?lng=&lat=` | Find nearby volunteers |

### Voice (Twilio webhooks)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voice/twiml` | TwiML spoken when contact answers |
| POST | `/api/voice/status` | Call outcome webhook |
| POST | `/api/voice/test-call` | Test a call (dev only) |

### Location
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/location/update` | Update GPS coordinates |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `location:update` | Client → Server | Stream live GPS during SOS |
| `location:updated` | Server → Watchers | Broadcast new position |
| `sos:watch` | Client → Server | Subscribe to SOS updates |
| `sos:active` | Server → Contacts | SOS has been triggered |
| `sos:resolved` | Server → Contacts | User is safe |
| `volunteer:location` | Client → Server | Volunteer updates position |
| `volunteer:responding` | Server → Watchers | Volunteer is on the way |

---

## 📞 Voice Call Details

The call uses **Amazon Polly** voices via Twilio:
- `Polly.Aditi` — Indian English (default)
- `alice` — US English
- `Polly.Amy` — British English

Change in `backend/src/routes/voice.routes.js`.

The spoken message repeats **3 times** so the contact never misses it.

---

## 🗄️ MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | Accounts, GPS position, settings, volunteer status |
| `contacts` | Trusted emergency contacts per user |
| `sos` | Alert records with location trail, notification log |

---

## 🚀 Production Deployment

1. Deploy backend to **Railway** / **Render** / **AWS EC2**
2. Set `SERVER_URL` to your public backend URL (Twilio needs this for webhooks)
3. Deploy frontend to **Vercel** / **Netlify**
4. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` in frontend env
5. Enable Twilio geo permissions for India (+91) in Twilio console
6. Point your domain to frontend, add CORS origin to backend `.env`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Socket.io client, Axios |
| Backend | Node.js, Express, Socket.io, Winston |
| Database | MongoDB + Mongoose (2dsphere geospatial index) |
| SMS | Twilio Messaging API |
| Voice Calls | Twilio Voice API + TwiML |
| Push | Firebase Admin SDK (FCM) |
| Maps | Google Maps API |
| Auth | JWT + bcrypt |
| Real-time | Socket.io WebSocket |
