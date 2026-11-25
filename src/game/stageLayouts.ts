export interface StagePlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  isUpperFloor?: boolean;
  tier?: 'low' | 'mid' | 'high' | 'shrine';
}

export interface StageFloorSegment {
  x1: number;
  x2: number;
  y: number;
}

export interface StageLayoutSpot {
  x: number;
  y: number;
}

export interface StageLayout {
  templateId: string;
  worldW: number;
  worldH: number;
  floorSegments: StageFloorSegment[];
  platforms: StagePlatform[];
  playerSpawnSpots: StageLayoutSpot[];
  supplyChestSpots: StageLayoutSpot[];
  tombSpot: StageLayoutSpot;
  portalLeftSpot: StageLayoutSpot;
  portalRightSpot: StageLayoutSpot;
  lowerPortalSpots: StageLayoutSpot[];
  catMerchantSpot: StageLayoutSpot;
  bossSpawnSpot?: StageLayoutSpot;
}

export function getTerrainYFromSegments(segments: StageFloorSegment[], centerX: number): number {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (centerX >= seg.x1 && centerX <= seg.x2) {
      return seg.y;
    }
  }
  return segments[0]?.y ?? 790;
}

function buildSwitchbackMineLayout(): StageLayout {
  // Inspired by multi-level cavernous mine & vertical drop-through shafts
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 720, y: 760 },
    { x1: 720, x2: 1450, y: 825 },
    { x1: 1450, x2: 2200, y: 745 },
    { x1: 2200, x2: 2940, y: 840 },
    { x1: 2940, x2: 3600, y: 730 },
  ];
  const platforms: StagePlatform[] = [
    // Left vertical switchback shaft
    { x: 140, y: 635, w: 230, h: 20, tier: 'low' },
    { x: 420, y: 515, w: 240, h: 20, tier: 'mid' },
    { x: 125, y: 395, w: 295, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 190, y: 275, w: 230, h: 20, tier: 'shrine' }, // Portal Left

    // Sunken pit bridges & central cross-galleries
    { x: 840, y: 695, w: 230, h: 20, tier: 'low' },
    { x: 1120, y: 580, w: 270, h: 20, tier: 'mid' },
    { x: 960, y: 455, w: 540, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 1580, y: 615, w: 250, h: 20, tier: 'low' },
    { x: 1860, y: 495, w: 290, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 1620, y: 365, w: 320, h: 20, tier: 'high' }, // Tomb altar

    // Deep East trench bridges + upper ascent
    { x: 2310, y: 710, w: 245, h: 20, tier: 'low' },
    { x: 2610, y: 600, w: 265, h: 20, tier: 'mid' },
    { x: 2960, y: 595, w: 240, h: 20, tier: 'low' },
    { x: 2690, y: 470, w: 460, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3175, y: 350, w: 255, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'switchback_mine',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 260, y: 760 },
      { x: 1660, y: 745 },
      { x: 3120, y: 730 },
    ],
    supplyChestSpots: [
      { x: 265, y: 395 },
      { x: 1210, y: 455 },
      { x: 2570, y: 840 },
      { x: 2910, y: 470 },
      { x: 1090, y: 825 },
    ],
    tombSpot: { x: 1780, y: 365 },
    portalLeftSpot: { x: 305, y: 275 },
    portalRightSpot: { x: 3300, y: 350 },
    lowerPortalSpots: [
      { x: 480, y: 760 },
      { x: 2450, y: 840 },
    ],
    catMerchantSpot: { x: 1850, y: 745 },
  };
}

