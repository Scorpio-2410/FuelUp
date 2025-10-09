// Cloud Animation Controller
// Handles all animation and spawning logic for clouds following Single Responsibility Principle
// Separates animation behavior from cloud rendering for better maintainability

import { Dimensions } from "react-native";
import { CloudComplexity, CloudBubble, CloudTypeFactory } from "./CloudTypes";

const { width, height } = Dimensions.get("window");

export interface CloudConfig {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  windSway: number;
  bubbles: CloudBubble[];
  direction: number; // 1 = left-to-right, -1 = right-to-left
  complexity: CloudComplexity;
  initialPosition: number; // 0-1, for random spawn across screen
}

// Cloud Spawner Class
// Handles random cloud placement across the screen with no artificial spacing
// Allows natural overlapping for realistic cloud formations
export class CloudSpawner {
  // Generate random spawn position (0-1 range across full screen width)
  static getRandomSpawnPosition(): number {
    return (Math.random() + Date.now() % 1000) % 1;
  }

  // Generate clouds with Poisson disk sampling for natural distribution
  static generateClouds(count: number, depth: string): CloudConfig[] {
    const clouds: CloudConfig[] = [];
    const mountSeed = Date.now();
    
    // Minimum distance between clouds (allows natural overlap but prevents excessive stacking)
    const minDistance = depth === "far" ? 40 : depth === "mid" ? 50 : 60;
    const maxAttempts = 50; // Try up to 50 times to place each cloud
    
    for (let cloudIndex = 0; cloudIndex < count; cloudIndex++) {
      let attempts = 0;
      let validPosition = false;
      let x = 0, y = 0;
      
      // Keep trying to find a valid position
      while (attempts < maxAttempts && !validPosition) {
        // Generate random position with margins
        x = 60 + Math.random() * (width - 120);
        y = 60 + Math.random() * (height - 120);
        
        // Check if this position is far enough from existing clouds
        validPosition = true;
        for (const existingCloud of clouds) {
          const distance = Math.sqrt(
            Math.pow(x - existingCloud.x, 2) + Math.pow(y - existingCloud.y, 2)
          );
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
        
        attempts++;
      }
      
      // If we couldn't find a valid position, use the last attempted position
      // This ensures we always generate the requested number of clouds
      
      // Create cloud with random properties
      const complexity = CloudTypeFactory.getRandomComplexity();
      const baseSize = depth === "far" ? 55 : depth === "mid" ? 70 : 85;
      const size = baseSize + Math.random() * 35;
      
      // Random direction - true 50/50 split for natural movement
      const direction = Math.random() < 0.5 ? 1 : -1;

      clouds.push({
        id: `cloud-${depth}-${mountSeed}-${cloudIndex}`,
        x,
        y,
        size,
        speed: 0.8 + Math.random() * 0.6,
        opacity: (depth === "far" ? 0.50 : depth === "mid" ? 0.66 : 0.78) + Math.random() * 0.10,
        windSway: 3 + Math.random() * 7,
        bubbles: CloudTypeFactory.createCloud(complexity, size),
        direction,
        complexity,
        initialPosition: 0,
      });
    }

    return clouds;
  }
}

// Manages movement patterns and animation timing for cloud drift
// Provides reusable animation calculations following DRY principle
export class CloudAnimationController {
  // Get random direction with balanced distribution (50% left-to-right, 50% right-to-left)
  static getRandomDirection(): number {
    return Math.random() < 0.5 ? 1 : -1;
  }

  // Calculate translation range - minimal movement to prevent clipping
  static getTranslationRange(direction: number): [number, number] {
    // Reduced movement range to prevent edge clipping
    const moveDistance = width * 0.25; // Clouds move 25% of screen width (reduced from 40%)
    
    if (direction === 1) {
      // Left to right: move right
      return [0, moveDistance];
    } else {
      // Right to left: move left
      return [0, -moveDistance];
    }
  }

  // Get animation duration based on cloud properties
  static getAnimationDuration(baseSpeed: number, cloudSpeed: number): number {
    return (80000 / baseSpeed) * cloudSpeed;
  }


  // Get vertical sway duration with randomization
  static getVerticalSwayDuration(): number {
    return 6000 + Math.random() * 4000;
  }
}

