/**
 * Cloud Animation Controller (Single Responsibility Principle)
 * 
 * Handles all animation and spawning logic for clouds
 * Separates concerns: animation behavior vs. cloud rendering
 */

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

/**
 * Cloud Spawner (Strategy Pattern)
 * Handles random cloud placement across the screen
 */
export class CloudSpawner {
  /**
   * Generate random spawn position (0-1 range across full screen width)
   * Uses timestamp to ensure unique randomization per mount
   */
  static getRandomSpawnPosition(): number {
    return (Math.random() + Date.now() % 1000) % 1;
  }

  /**
   * Generate clouds with random positions across screen
   * Uses Poisson disk sampling to avoid clustering
   * Ensures unique randomization per component mount
   */
  static generateClouds(count: number, depth: string): CloudConfig[] {
    const clouds: CloudConfig[] = [];
    const minDistance = depth === "far" ? 200 : depth === "mid" ? 220 : 240;
    const maxAttempts = 150;
    
    // Add timestamp-based seed for truly unique randomization per mount
    const mountSeed = Date.now();

    // Vertical distribution based on depth
    const yRange =
      depth === "far"
        ? { min: 0.0, max: 0.6 }
        : depth === "mid"
        ? { min: 0.1, max: 0.75 }
        : { min: 0.2, max: 0.85 };

    for (let cloudIndex = 0; cloudIndex < count; cloudIndex++) {
      let attempts = 0;
      let placed = false;

      while (!placed && attempts < maxAttempts) {
        // Random vertical position only (horizontal controlled by animation)
        const y = (yRange.min + Math.random() * (yRange.max - yRange.min)) * height;

        // Check minimum vertical distance from existing clouds
        const tooClose = clouds.some((existing) => {
          const dy = Math.abs(y - existing.y);
          return dy < (minDistance * 0.5); // Reduced distance check for vertical only
        });

        if (!tooClose) {
          // Create cloud with random properties
          // Use mount seed to ensure unique randomization per tab
          const seededRandom = (Math.random() + (mountSeed / 1000000) + cloudIndex) % 1;
          const complexity = CloudTypeFactory.getRandomComplexity();
          const baseSize = depth === "far" ? 55 : depth === "mid" ? 70 : 85;
          const size = baseSize + Math.random() * 35;
          
          // Direction: TRUE 50/50 split - alternating pattern ensures balance
          const direction = (cloudIndex % 2 === 0) ? 1 : -1;
          
          // CRITICAL FIX: Proper initialPosition mapping for on-screen spawning
          // Translation ranges: L→R [-0.3w, 1.3w] | R←L [1.3w, -0.3w]
          // To spawn in visible screen (0 to 1.0w):
          //   - Need initialPosition where translateX maps to 0-1.0w range
          //   - L→R: 0w needs init=0.1875, 0.5w needs init=0.5
          //   - R←L: 0.5w needs init=0.5, 1.0w needs init=0.1875
          // Both use same range [0.1875, 0.5] but interpret differently due to outputRange
          
          const minPos = 0.1875; // Maps to screen edge (0w for L→R, 1.0w for R←L)
          const maxPos = 0.5;    // Maps to screen center (0.5w for both)
          const randomInRange = minPos + Math.random() * (maxPos - minPos);
          
          // Add variation: some clouds spawn closer to edges, others to center
          const initialPosition = randomInRange;

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
            initialPosition, // 0.2-0.8 ensures clouds spawn ON SCREEN
          });
          placed = true;
        }
        attempts++;
      }
    }

    return clouds;
  }
}

/**
 * Cloud Animation Controller
 * Manages movement patterns and animation timing
 */
export class CloudAnimationController {
  /**
   * Get random direction with balanced distribution
   * 50% left-to-right, 50% right-to-left
   */
  static getRandomDirection(): number {
    return Math.random() < 0.5 ? 1 : -1;
  }

  /**
   * Calculate translation values based on direction
   * Maps 0-1 animation value to actual screen X coordinates
   */
  static getTranslationRange(direction: number): [number, number] {
    // Reduced buffer: -30%w to 130%w (was -60%w to 160%w)
    const startOffset = -width * 0.3;
    const endOffset = width * 1.3;
    
    if (direction === 1) {
      // Left to right: -30%w → 130%w
      return [startOffset, endOffset];
    } else {
      // Right to left: 130%w → -30%w
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