function buildTwinBastionsLayout(): StageLayout {
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 920, y: 820 },
    { x1: 920, x2: 1480, y: 735 },
    { x1: 1480, x2: 2120, y: 695 },
    { x1: 2120, x2: 2680, y: 735 },
    { x1: 2680, x2: 3600, y: 820 },
  ];
  const platforms: StagePlatform[] = [
    // West Bastion Tower
    { x: 180, y: 695, w: 225, h: 20, tier: 'low' },
    { x: 470, y: 585, w: 220, h: 20, tier: 'mid' },
    { x: 150, y: 465, w: 410, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 195, y: 340, w: 245, h: 20, tier: 'shrine' }, // Portal Left

    // Center Sky Citadel
    { x: 1010, y: 605, w: 235, h: 20, tier: 'low' },
    { x: 1460, y: 565, w: 680, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 1250, y: 445, w: 320, h: 20, tier: 'high' },
    { x: 1640, y: 350, w: 320, h: 22, isUpperFloor: true, tier: 'high' }, // Tomb
    { x: 2030, y: 445, w: 320, h: 20, tier: 'high' },
    { x: 2355, y: 605, w: 235, h: 20, tier: 'low' },

    // East Bastion Tower
    { x: 2910, y: 585, w: 220, h: 20, tier: 'mid' },
    { x: 3195, y: 695, w: 225, h: 20, tier: 'low' },
    { x: 3040, y: 465, w: 410, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3160, y: 340, w: 245, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'twin_bastions',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 520, y: 820 },
      { x: 1790, y: 695 },
      { x: 3060, y: 820 },
    ],
    supplyChestSpots: [
      { x: 350, y: 465 },
      { x: 1410, y: 445 },
      { x: 2190, y: 445 },
      { x: 3240, y: 465 },
      { x: 1800, y: 565 },
    ],
    tombSpot: { x: 1800, y: 350 },
    portalLeftSpot: { x: 318, y: 340 },
    portalRightSpot: { x: 3282, y: 340 },
    lowerPortalSpots: [
      { x: 640, y: 820 },
      { x: 2940, y: 820 },
    ],
    catMerchantSpot: { x: 1800, y: 695 },
  };
}

function buildSteppedCascadeLayout(): StageLayout {
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 640, y: 660 },
    { x1: 640, x2: 1280, y: 735 },
    { x1: 1280, x2: 2040, y: 830 },
    { x1: 2040, x2: 2760, y: 775 },
    { x1: 2760, x2: 3600, y: 695 },
  ];
  const platforms: StagePlatform[] = [
    // Elevated west cascade steps
    { x: 120, y: 535, w: 245, h: 20, tier: 'mid' },
    { x: 430, y: 420, w: 320, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 140, y: 300, w: 245, h: 20, tier: 'shrine' }, // Portal Left

    // Descending central chasm catwalks
    { x: 890, y: 615, w: 250, h: 20, tier: 'low' },
    { x: 1290, y: 705, w: 250, h: 20, tier: 'low' },
    { x: 1585, y: 585, w: 420, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 1245, y: 470, w: 310, h: 20, tier: 'high' },
    { x: 1700, y: 355, w: 290, h: 20, tier: 'high' }, // Tomb
    { x: 2090, y: 650, w: 245, h: 20, tier: 'low' },

    // East rising terraces
    { x: 2400, y: 530, w: 390, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 2880, y: 575, w: 250, h: 20, tier: 'mid' },
    { x: 3165, y: 455, w: 305, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3220, y: 330, w: 240, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'stepped_cascade',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 320, y: 660 },
      { x: 960, y: 735 },
      { x: 3180, y: 695 },
    ],
    supplyChestSpots: [
      { x: 590, y: 420 },
      { x: 1680, y: 830 },
      { x: 1395, y: 470 },
      { x: 2595, y: 530 },
      { x: 3310, y: 455 },
    ],
    tombSpot: { x: 1845, y: 355 },
    portalLeftSpot: { x: 262, y: 300 },
    portalRightSpot: { x: 3340, y: 330 },
    lowerPortalSpots: [
      { x: 820, y: 735 },
      { x: 2520, y: 775 },
    ],
    catMerchantSpot: { x: 1620, y: 830 },
  };
}

