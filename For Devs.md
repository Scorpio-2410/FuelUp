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

## 🚀 Backend (Node.js + Express + PostgreSQL)

### Setup Steps **Check MSteams pinned message** for the `.env` file

### Environment Setup

```bash
cd backend
npm install

# Save the .env file from teams pinned msg as backend/.env
# Then you're ready to go!
```

### Quick Start

```bash
cd backend
npm install
npm run dev    # Auto-reload on changes
```

### Database Commands

Quick database viewing on terminal without neon console, for quick info check purpose 

```bash
npm run view-users     # View all users in clean table format
npm run view-data      # View all tables (users, fitness, etc.)
npm run view-schema    # View database structure (columns, types, relationships)
```

### Troubleshooting

- **Database connection error**: Check your `DATABASE_URL` in `.env`
- **JWT error**: Ensure `JWT_SECRET` is set in `.env`
- **Port 4000 busy**: Use `PORT=4001 npm run dev` or kill the conflicting process

If anything becomes outdated, please update this file.
