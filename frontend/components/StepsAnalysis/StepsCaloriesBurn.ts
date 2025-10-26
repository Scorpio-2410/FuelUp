// StepsCaloriesBurn.ts - Dedicated class for calories calculation following SOLID principles
// Single Responsibility: Only handles calories calculation logic
// Open/Closed: Extensible for different user types and walking patterns
// Liskov Substitution: Can be replaced with different calculation strategies
// Interface Segregation: Focused interface for calories calculation
// Dependency Inversion: Depends on abstractions, not concrete implementations

export interface UserProfile {
  weightKg: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface WalkingMetrics {
  steps: number;
  stepLength?: number; // Optional custom step length
  walkingSpeed?: number; // Optional custom walking speed
  duration?: number; // Optional custom duration in hours
}

export interface CalorieResult {
  calories: number;
  distance: number;
  duration: number;
  met: number;
  breakdown: {
    steps: number;
    stepLength: number;
    distance: number;
    walkingSpeed: number;
    duration: number;
    met: number;
    calories: number;
  };
}

export class StepsCaloriesBurn {
  private readonly DEFAULT_STEP_LENGTH = 0.75; // meters
  private readonly DEFAULT_WALKING_SPEED = 5.0; // km/h

  /**
   * Calculate calories burned based on steps and user profile
   * Uses dynamic MET values based on user characteristics and walking patterns
   */
  public calculateCalories(
    walkingMetrics: WalkingMetrics,
    userProfile: UserProfile
  ): CalorieResult {
    // Step 1: Calculate distance
    const stepLength = walkingMetrics.stepLength || this.calculateStepLength(userProfile);
    const distance = (walkingMetrics.steps * stepLength) / 1000; // Convert to km

    // Step 2: Calculate duration
    const walkingSpeed = walkingMetrics.walkingSpeed || this.calculateWalkingSpeed(userProfile);
    const duration = walkingMetrics.duration || (distance / walkingSpeed);

    // Step 3: Calculate dynamic MET value
    const met = this.calculateMET(userProfile, distance, walkingSpeed);

    // Step 4: Calculate calories using MET formula
    const calories = met * userProfile.weightKg * duration;

    return {
      calories: Math.round(calories),
      distance: Math.round(distance * 1000) / 1000, // Round to 3 decimal places
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      met: Math.round(met * 10) / 10, // Round to 1 decimal place
      breakdown: {
        steps: walkingMetrics.steps,
        stepLength,
        distance,
        walkingSpeed,
        duration,
        met,
        calories: Math.round(calories)
      }
    };
  }

  /**
   * Calculate step length based on user profile
   * Takes into account height, gender, and fitness level
   */
  private calculateStepLength(userProfile: UserProfile): number {
    let baseStepLength = this.DEFAULT_STEP_LENGTH;

    // Adjust based on height
    if (userProfile.heightCm) {
      // Step length is approximately 0.4-0.5 of height
      const heightBasedStepLength = userProfile.heightCm * 0.45 / 100;
      baseStepLength = Math.max(0.6, Math.min(0.9, heightBasedStepLength));
    }

    // Adjust based on gender (males typically have longer strides)
    if (userProfile.gender === 'male') {
      baseStepLength *= 1.05;
    } else if (userProfile.gender === 'female') {
      baseStepLength *= 0.95;
    }

    // Adjust based on fitness level
    if (userProfile.fitnessLevel === 'advanced') {
      baseStepLength *= 1.02; // Slightly longer strides
    } else if (userProfile.fitnessLevel === 'beginner') {
      baseStepLength *= 0.98; // Slightly shorter strides
    }

    return Math.round(baseStepLength * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate walking speed based on user profile
   * Takes into account fitness level and age
   */
  private calculateWalkingSpeed(userProfile: UserProfile): number {
    let baseSpeed = this.DEFAULT_WALKING_SPEED;

    // Adjust based on fitness level
    if (userProfile.fitnessLevel === 'advanced') {
      baseSpeed *= 1.1; // 10% faster
    } else if (userProfile.fitnessLevel === 'beginner') {
      baseSpeed *= 0.9; // 10% slower
    }

    // Adjust based on age (older adults typically walk slower)
    if (userProfile.age) {
      if (userProfile.age > 65) {
        baseSpeed *= 0.9; // 10% slower for seniors
      } else if (userProfile.age < 25) {
        baseSpeed *= 1.05; // 5% faster for young adults
      }
    }

    return Math.round(baseSpeed * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate dynamic MET value based on user characteristics and walking patterns
   * This is the core innovation - MET changes based on multiple factors
   */
  private calculateMET(
    userProfile: UserProfile,
    distance: number,
    walkingSpeed: number
  ): number {
    let baseMET = 3.5; // Base MET for normal walking

    // Adjust MET based on walking speed
    if (walkingSpeed >= 6.0) {
      baseMET = 4.3; // Brisk walking
    } else if (walkingSpeed >= 5.5) {
      baseMET = 4.0; // Fast walking
    } else if (walkingSpeed >= 4.5) {
      baseMET = 3.5; // Normal walking
    } else if (walkingSpeed >= 3.5) {
      baseMET = 3.0; // Slow walking
    } else {
      baseMET = 2.8; // Very slow walking
    }

    // Adjust MET based on distance (longer walks may be more efficient)
    if (distance >= 5.0) {
      baseMET *= 0.95; // Slightly more efficient for long walks
    } else if (distance < 1.0) {
      baseMET *= 1.05; // Slightly less efficient for very short walks
    }

    // Adjust MET based on fitness level
    if (userProfile.fitnessLevel === 'advanced') {
      baseMET *= 0.95; // More efficient (lower MET)
    } else if (userProfile.fitnessLevel === 'beginner') {
      baseMET *= 1.05; // Less efficient (higher MET)
    }

    // Adjust MET based on age
    if (userProfile.age) {
      if (userProfile.age > 65) {
        baseMET *= 1.05; // Slightly higher MET for seniors
      } else if (userProfile.age < 25) {
        baseMET *= 0.98; // Slightly lower MET for young adults
      }
    }

    // Adjust MET based on weight (heavier people work harder)
    if (userProfile.weightKg > 90) {
      baseMET *= 1.02; // Slightly higher MET for heavier individuals
    } else if (userProfile.weightKg < 50) {
      baseMET *= 0.98; // Slightly lower MET for lighter individuals
    }

    return Math.round(baseMET * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get a detailed explanation of the calculation
   */
  public getCalculationExplanation(
    walkingMetrics: WalkingMetrics,
    userProfile: UserProfile
  ): string {
    const result = this.calculateCalories(walkingMetrics, userProfile);
    const { breakdown } = result;

    return `
🧮 Calories Calculation Breakdown:
📏 Distance: ${breakdown.steps.toLocaleString()} steps × ${breakdown.stepLength}m = ${breakdown.distance}km
⏱️ Duration: ${breakdown.distance}km ÷ ${breakdown.walkingSpeed}km/h = ${breakdown.duration}h (${Math.round(breakdown.duration * 60)}min)
🏃 MET Value: ${breakdown.met} (based on speed, fitness, age, weight)
🔥 Calories: ${breakdown.met} × ${userProfile.weightKg}kg × ${breakdown.duration}h = ${breakdown.calories}kcal
    `.trim();
  }
}

// Export a default instance for easy use
export const stepsCaloriesBurn = new StepsCaloriesBurn();