function buildAbyssalChasmLayout(): StageLayout {
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 880, y: 730 },
    { x1: 880, x2: 2720, y: 840 },
    { x1: 2720, x2: 3600, y: 730 },
  ];
  const platforms: StagePlatform[] = [
    // Left cliffside & portal
    { x: 180, y: 605, w: 250, h: 20, tier: 'mid' },
    { x: 475, y: 485, w: 295, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 145, y: 360, w: 250, h: 20, tier: 'shrine' }, // Portal Left

    // 4-tier hanging chasm bridges over deep abyss trench (y=840)
    { x: 940, y: 715, w: 320, h: 20, tier: 'low' },
    { x: 1460, y: 715, w: 680, h: 22, isUpperFloor: true, tier: 'low' },
    { x: 2340, y: 715, w: 320, h: 20, tier: 'low' },

    { x: 1120, y: 590, w: 340, h: 20, tier: 'mid' },
    { x: 1580, y: 590, w: 440, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 2140, y: 590, w: 340, h: 20, tier: 'mid' },

    { x: 1320, y: 465, w: 960, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 1640, y: 340, w: 320, h: 20, tier: 'high' }, // Tomb

    // Right cliffside & portal
    { x: 2830, y: 485, w: 295, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3170, y: 605, w: 250, h: 20, tier: 'mid' },
    { x: 3205, y: 360, w: 250, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'abyssal_chasm',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 460, y: 730 },
      { x: 1800, y: 840 },
      { x: 3120, y: 730 },
    ],
    supplyChestSpots: [
      { x: 620, y: 485 },
      { x: 1210, y: 840 },
      { x: 2390, y: 840 },
      { x: 1800, y: 465 },
      { x: 2975, y: 485 },
    ],
    tombSpot: { x: 1800, y: 340 },
    portalLeftSpot: { x: 270, y: 360 },
    portalRightSpot: { x: 3330, y: 360 },
    lowerPortalSpots: [
      { x: 640, y: 730 },
      { x: 2940, y: 730 },
    ],
    catMerchantSpot: { x: 1800, y: 840 },
  };
}

function buildCatwalkGalleriesLayout(): StageLayout {
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 1200, y: 805 },
    { x1: 1200, x2: 2400, y: 765 },
    { x1: 2400, x2: 3600, y: 805 },
  ];
  const platforms: StagePlatform[] = [
    // Tier 1 (y ~ 675)
    { x: 190, y: 680, w: 380, h: 20, tier: 'low' },
    { x: 860, y: 675, w: 460, h: 20, tier: 'low' },
    { x: 1620, y: 645, w: 380, h: 20, tier: 'low' },
    { x: 2290, y: 675, w: 460, h: 20, tier: 'low' },
    { x: 3030, y: 680, w: 380, h: 20, tier: 'low' },

    // Tier 2 (y ~ 545)
    { x: 460, y: 550, w: 520, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 1280, y: 525, w: 520, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 2040, y: 525, w: 520, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 2740, y: 550, w: 440, h: 22, isUpperFloor: true, tier: 'mid' },

    // Tier 3 (y ~ 415)
    { x: 140, y: 425, w: 420, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 960, y: 405, w: 560, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 1990, y: 405, w: 560, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3040, y: 425, w: 420, h: 22, isUpperFloor: true, tier: 'high' },

    // Top Shrines & Central Tomb (y ~ 290)
    { x: 170, y: 300, w: 235, h: 20, tier: 'shrine' }, // Portal Left
    { x: 1630, y: 315, w: 340, h: 20, tier: 'high' }, // Tomb
    { x: 3195, y: 300, w: 235, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'catwalk_galleries',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 410, y: 805 },
      { x: 1800, y: 765 },
      { x: 3190, y: 805 },
    ],
    supplyChestSpots: [
      { x: 720, y: 550 },
      { x: 1240, y: 405 },
      { x: 2270, y: 405 },
      { x: 2960, y: 550 },
      { x: 1800, y: 645 },
    ],
    tombSpot: { x: 1800, y: 315 },
    portalLeftSpot: { x: 288, y: 300 },
    portalRightSpot: { x: 3312, y: 300 },
    lowerPortalSpots: [
      { x: 580, y: 805 },
      { x: 3020, y: 805 },
    ],
    catMerchantSpot: { x: 1800, y: 765 },
  };
}

