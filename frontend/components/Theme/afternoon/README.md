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
Creates a beautiful purple-to-orange sunset gradient:
- **Layer 1 (Main Gradient)**: Purple twilight → orange sunset → cool blue
  - `#2B364B` (0%) - Night top
  - `#262E4D` (6%) - Twilight start
  - `#343A63` (12%) - Indigo
  - `#4B3F78` (22%) - Violet
  - `#65498E` (32%) - Purple
  - `#7D4F93` (42%) - Dusty purple → magenta
  - `#A45E8A` (52%) - Rose-mauve (bridges warm/cool)
  - `#C96E74` (60%) - Rose-gold
  - `#E67E62` (68%) - Warm orange
  - `#FFB659` (78%) - Golden
  - `#FFE089` (86%) - Pale yellow
  - `#D8EAFE` (94%) - Cool footer blend
  - `#A7CCFF` (100%) - Cool footer

- **Layer 2 (Subtle Top Enhancement)**: Optional dark overlay
  - `#0F1419` (0%) - Very dark night
  - `rgba(15,20,25,0)` (15%) - Transparent

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
Generates dramatic heavy near clouds only:
- **Cloud count**: 4 heavy near clouds (dramatic effect)
- **Cloud types**: 100% heavy (large, defined clouds)
- **Positioning**: Middle to upper-middle area (10%-60% of screen)
- **Movement**: Graceful back-and-forth animation with easing
- **Opacity**: 50% (more visible than far/mid clouds)
- **Size**: Large near-cloud size (54px base) with 7 elliptical bubbles

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
| Night Top | `#2B364B` | Very top edge |
| Twilight Start | `#262E4D` | Early twilight |
| Indigo | `#343A63` | Deep twilight |
| Violet | `#4B3F78` | Purple twilight |
| Purple | `#65498E` | Rich purple |
| Dusty Purple | `#7D4F93` | Purple-magenta transition |
| Rose-Mauve | `#A45E8A` | Warm/cool bridge |
| Rose-Gold | `#C96E74` | Rose-gold transition |
| Warm Orange | `#E67E62` | Orange start |
| Golden | `#FFB659` | Rich golden |
| Pale Yellow | `#FFE089` | Light yellow |
| Cool Footer Blend | `#D8EAFE` | Cool transition |
| Cool Footer | `#A7CCFF` | Bottom edge |
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

