// Light: Simple, wispy clouds (5-10 bubbles)
// Mild: Medium complexity clouds (10-18 bubbles)
// Heavy: Complex, detailed clouds (18-30 bubbles)

export type CloudComplexity = "light" | "mild" | "heavy";

export interface CloudBubble {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

// Light Cloud Generator Class
// Generates simple, wispy clouds with minimal detail (5-10 bubbles)
// Best used for background/far layers for atmospheric depth
export class LightCloud {
  static generate(cloudSize: number): CloudBubble[] {
    const bubbles: CloudBubble[] = [];

    // Base layer: 2-3 large bubbles
    const baseCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < baseCount; i++) {
      const xPos = (i - baseCount / 2) * (cloudSize * 0.45) + (Math.random() - 0.5) * 20;
      bubbles.push({
        x: xPos,
        y: cloudSize * 0.15 + (Math.random() - 0.5) * 12,
        rx: cloudSize * (0.38 + Math.random() * 0.16),
        ry: cloudSize * (0.26 + Math.random() * 0.12),
      });
    }

    // Mid layer: 2-3 medium bubbles
    const midCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < midCount; i++) {
      const xPos = (i - midCount / 2) * (cloudSize * 0.38) + (Math.random() - 0.5) * 25;
      bubbles.push({
        x: xPos,
        y: (Math.random() - 0.5) * cloudSize * 0.25,
        rx: cloudSize * (0.28 + Math.random() * 0.12),
        ry: cloudSize * (0.20 + Math.random() * 0.10),
      });
    }


    // Top layer: 1-2 small puffs
    const topCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < topCount; i++) {
      const xPos = (Math.random() - 0.5) * cloudSize * 0.55;
      bubbles.push({
        x: xPos,
        y: -cloudSize * 0.18 + (Math.random() - 0.5) * 15,
        rx: cloudSize * (0.22 + Math.random() * 0.10),
        ry: cloudSize * (0.16 + Math.random() * 0.08),
      });
    }

    return bubbles;
  }
}


// Mild Cloud Generator Class
// Generates medium complexity clouds with balanced detail (10-18 bubbles)
// Ideal for mid-layer clouds, provides good visual weight
export class MildCloud {
  static generate(cloudSize: number): CloudBubble[] {
    const bubbles: CloudBubble[] = [];

    // Base layer: 3-4 large bubbles
    const baseCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < baseCount; i++) {
      const xPos = (i - baseCount / 2) * (cloudSize * 0.48) + (Math.random() - 0.5) * 25;
      bubbles.push({
        x: xPos,
        y: cloudSize * 0.14 + (Math.random() - 0.5) * 14,
        rx: cloudSize * (0.40 + Math.random() * 0.18),
        ry: cloudSize * (0.28 + Math.random() * 0.14),
      });
    }

    // Mid layer: 4-6 medium bubbles
    const midCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < midCount; i++) {
      const xPos = (i - midCount / 2) * (cloudSize * 0.40) + (Math.random() - 0.5) * 28;
      bubbles.push({
        x: xPos,
        y: (Math.random() - 0.5) * cloudSize * 0.30,
        rx: cloudSize * (0.30 + Math.random() * 0.14),
        ry: cloudSize * (0.22 + Math.random() * 0.11),
      });
    }

    // Top layer: 3-5 small puffs
    const topCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < topCount; i++) {
      const xPos = (Math.random() - 0.5) * cloudSize * 0.68;
      bubbles.push({
        x: xPos,
        y: -cloudSize * 0.20 + (Math.random() - 0.5) * 18,
        rx: cloudSize * (0.24 + Math.random() * 0.12),
        ry: cloudSize * (0.18 + Math.random() * 0.10),
      });
    }

    // Detail puffs: 2-4 small bubbles
    const detailCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < detailCount; i++) {
      bubbles.push({
        x: (Math.random() - 0.5) * cloudSize * 0.85,
        y: (Math.random() - 0.5) * cloudSize * 0.32,
        rx: cloudSize * (0.16 + Math.random() * 0.10),
        ry: cloudSize * (0.12 + Math.random() * 0.08),
      });
    }

    return bubbles;
  }
}


// Heavy Cloud Generator Class
// Generates complex, highly detailed clouds with multiple layers (18-30 bubbles)
// Perfect for foreground/near layers, creates dramatic depth
export class HeavyCloud {
  static generate(cloudSize: number): CloudBubble[] {
    const bubbles: CloudBubble[] = [];

    // Base layer: 4-6 large bubbles
    const baseCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < baseCount; i++) {
      const xPos = (i - baseCount / 2) * (cloudSize * 0.50) + (Math.random() - 0.5) * 28;
      bubbles.push({
        x: xPos,
        y: cloudSize * 0.16 + (Math.random() - 0.5) * 16,
        rx: cloudSize * (0.42 + Math.random() * 0.20),
        ry: cloudSize * (0.30 + Math.random() * 0.16),
      });
    }

    // Mid layer: 6-10 medium bubbles
    const midCount = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < midCount; i++) {
      const xPos = (i - midCount / 2) * (cloudSize * 0.42) + (Math.random() - 0.5) * 32;
      bubbles.push({
        x: xPos,
        y: (Math.random() - 0.5) * cloudSize * 0.35,
        rx: cloudSize * (0.32 + Math.random() * 0.16),
        ry: cloudSize * (0.24 + Math.random() * 0.13),
      });
    }

    // Top layer: 5-8 small puffs
    const topCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < topCount; i++) {
      const xPos = (Math.random() - 0.5) * cloudSize * 0.75;
      bubbles.push({
        x: xPos,
        y: -cloudSize * 0.22 + (Math.random() - 0.5) * 22,
        rx: cloudSize * (0.26 + Math.random() * 0.14),
        ry: cloudSize * (0.20 + Math.random() * 0.12),
      });
    }

    // Detail puffs: 4-8 small bubbles for extra complexity
    const detailCount = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < detailCount; i++) {
      bubbles.push({
        x: (Math.random() - 0.5) * cloudSize * 0.92,
        y: (Math.random() - 0.5) * cloudSize * 0.38,
        rx: cloudSize * (0.18 + Math.random() * 0.12),
        ry: cloudSize * (0.14 + Math.random() * 0.10),
      });
    }

    // Extra fine details: 2-4 tiny bubbles
    const extraCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extraCount; i++) {
      bubbles.push({
        x: (Math.random() - 0.5) * cloudSize * 0.70,
        y: (Math.random() - 0.5) * cloudSize * 0.25,
        rx: cloudSize * (0.12 + Math.random() * 0.08),
        ry: cloudSize * (0.10 + Math.random() * 0.06),
      });
    }

    return bubbles;
  }
}

// Cloud Type Factory Class
// Generates appropriate cloud type based on complexity using Factory Pattern
// Encapsulates cloud creation logic for better maintainability
export class CloudTypeFactory {
  static createCloud(complexity: CloudComplexity, size: number): CloudBubble[] {
    switch (complexity) {
      case "light":
        return LightCloud.generate(size);
      case "mild":
        return MildCloud.generate(size);
      case "heavy":
        return HeavyCloud.generate(size);
      default:
        return MildCloud.generate(size);
    }
  }

  static getRandomComplexity(): CloudComplexity {
    const rand = Math.random();
    // 30% light, 45% mild, 25% heavy
    if (rand < 0.30) return "light";
    if (rand < 0.75) return "mild";
    return "heavy";
  }
}