function buildCitadelSpireLayout(): StageLayout {
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 1120, y: 815 },
    { x1: 1120, x2: 2480, y: 775 },
    { x1: 2480, x2: 3600, y: 815 },
  ];
  const platforms: StagePlatform[] = [
    // Left courtyard ascent
    { x: 380, y: 690, w: 240, h: 20, tier: 'low' },
    { x: 150, y: 565, w: 260, h: 20, tier: 'mid' },
    { x: 420, y: 440, w: 320, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 145, y: 325, w: 240, h: 20, tier: 'shrine' }, // Portal Left

    // Giant Central Spire (ascending stairs both sides up to y=305)
    { x: 1020, y: 655, w: 320, h: 20, tier: 'low' },
    { x: 2260, y: 655, w: 320, h: 20, tier: 'low' },
    { x: 1290, y: 540, w: 1020, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 1470, y: 420, w: 660, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 1650, y: 300, w: 300, h: 20, tier: 'shrine' }, // Tomb peak

    // Right courtyard ascent
    { x: 2980, y: 690, w: 240, h: 20, tier: 'low' },
    { x: 3190, y: 565, w: 260, h: 20, tier: 'mid' },
    { x: 2860, y: 440, w: 320, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3215, y: 325, w: 240, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'citadel_spire',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 640, y: 815 },
      { x: 1800, y: 775 },
      { x: 2940, y: 815 },
    ],
    supplyChestSpots: [
      { x: 580, y: 440 },
      { x: 1180, y: 655 },
      { x: 1800, y: 420 },
      { x: 2420, y: 655 },
      { x: 3020, y: 440 },
    ],
    tombSpot: { x: 1800, y: 300 },
    portalLeftSpot: { x: 265, y: 325 },
    portalRightSpot: { x: 3335, y: 325 },
    lowerPortalSpots: [
      { x: 420, y: 815 },
      { x: 3180, y: 815 },
    ],
    catMerchantSpot: { x: 1800, y: 775 },
  };
}

function buildSunkenVaultLayout(): StageLayout {
  const floorSegments: StageFloorSegment[] = [
    { x1: 0, x2: 780, y: 700 },
    { x1: 780, x2: 2820, y: 835 },
    { x1: 2820, x2: 3600, y: 700 },
  ];
  const platforms: StagePlatform[] = [
    // Upper West Terrace
    { x: 200, y: 575, w: 260, h: 20, tier: 'mid' },
    { x: 495, y: 450, w: 320, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 170, y: 330, w: 240, h: 20, tier: 'shrine' }, // Portal Left

    // Vault Basin Stepping Tiers
    { x: 850, y: 710, w: 270, h: 20, tier: 'low' },
    { x: 1200, y: 590, w: 360, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 1620, y: 705, w: 360, h: 20, tier: 'low' },
    { x: 2040, y: 590, w: 360, h: 22, isUpperFloor: true, tier: 'mid' },
    { x: 2480, y: 710, w: 270, h: 20, tier: 'low' },
    { x: 1510, y: 465, w: 580, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 1670, y: 345, w: 260, h: 20, tier: 'shrine' }, // Tomb

    // Upper East Terrace
    { x: 2785, y: 450, w: 320, h: 22, isUpperFloor: true, tier: 'high' },
    { x: 3140, y: 575, w: 260, h: 20, tier: 'mid' },
    { x: 3190, y: 330, w: 240, h: 20, tier: 'shrine' }, // Portal Right
  ];
  return {
    templateId: 'sunken_vault',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 380, y: 700 },
      { x: 1800, y: 835 },
      { x: 3220, y: 700 },
    ],
    supplyChestSpots: [
      { x: 655, y: 450 },
      { x: 1380, y: 590 },
      { x: 1320, y: 835 },
      { x: 2220, y: 590 },
      { x: 2945, y: 450 },
    ],
    tombSpot: { x: 1800, y: 345 },
    portalLeftSpot: { x: 290, y: 330 },
    portalRightSpot: { x: 3310, y: 330 },
    lowerPortalSpots: [
      { x: 540, y: 700 },
      { x: 3060, y: 700 },
    ],
    catMerchantSpot: { x: 1800, y: 835 },
  };
}

