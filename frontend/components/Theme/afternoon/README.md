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
- **Layer 1 (Base)**: Warm orange → yellow → cool blue
  - `#FFB347` (0%) - Warm orange
  - `#FFC463` (30%) - Golden orange
  - `#FFD66B` (55%) - Golden yellow
  - `#FFE89D` (72%) - Light yellow
  - `#D8EAFE` (90%) - Cool sky blue
  - `#A7CCFF` (100%) - Light cool blue

- **Layer 2 (Night Cap)**: Twilight fade at top
  - `#2B364B` (0%) - Night carryover
  - `#262E4D` (10%) - Twilight
  - `rgba(38,46,77,0)` (14%) - Transparent

### 3. **HorizonSun.tsx**
Renders a sun positioned at the horizon (80% down the screen) with:
- **Sun Disc**: Radial gradient from `#FFF8E6` (center) to `#FFE39E` (edge)
- **Tight Glow**: `rgba(255,228,160,0.45)` fading outward
- **Wide Horizon Bloom**: Elliptical bloom `rgba(255,210,120,0.18)` spanning 62% of screen width
- **Subtle pulse animation**: 3.5 second cycle for realism

### 4. **AfternoonClouds.tsx**
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
| Night Cap Dark | `#2B364B` | Top edge (twilight) |
| Night Cap Light | `#262E4D` | Twilight transition |
| Warm Orange | `#FFB347` | Upper warm body |
| Golden Orange | `#FFC463` | Mid-upper warm body |
| Golden Yellow | `#FFD66B` | Mid warm body |
| Light Yellow | `#FFE89D` | Mid-lower warm body |
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

