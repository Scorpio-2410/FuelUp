## For Dev

This guide helps new contributors get the app running quickly on web and devices, and explains our Expo + NativeWind/Tailwind setup.

Reference docs:
- NativeWind Installation (Expo): [nativewind.dev/docs/getting-started/installation](https://www.nativewind.dev/docs/getting-started/installation)

### Requirements (Windows/macOS)
- Install the latest Node.js (includes npm)
- Install Git
- Install Expo Go on your phone (Android/iOS)

#### macOS (Terminal)
```
# Install Homebrew if needed: https://brew.sh
brew install node git
```

Optional (both OS): Android Studio for emulator. Xcode for iOS simulator (macOS only).

### Quick start
```
cd frontend
npm install
npx expo start
# If your phone is not on the same Wi‑Fi, use:
# npx expo start --tunnel
```

- Scan the QR from the terminal. If scanning fails, press Enter URL and paste the `exp://...exp.direct` link shown by Expo.
- Web: `npm run web`
- Android emulator (optional): run `npx expo start` then press `a` in the CLI

Tips:
- Use the default connection first; switch to `--tunnel` if your phone and laptop aren’t on the same network.
- If the QR doesn’t open, paste the `exp://...` URL from the CLI into Expo Go.

### Project layout
- `frontend/`: Expo Router app (React Nativewind + TypeScript)
- `backend/`: Server code (Nodejs, SQL,...)

### Styling stack
Already configured in the repo (NativeWind v4 + Tailwind v3). You do not need to set up Babel or Tailwind locally—just install and run. For reference, see the official docs if you’re curious about the configuration details.

Tips:
- CSS gradients are web-only. For native gradients, add `expo-linear-gradient` when needed.

### Useful commands
```
# From the frontend folder
npm run start            # same as `expo start`
npm run android          # start Android target directly

# Clear Metro cache if bundling behaves oddly
npx expo start --clear

# Lint/typecheck (if configured in scripts)
npm run typecheck || tsc --noEmit
```

### Dependency notes
- Keep Tailwind on v3 (e.g., `tailwindcss@3.4.17`) for NativeWind v4 compatibility.
- When upgrading Expo SDK, use `npx expo install` to align versions.

Packages used (install when needed):
- Native gradients: `expo-linear-gradient`
  - Install:
    ```
    cd frontend
    npx expo install expo-linear-gradient
    ```
  - Use to render time-of-day gradients on Android/iOS.
  
If anything in this guide becomes outdated, please update this file as part of your PR.