function buildBossColosseumLayout(variant: 0 | 1): StageLayout {
  // Wide central colosseum floor (795) so boss patrols cleanly while upper flanking tiers give vertical tactical routing
  const floorSegments: StageFloorSegment[] =
    variant === 0
      ? [
          { x1: 0, x2: 520, y: 740 },
          { x1: 520, x2: 3080, y: 805 },
          { x1: 3080, x2: 3600, y: 740 },
        ]
      : [
          { x1: 0, x2: 640, y: 775 },
          { x1: 640, x2: 2960, y: 815 },
          { x1: 2960, x2: 3600, y: 775 },
        ];

  const platforms: StagePlatform[] =
    variant === 0
      ? [
          { x: 220, y: 615, w: 240, h: 20, tier: 'low' },
          { x: 540, y: 675, w: 250, h: 20, tier: 'low' },
          { x: 150, y: 490, w: 390, h: 22, isUpperFloor: true, tier: 'mid' },
          { x: 170, y: 365, w: 245, h: 20, tier: 'shrine' }, // Portal Left

          { x: 960, y: 645, w: 300, h: 20, tier: 'low' },
          { x: 1380, y: 530, w: 840, h: 22, isUpperFloor: true, tier: 'high' },
          { x: 1660, y: 405, w: 280, h: 20, tier: 'shrine' }, // Tomb
          { x: 2340, y: 645, w: 300, h: 20, tier: 'low' },

          { x: 2810, y: 675, w: 250, h: 20, tier: 'low' },
          { x: 3140, y: 615, w: 240, h: 20, tier: 'low' },
          { x: 3060, y: 490, w: 390, h: 22, isUpperFloor: true, tier: 'mid' },
          { x: 3185, y: 365, w: 245, h: 20, tier: 'shrine' }, // Portal Right
        ]
      : [
          { x: 310, y: 650, w: 260, h: 20, tier: 'low' },
          { x: 740, y: 685, w: 280, h: 20, tier: 'low' },
          { x: 1090, y: 560, w: 380, h: 22, isUpperFloor: true, tier: 'mid' },
          { x: 160, y: 525, w: 380, h: 22, isUpperFloor: true, tier: 'mid' },
          { x: 195, y: 400, w: 245, h: 20, tier: 'shrine' }, // Portal Left

          { x: 1620, y: 465, w: 360, h: 22, isUpperFloor: true, tier: 'high' },
          { x: 1670, y: 340, w: 260, h: 20, tier: 'shrine' }, // Tomb

          { x: 2130, y: 560, w: 380, h: 22, isUpperFloor: true, tier: 'mid' },
          { x: 2580, y: 685, w: 280, h: 20, tier: 'low' },
          { x: 3030, y: 650, w: 260, h: 20, tier: 'low' },
          { x: 3060, y: 525, w: 380, h: 22, isUpperFloor: true, tier: 'mid' },
          { x: 3160, y: 400, w: 245, h: 20, tier: 'shrine' }, // Portal Right
        ];

  const centerFloorY = variant === 0 ? 805 : 815;
  return {
    templateId: variant === 0 ? 'boss_colosseum_a' : 'boss_colosseum_b',
    worldW: 3600,
    worldH: 920,
    floorSegments,
    platforms,
    playerSpawnSpots: [
      { x: 420, y: variant === 0 ? 740 : 775 },
      { x: 1080, y: centerFloorY },
    ],
    supplyChestSpots: [
      { x: 345, y: variant === 0 ? 490 : 525 },
      { x: variant === 0 ? 1110 : 880, y: variant === 0 ? 645 : 685 },
      { x: variant === 0 ? 1800 : 1280, y: variant === 0 ? 530 : 560 },
      { x: variant === 0 ? 2490 : 2720, y: variant === 0 ? 645 : 685 },
      { x: 3255, y: variant === 0 ? 490 : 525 },
    ],
    tombSpot: { x: 1800, y: variant === 0 ? 405 : 340 },
    portalLeftSpot: { x: variant === 0 ? 292 : 318, y: variant === 0 ? 365 : 400 },
    portalRightSpot: { x: variant === 0 ? 3308 : 3282, y: variant === 0 ? 365 : 400 },
    lowerPortalSpots: [
      { x: 320, y: variant === 0 ? 740 : 775 },
      { x: 3280, y: variant === 0 ? 740 : 775 },
    ],
    catMerchantSpot: { x: 860, y: centerFloorY },
    bossSpawnSpot: { x: 2650, y: centerFloorY },
  };
}

const STANDARD_LAYOUT_BUILDERS: Array<() => StageLayout> = [
  buildTwinBastionsLayout,
  buildSwitchbackMineLayout,
  buildSteppedCascadeLayout,
  buildAbyssalChasmLayout,
  buildCatwalkGalleriesLayout,
  buildCitadelSpireLayout,
  buildSunkenVaultLayout,
];

/**
 * Deterministic multi-tier dungeon stage layout selector.
 * Every stage & sub-stage pair (1-1, 1-2, 1-3, 1-4, 2-1, ...) maps to genuinely distinct architecture.
 */
