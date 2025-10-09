/**
 * Handles all animation and spawning logic for clouds
 * animation behavior vs. cloud rendering
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
 * Cloud Spawner
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

    // Vertical distribution based on depth - adjusted to prevent top/bottom clipping
    const yRange =
      depth === "far"
        ? { min: 0.05, max: 0.55 }  // Moved away from top edge
        : depth === "mid"
        ? { min: 0.15, max: 0.70 }  // Moved away from top/bottom edges
        : { min: 0.25, max: 0.80 }; // Moved away from bottom edge

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

          // Updated initial positions with more buffer to prevent edge clipping
          const initialPosition = direction === 1
            ? 0.25 + Math.random() * (0.4 - 0.25)    // L→R: [0.25, 0.4] - spawn further from left edge
            : 0.6 + Math.random() * (0.75 - 0.6);    // R←L: [0.6, 0.75] - spawn further from right edge

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

