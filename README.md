### SOFTWARE INNOVATION STUDIO
# FuelUp

FuelUp is a personal fitness and nutrition companion that fits your life — blending culturally-aware meal planning with adaptive workouts, smart scheduling, and built‑in motivation to help you fuel your day and your goals.

---

## Overview
FuelUp adapts to your schedule, culture, and goals to deliver a holistic plan that stays practical and motivating. Whether you want just nutrition support or a full fitness stack with workouts, FuelUp personalises the journey and grows with you.

## Set up Guide for Devs (Delete this later when deploy)

Assumes you already cloned the repo.

### Requirements
- Node 18+ and npm 9+ (check with `node -v` and `npm -v`)
- Expo Go on your phone (Android/iOS)

### Quick start
```
cd frontend
npm install
npx expo start --lan (use this if your laptop and phones are on the same Wifi, if not then 
                    npx expo start --tunnel  )
```

- Open Expo Go → Scan QR from the terminal. If it fails, tap Enter URL and paste the `exp://...exp.direct` link.
- For web: `npm run web`
- Android emulator (optional): run `npx expo start` then press `a` in the CLI

**Note:** Use `--lan` instead of `--tunnel` if you're on the same Wi-Fi for faster reloads.

## Core Features

### User Profile & Personalisation
- Weekly schedule input to plan workouts and meals around availability.
- Culture and food preferences to mix familiar dishes with new cuisine suggestions.
- Fitness goal inputs (goals, height, weight, age) to personalise diet and workouts.
- Targeted onboarding questions to understand needs and preferences.
- Simple navigation and a personal profile with authentication and customisation.

### Fitness & Meal Prep
- Meal logging using universal measures (e.g., tablespoons) for simplicity.
- Calorie and nutrition breakdowns for diet monitoring.
- Food recommendations tailored to what is available to you.
- Guided recipes for meal prep and plan adherence.
- Option to use only food features (nutrition-only mode).
- Recommended workout plans based on goals and prompt questions.
- Exercise instructions with video and text.
- Customisable workout plans to include preferred exercises.
- Adaptive plans that evolve with your progress and new activities.
- Activity recommendations for days you cannot access the gym.

### Motivation & Engagement
- Games and challenges with friends for accountability and fun.
- Motivational prompts or quotes each time you open the app.
- Reminders that can sync with your phone’s calendar.
- Social page to share progress and interact.

### Tracking Progress
- Track diet and fitness over time with visual and/or text summaries.
- Compare progress to stay motivated.

