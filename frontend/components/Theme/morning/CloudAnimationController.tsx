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

  // Generate clouds with improved grid-based positioning for better distribution
  static generateClouds(count: number, depth: string): CloudConfig[] {
    const clouds: CloudConfig[] = [];
    const mountSeed = Date.now();
    
    // Improved grid system with better spacing
    const totalWidth = width + 400; // Include off-screen buffer
    const totalHeight = height + 200;
    
    // Calculate optimal grid dimensions based on cloud count and screen ratio
    const aspectRatio = totalWidth / totalHeight;
    const gridCols = Math.ceil(Math.sqrt(count * aspectRatio));
    const gridRows = Math.ceil(count / gridCols);
    
    const cellWidth = totalWidth / gridCols;
    const cellHeight = totalHeight / gridRows;
    
    // Create grid with minimum distance enforcement
    const minDistance = Math.min(cellWidth, cellHeight) * 0.3; // 30% of smaller cell dimension
    
    // Generate positions with distance checking
    const positions: {x: number, y: number}[] = [];
    const maxAttempts = count * 10; // Prevent infinite loops
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let validPosition = false;
      let newX = 0, newY = 0;
      
      while (!validPosition && attempts < maxAttempts) {
        // Choose random grid cell
        const col = Math.floor(Math.random() * gridCols);
        const row = Math.floor(Math.random() * gridRows);
        
        // Base position in cell center
        const baseX = col * cellWidth + cellWidth / 2 - 200;
        const baseY = row * cellHeight + cellHeight / 2 - 100;
        
        // Add smaller random offset (max 40% of cell size)
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.4;
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.4;
        
        newX = baseX + offsetX;
        newY = baseY + offsetY;
        
        // Check minimum distance from existing clouds
        validPosition = true;
        for (const pos of positions) {
          const distance = Math.sqrt((newX - pos.x) ** 2 + (newY - pos.y) ** 2);
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      }
      
      // If we couldn't find a valid position, use the last attempt anyway
      positions.push({x: newX, y: newY});
    }
    
    for (let cloudIndex = 0; cloudIndex < count; cloudIndex++) {
      const {x, y} = positions[cloudIndex];
      
      // Create cloud with random properties (20% smaller)
      const complexity = CloudTypeFactory.getRandomComplexity();
      const baseSize = depth === "far" ? 44 : depth === "mid" ? 56 : 68; // 20% reduction
      const size = baseSize + Math.random() * 28; // Also reduce random range
      
      // Random direction - true 50/50 split for natural movement
      const direction = Math.random() < 0.5 ? 1 : -1;

      // Increase speed by 10% for mild clouds (reduced from 15%)
      const baseSpeed = 0.8 + Math.random() * 0.6;
      const adjustedSpeed = complexity === "mild" ? baseSpeed * 1.10 : baseSpeed;

      clouds.push({
        id: `cloud-${depth}-${mountSeed}-${cloudIndex}`,
        x,
        y,
        size,
        speed: adjustedSpeed,
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

  // Calculate translation range - full screen movement for natural cloud drift
  static getTranslationRange(direction: number): [number, number] {
    // Full screen width movement for complete left-right crossing
    const moveDistance = width + 400; // Move across entire screen plus buffer
    
    if (direction === 1) {
      // Left to right: move from left edge to right edge
      return [-width - 200, width + 200];
    } else {
      // Right to left: move from right edge to left edge
      return [width + 200, -width - 200];
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

