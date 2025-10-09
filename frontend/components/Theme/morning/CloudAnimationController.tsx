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

  // Generate clouds with random positions - allows natural overlapping like real clouds
  static generateClouds(count: number, depth: string): CloudConfig[] {
    const clouds: CloudConfig[] = [];
    
    // Add timestamp-based seed for truly unique randomization per mount
    const mountSeed = Date.now();

    // Vertical distribution based on depth - expanded for full screen coverage
    // Clouds can now appear anywhere, just like stars
    const yRange =
      depth === "far"
        ? { min: 0.02, max: 0.85 }  // Far clouds: top to mid-screen
        : depth === "mid"
        ? { min: 0.10, max: 0.90 }  // Mid clouds: almost full screen
        : { min: 0.15, max: 0.95 }; // Near clouds: full screen coverage

    for (let cloudIndex = 0; cloudIndex < count; cloudIndex++) {
      // Pure random vertical position - no collision detection needed
      // Overlapping creates natural, realistic cloud formations
      const y = (yRange.min + Math.random() * (yRange.max - yRange.min)) * height;

      // Create cloud with random properties
      // Use mount seed to ensure unique randomization per tab
      const complexity = CloudTypeFactory.getRandomComplexity();
      const baseSize = depth === "far" ? 55 : depth === "mid" ? 70 : 85;
      const size = baseSize + Math.random() * 35;
      
      // Direction: TRUE 50/50 split - alternating pattern ensures balance
      const direction = (cloudIndex % 2 === 0) ? 1 : -1;

      // Expanded initial positions for more random spawning across screen
      // Similar to star spawning - can appear anywhere
      const initialPosition = direction === 1
        ? 0.15 + Math.random() * (0.50 - 0.15)    // L→R: [0.15, 0.50] - wider spawn zone
        : 0.50 + Math.random() * (0.85 - 0.50);   // R←L: [0.50, 0.85] - wider spawn zone

      clouds.push({
        id: `cloud-${depth}-${mountSeed}-${cloudIndex}`,
        x: 0, // Not used - horizontal position fully controlled by translateX
        y,
        size,
        speed: 0.8 + Math.random() * 0.6,
        opacity: (depth === "far" ? 0.50 : depth === "mid" ? 0.66 : 0.78) + Math.random() * 0.10,
        windSway: 3 + Math.random() * 7,
        bubbles: CloudTypeFactory.createCloud(complexity, size),
        direction,
        complexity,
        initialPosition, // Random spawn across screen for natural distribution
      });
    }

    return clouds;
  }
}

// Cloud Animation Controller Class
// Manages movement patterns and animation timing for cloud drift
// Provides reusable animation calculations following DRY principle
export class CloudAnimationController {
  // Get random direction with balanced distribution (50% left-to-right, 50% right-to-left)
  static getRandomDirection(): number {
    return Math.random() < 0.5 ? 1 : -1;
  }

  // Calculate translation range - maps 0-1 animation value to actual screen coordinates
  static getTranslationRange(direction: number): [number, number] {
    // Increased buffer to ensure full cloud rendering
    // This accounts for cloud width (up to 3x size) and ensures complete visibility
    const startOffset = -width * 0.5;
    const endOffset = width * 1.5;
    
    if (direction === 1) {
      // Left to right: -50%w → 150%w
      return [startOffset, endOffset];
    } else {
      // Right to left: 150%w → -50%w
      return [endOffset, startOffset];
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

