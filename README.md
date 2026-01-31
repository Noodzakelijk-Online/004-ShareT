# ShareT - Interactive Trello Card Sharing Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/PouchDB-Local%20Database-orange?style=flat-square" alt="PouchDB">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

**🎉 No Database Installation Required!** ShareT uses PouchDB for platform-agnostic data storage that works on Windows, Mac, and Linux without any database setup.

## ✨ Features

- **🔗 Share Trello Cards** - Generate shareable links for any Trello card
- **🔐 Permission Control** - Set view/edit/download/upload permissions per link
- **📧 Email Restrictions** - Limit access to specific email addresses
- **⏰ Expiration Settings** - Auto-expire links after specified days
- **💾 No Database Required** - Data stored locally using PouchDB
- **🌐 Works Offline** - Access your data without internet
- **☁️ Cloud Sync** - Optional sync to CouchDB for backup
- **💰 Pay-as-you-go** - Transparent resource usage tracking

## 🚀 Quick Start

### Windows (Recommended)

```cmd
# 1. Clone the repository
git clone https://github.com/Noodzakelijk-Online/004-ShareT.git
cd 004-ShareT

# 2. Run the installer
install.bat

# 3. Start ShareT
start-sharet.bat

# 4. Open in browser
# http://localhost:5000
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/Noodzakelijk-Online/004-ShareT.git
cd 004-ShareT

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install backend dependencies
cd backend
npm install

# Start server
npm start
```

Then open http://localhost:5000

## 📋 Configuration

Edit `backend/.env` to configure:

```env
# Server
PORT=5000
NODE_ENV=production

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-key-change-this
SESSION_SECRET=another-secret-key-change-this

# Trello API (Get from https://trello.com/app-key)
TRELLO_API_KEY=your-trello-api-key
TRELLO_API_SECRET=your-trello-api-secret
TRELLO_CALLBACK_URL=http://localhost:5000/api/trello/callback

# PouchDB (No changes needed for local use)
DATA_DIR=./data

# Optional: Cloud Sync with CouchDB
# COUCHDB_URL=https://your-couchdb-server.com
```

## 🗄️ Database: PouchDB

ShareT uses **PouchDB** instead of traditional databases like MongoDB:

| Feature | Benefit |
|---------|---------|
| **No Installation** | Just run `npm install` and start |
| **Local Storage** | Data saved in `./data` folder |
| **Works Everywhere** | Windows, Mac, Linux, Browser |
| **Offline First** | Works without internet |
| **Cloud Sync** | Optional CouchDB sync |
| **Open Source** | Apache 2.0 license |

### Data Location
```
004-ShareT/
└── backend/
    └── data/           ← Your data is stored here
        ├── users/
        ├── shares/
        ├── billing/
        └── ...
```

## 🌐 Public Access (Cloudflare Tunnel)

To make ShareT accessible from the internet:

```bash
# Quick temporary URL
cloudflared tunnel --url http://localhost:5000

# Permanent URL
cloudflared tunnel create sharet
cloudflared tunnel route dns sharet your-domain.com
cloudflared tunnel run sharet
```

## 📁 Project Structure

```
004-ShareT/
├── backend/                 # Node.js API server
│   ├── server.js           # Main entry point (PouchDB)
│   ├── db/pouchdb.js       # Database layer
│   ├── controllers/        # API controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   └── data/               # Local database storage
├── src/                    # React frontend source
├── scripts/                # Setup scripts (PowerShell)
├── install.bat             # Windows installer
├── start-sharet.bat        # Windows launcher
└── README.md               # This file
```

## 🔧 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Trello
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trello/auth` | Start OAuth flow |
| GET | `/api/trello/callback` | OAuth callback |
| GET | `/api/trello/boards` | Get user's boards |
| GET | `/api/trello/cards/:boardId` | Get cards in board |

### Shares
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shares` | Create share link |
| GET | `/api/shares` | Get user's shares |
| GET | `/api/shares/:id` | Get share details |
| DELETE | `/api/shares/:id` | Delete share |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing` | Get billing overview |
| GET | `/api/billing/usage` | Get resource usage |
| GET | `/api/billing/pricing` | Get pricing info |

## 📊 Resource Pricing

ShareT uses a transparent pay-as-you-go model:

| Resource | Unit | Base Price | Multiplier | Cost |
|----------|------|------------|------------|------|
| CPU | cpu-seconds | $0.00001 | 2x | $0.00002/sec |
| RAM | mb-seconds | $0.000001 | 2x | $0.000002/mb-sec |
| Bandwidth | mb | $0.0001 | 2x | $0.0002/mb |
| Storage | gb-hours | $0.00005 | 2x | $0.0001/gb-hr |

**Formula**: `cost = usage × base_price × 2`

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ bcrypt password hashing
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Rate limiting (configurable)
- ✅ Email verification for shared links
- ✅ Access logging

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Development Mode
```bash
# Frontend (hot reload)
npm run dev

# Backend (auto restart)
cd backend
npm run dev
```

### Building for Production
```bash
# Build frontend
npm run build

# Copy to backend
cp -r dist backend/frontend/

# Start production server
cd backend
NODE_ENV=production npm start
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Trello OAuth not working**
1. Verify API keys in `backend/.env`
2. Add `http://localhost:5000` to Trello's allowed origins
3. Check callback URL matches your setup

**Frontend not loading**
1. Ensure frontend is built: `npm run build`
2. Copy dist to backend: `cp -r dist backend/frontend/`
3. Restart server

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/Noodzakelijk-Online/004-ShareT/issues)
- **Documentation**: See `/docs` folder

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Noodzakelijk-Online">Noodzakelijk Online</a>
</p>
