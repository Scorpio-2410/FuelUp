## For Dev

This guide helps new contributors get the app running quickly on web and devices.

### Requirements (Windows/macOS)
- Install the latest Node.js (includes npm)
- Install Git
- Install Expo Go on your phone (Android/iOS) - for mobile testing

#### macOS (Terminal)
```bash
# Install Homebrew if needed: https://brew.sh
brew install node git
```

Optional: Android Studio for emulator, Xcode for iOS simulator (macOS only).

---

## 📱 Frontend (React Native + Expo)

Reference docs:
- NativeWind Installation (Expo): [nativewind.dev/docs/getting-started/installation](https://www.
nativewind.dev/docs/getting-started/installation)

### Quick Start
```bash
cd frontend
npm install
npx expo start (can also do this for hard reset run: npx expo start --clear)
```

### Running Options
- **Mobile**: Scan QR code with Expo Go app
- **Web**: Press `w` in terminal or `npm run web`
- **Android Emulator**: Press `a` in terminal
- **iOS Simulator**: Press `i` in terminal (macOS only)

### Troubleshooting
- If phone can't connect: use `npx expo start --tunnel`
- If QR fails: paste the `exp://...` URL into Expo Go manually

### Tech Stack
- **Framework**: Expo Router (file-based routing)
- **Styling**: NativeWind v4 + Tailwind CSS v3
- **Language**: TypeScript
- **Platform**: React Native (iOS/Android/Web)

### Useful Commands
```bash
# From frontend/ folder
npm run start            # same as `expo start`
npm run android          # start Android directly
npm run web              # start web directly

# Clear Metro cache if issues
npx expo start --clear

# TypeScript check
tsc --noEmit
```

### Dependencies
- Keep Tailwind on v3 for NativeWind v4 compatibility
- Use `npx expo install` when adding Expo packages

---

## 🚀 Backend (Node.js + Express)

### Quick Start
```bash
cd backend
npm install
npm run dev    # Auto-reload on changes
```

### What It Does
- Runs on `http://localhost:4000`
- Node.js server using Express framework
- CORS enabled for frontend connections

### Commands
```bash
npm run dev    # Development with auto-reload (nodemon)
npm start      # Production mode
```


```


## 📁 Project Structure
```
FuelUp/
├── frontend/     # Expo React Native app
│   ├── app/      # File-based routing
│   └── components/
└── backend/      # Node.js API server
    └── server.js
```

Reference: [NativeWind docs](https://www.nativewind.dev/docs/getting-started/installation)

If anything becomes outdated, please update this file in your PR.