export function getStageLayout(stage: number, subStage: number): StageLayout {
  const safeStage = Math.max(1, Math.min(10, Math.floor(stage)));
  const safeSub = Math.max(1, Math.min(5, Math.floor(subStage)));
  if (safeSub === 5) {
    return buildBossColosseumLayout(((safeStage - 1) % 2) as 0 | 1);
  }
  const idx = ((safeStage - 1) * 4 + (safeSub - 1)) % STANDARD_LAYOUT_BUILDERS.length;
  return STANDARD_LAYOUT_BUILDERS[idx]();
}

export function validateStageLayout(layout: StageLayout): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (layout.worldW < 3200 || layout.worldH < 880) {
    errors.push('World bounds too small');
  }
  if (layout.floorSegments.length === 0) {
    errors.push('Missing floor segments');
  } else {
    if (layout.floorSegments[0].x1 !== 0) errors.push('Floor does not start at x=0');
    if (layout.floorSegments[layout.floorSegments.length - 1].x2 !== layout.worldW) {
      errors.push('Floor does not reach worldW');
    }
    for (let i = 1; i < layout.floorSegments.length; i++) {
      if (layout.floorSegments[i].x1 !== layout.floorSegments[i - 1].x2) {
        errors.push(`Discontinuous floor at segment ${i}`);
      }
    }
  }

  const maxSingleJumpRise = 142; // Safe margin below 156px single jump apex
  const isPointSupported = (pt: StageLayoutSpot): boolean => {
    const onPlat = layout.platforms.some(
      (p) => pt.x >= p.x + 12 && pt.x <= p.x + p.w - 12 && Math.abs(pt.y - p.y) <= 2
    );
    const onFloor = layout.floorSegments.some(
      (f) => pt.x >= f.x1 + 20 && pt.x <= f.x2 - 20 && Math.abs(pt.y - f.y) <= 2
    );
    return onPlat || onFloor;
  };

  if (!isPointSupported(layout.tombSpot)) errors.push('Tomb spot not grounded');
  if (!isPointSupported(layout.portalLeftSpot)) errors.push('Left portal spot not grounded');
  if (!isPointSupported(layout.portalRightSpot)) errors.push('Right portal spot not grounded');
  if (!isPointSupported(layout.catMerchantSpot)) errors.push('Cat merchant spot not grounded');
  if (layout.lowerPortalSpots.length < 2) errors.push('Missing lower portal spots');
  for (let i = 0; i < layout.lowerPortalSpots.length; i++) {
    if (!isPointSupported(layout.lowerPortalSpots[i])) {
      errors.push(`Lower portal spot ${i} not grounded`);
    }
  }
  for (let i = 0; i < layout.supplyChestSpots.length; i++) {
    if (!isPointSupported(layout.supplyChestSpots[i])) {
      errors.push(`Supply chest spot ${i} not grounded`);
    }
  }

  for (let i = 0; i < layout.platforms.length; i++) {
    const p = layout.platforms[i];
    if (p.x < 30 || p.x + p.w > layout.worldW - 30) {
      errors.push(`Platform ${i} outside safe horizontal bounds`);
    }
    // Check that at least one stepping surface (floor or lower platform) sits within single-jump rise
    let reachableFromBelow = false;
    for (const seg of layout.floorSegments) {
      const overlapX = Math.min(p.x + p.w, seg.x2) - Math.max(p.x, seg.x1);
      if (overlapX > -210 && seg.y - p.y > 0 && seg.y - p.y <= maxSingleJumpRise) {
        reachableFromBelow = true;
        break;
      }
    }
    if (!reachableFromBelow) {
      for (let j = 0; j < layout.platforms.length; j++) {
        if (i === j) continue;
        const lower = layout.platforms[j];
        if (lower.y <= p.y) continue;
        const dy = lower.y - p.y;
        const horizGap = Math.max(0, Math.max(p.x - (lower.x + lower.w), lower.x - (p.x + p.w)));
        if (dy <= maxSingleJumpRise && horizGap <= 230) {
          reachableFromBelow = true;
          break;
        }
      }
    }
    if (!reachableFromBelow) {
      errors.push(`Platform ${i} (y=${p.y}) exceeds single-jump reachability`);
    }
  }

  return { valid: errors.length === 0, errors };
}
