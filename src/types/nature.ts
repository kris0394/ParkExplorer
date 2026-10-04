/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vec2D {
  x: number;
  z: number;
}

export interface Vec3D {
  x: number;
  y: number;
  z: number;
}

export interface TrailNode {
  x: number;
  z: number;
  width?: number;
  isBridge?: boolean;
}

export interface RockInstance {
  x: number;
  y: number;
  z: number;
  radius: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  colorHex: number;
  isRiverRock?: boolean;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  pos: Vec3D;
}

export const WORLD_SETTINGS = {
  worldSize: 600,
  terrainSegments: 240,
  fogDensity: 0.0105,
  eyeHeight: 1.7,
  walkSpeed: 4.2,
  sprintSpeed: 7.8,
  wadeSpeed: 2.1,
  arrowTurnSpeed: 1.8,
  mouseSensitivity: 0.0022,
  staminaDrain: 20,
  staminaRegen: 16,
  staminaRegenDelay: 0.9,
  staminaExhaustRecover: 25,
  maxPixelRatio: 2,
};

export const SPAWN_POINT: Vec3D = {
  x: 0,
  y: 2.4,
  z: 14,
};

export const SUMMIT_POINT: Vec3D = {
  x: 82,
  y: 30.5,
  z: -70,
};

export const BRIDGE_WEST_X = 22.0;
export const BRIDGE_EAST_X = 36.0;
export const BRIDGE_Z = 4.0;
export const BRIDGE_DECK_Y = 1.25;
export const BRIDGE_WIDTH = 3.6;

export const WATER_SURFACE_Y = -1.0;
export const RIVER_HALF_WIDTH = 6.2;
export const RIVER_BANK_WIDTH = 7.0;
