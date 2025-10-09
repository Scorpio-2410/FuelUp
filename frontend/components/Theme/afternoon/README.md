# Afternoon Theme - Golden Hour

## Overview
The afternoon theme represents the golden hour period (3:00 PM - 6:00 PM), featuring warm orange and yellow tones transitioning from a twilight cap at the top to a cool blue footer at the bottom.

## Components

### 1. **AfternoonBackground.tsx**
Main orchestrator component that assembles all afternoon theme elements.
- Manages the overall layout
- Coordinates sky gradient, sun, and clouds
- Supports children content rendering

### 2. **GoldenSky.tsx**
Creates the multi-layered sky gradient using two LinearGradients:
- **Layer 1 (Base)**: Orange-red → cool blue
  - `#FF6B35` (0%) - Orange-red
  - `#FF7F4A` (30%) - Orange-red light
  - `#FF8C5A` (55%) - Orange-red lighter
  - `#FF9B6B` (72%) - Orange-red lightest
  - `#D8EAFE` (90%) - Cool sky blue
  - `#A7CCFF` (100%) - Light cool blue

- **Layer 2 (Extended Night Cap)**: Extended twilight fade at top
  - `#1A1F2E` (0%) - Darker night carryover
  - `#2B364B` (15%) - Night carryover
  - `#262E4D` (25%) - Twilight
  - `rgba(38,46,77,0)` (30%) - Transparent

### 3. **AfternoonStarField.tsx**
Shows stars only in the top 40% of the screen for twilight atmosphere:
- **Star count**: Light: 40, Medium: 60, Strong: 80
- **Size**: 0.8-2.6px (smaller than night theme)
- **Opacity**: 0.2-0.6 (dimmer for twilight)
- **Animation**: Gentle twinkling with 2-5 second cycles
- **Position**: Only in top 40% of screen height

### 4. **HorizonSun.tsx**
Renders a sun positioned at the horizon (80% down the screen, moved up 40px) with:
- **Sun Disc**: Radial gradient from `#FFF8E6` (center) to `#FFE39E` (edge)
- **Tight Glow**: `rgba(255,228,160,0.45)` fading outward
- **Wide Horizon Bloom**: Elliptical bloom `rgba(255,210,120,0.18)` spanning 62% of screen width
- **Subtle pulse animation**: 3.5 second cycle for realism

### 5. **AfternoonClouds.tsx**
Generates fewer clouds than morning theme (40% reduction):
- **Cloud counts**: Far: 4, Mid: 5, Near: 3
- **Cloud types**: 60% mild (thin cirrus), 40% heavy (defined)
- **Opacity**: Far: 0.25, Mid: 0.35, Near: 0.45 (softer than morning)
- **Movement**: Slow horizontal drift with back-and-forth animation
- **Distribution**: Random positioning in top 60% of screen

## Time-Based Activation
- **Active period**: 4:00 PM (16:00) - 6:30 PM (18:30)
- Automatically switches in `DynamicTheme.tsx`
- Can be manually tested in theme tab

## Design Philosophy
- **Warm and inviting**: Golden hour colors evoke warmth and transition
- **Readable UI**: Cool footer tones ensure text remains legible
- **Atmospheric depth**: Layered gradients create visual richness
- **Performance**: Fewer clouds than morning for better performance
- **Realistic**: Sun at horizon with elliptical bloom mimics real golden hour

## Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Dark Night Cap | `#1A1F2E` | Top edge (darker twilight) |
| Night Cap Dark | `#2B364B` | Night carryover |
| Night Cap Light | `#262E4D` | Twilight transition |
| Orange-Red | `#FF6B35` | Upper warm body |
| Orange-Red Light | `#FF7F4A` | Mid-upper warm body |
| Orange-Red Lighter | `#FF8C5A` | Mid warm body |
| Orange-Red Lightest | `#FF9B6B` | Mid-lower warm body |
| Cool Sky Blue | `#D8EAFE` | Lower transition |
| Light Cool Blue | `#A7CCFF` | Bottom edge |
| Sun Center | `#FFF8E6` | Sun disc center |
| Sun Edge | `#FFE39E` | Sun disc edge |

## SOLID Principles Applied
- **Single Responsibility**: Each component has one clear purpose
- **Open/Closed**: Intensity prop allows extension without modification
- **Liskov Substitution**: All background themes are interchangeable
- **Interface Segregation**: Components expose only necessary props
- **Dependency Inversion**: Components depend on abstractions (props/interfaces)

## Future Enhancements
- Dynamic sun position based on actual time
- Seasonal color adjustments
- Particle effects (dust motes in sunbeams)
- Bird silhouettes flying across

