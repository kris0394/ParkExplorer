/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { WORLD_SETTINGS } from '../types/nature';
import {
  heightAt,
  isPointOnBridge,
  isPointInRiver,
  getWaterDepth,
  isPointOnSummitDeck,
  getWalkableHeight,
  getRiverDistance,
} from '../terrain/riverTerrain.ts';
import { createWaterShaderMaterial, createRiverWaterMesh } from '../shaders/waterShader.ts';
import { createTrailMeshGroup } from '../entities/trailMesh.ts';
import { createBridgeGroup } from '../entities/bridge.ts';
import { createSummitOverlookGroup } from '../entities/summitOverlook.ts';
import { createRocksSystem, pushOutOfRocks } from '../entities/rocks.ts';
import { GrassSystem } from '../entities/grass.ts';
import { createForestSystem, pushOutOfTrees } from '../entities/trees.ts';
import { createForestFloorSystem } from '../entities/forestFloor.ts';
import { WildlifeManager } from '../entities/wildlifeManager.ts';
import { BinocularsSystem, BinocularTarget } from '../entities/binoculars.ts';
import { evaluateCurrentFraming, ScoredPhoto, ViewportFrame, PHOTO_RULES } from '../entities/photography.ts';
import { progress, computeParkStats, SHOP_ITEMS } from '../entities/progress.ts';
import { getAllPhotos, savePhotoToStore, deletePhotoFromStore, replaceAllPhotos, clearAllPhotos } from '../utils/photoStore.ts';
import { audioManager } from '../utils/audio.ts';
import { HUD } from './HUD.tsx';
import { CameraViewfinder, PhotoResultCard, PhotoGalleryModal } from './PhotoUI.tsx';
import { JournalModal, ProgressBadge, ActivityToastFeed } from './JournalUI.tsx';
import { HandheldCompassUI } from './HandheldCompassUI.tsx';
import { getSeasonDef } from '../data/seasons.ts';
import { RangerNotices, RangerNoticeState, EMPTY_RANGER_NOTICE } from './RangerNotices.tsx';
import {
  SAFE_DISTANCE_M,
  RangerZone,
  LitterSpot,
  getZonesForPark,
  findClosedZoneAt,
  buildLitterSpots,
  createLitterGroup,
  createZoneMarkersGroup,
  pushOutOfClosedZones,
} from '../entities/rangerRules';
import { mulberry32, sstep, fbm, clamp } from '../utils/noise.ts';
import { ParkDefinition, AVAILABLE_PARKS } from '../data/parks.ts';

interface NatureWorldProps {
  park: ParkDefinition;
  onSelectPark: (parkId: string) => void;
  onPauseChange: (isPaused: boolean) => void;
}

export const NatureWorld: React.FC<NatureWorldProps> = ({ park, onSelectPark, onPauseChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with persistent progress store (Task 7 equipment & hydration)
  const { data: progressData } = useSyncExternalStore(progress.subscribe, progress.getSnapshot);

  // HUD & Game State
  const [stamina, setStamina] = useState(100);
  const [exhausted, setExhausted] = useState(false);
  const [altitude, setAltitude] = useState(park.spawn.y);
  const [yaw, setYaw] = useState(park.spawn.yaw);
  const [pitch, setPitch] = useState(0);
  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number }>({ x: park.spawn.x, z: park.spawn.z });
  const [waterDepth, setWaterDepth] = useState(0);
  const [isWading, setIsWading] = useState(false);
  const [isOnBridge, setIsOnBridge] = useState(false);
  const [isOnSummit, setIsOnSummit] = useState(false);
  const [isNearTelescope, setIsNearTelescope] = useState(false);
  const [isNearWaterStation, setIsNearWaterStation] = useState(false);
  const [isLookingThroughTelescope, setIsLookingThroughTelescope] = useState(false);
  const [telescopeZoomLevel, setTelescopeZoomLevel] = useState(6.5);

  // Binoculars state
  const [isBinocularsActive, setIsBinocularsActive] = useState(false);
  const [binocularsZoomLevel, setBinocularsZoomLevel] = useState(4.0);
  const [binocularTarget, setBinocularTarget] = useState<BinocularTarget | null>(null);
  const [sightingsCount, setSightingsCount] = useState(0);

  // Photography state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [cameraGuide, setCameraGuide] = useState<{
    kind: string;
    subject: string;
    u: number | null;
    v: number | null;
    distance: number;
    condition: string | null;
    tooClose: boolean;
    hints: { text: string; good: boolean }[];
  } | null>(null);
  const [photos, setPhotos] = useState<ScoredPhoto[]>([]);
  const [latestPhoto, setLatestPhoto] = useState<ScoredPhoto | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  // Journal, Shop, Compass modals
  const [showJournal, setShowJournal] = useState(false);
  const [journalInitialTab, setJournalInitialTab] = useState<'overview' | 'wildlife' | 'places' | 'shop' | 'activity'>('overview');
  const [isCompassDrawn, setIsCompassDrawn] = useState(false);

  // Audio, PhotoMode, Lighting
  const [isMuted, setIsMuted] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'dawn' | 'twilight'>('day');
  const [showHelp, setShowHelp] = useState(false);
  const [isCursorLocked, setIsCursorLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rangerNotice, setRangerNotice] = useState<RangerNoticeState>(EMPTY_RANGER_NOTICE);
  const zoneNoticeRef = useRef<RangerNoticeState['zone']>(null);
  const nearLitterRef = useRef<LitterSpot | null>(null);

  // Refs for animation loop
  const timeOfDayRef = useRef<'day' | 'sunset' | 'dawn' | 'twilight'>('day');
  const telescopeFovRef = useRef(11.0);
  const isLookingThroughTelescopeRef = useRef(false);
  const isNearTelescopeRef = useRef(false);
  const isNearWaterStationRef = useRef(false);
  const lowWaterWarnedRef = useRef(false);
  const isBinocularsActiveRef = useRef(false);
  const binocularsFovRef = useRef(17.5);
  const isCameraActiveRef = useRef(false);
  const cameraFovRef = useRef(58.0);
  const cameraZoomFactorRef = useRef(1.0);
  const shutterTriggerRef = useRef(false);
  const latestPhotoTimeoutRef = useRef<number | null>(null);

  const wildlifeRef = useRef<WildlifeManager | null>(null);
  const binocularsRef = useRef<BinocularsSystem | null>(null);
  const telescopeGroupRef = useRef<THREE.Group | null>(null);

  // Internal mutable refs for 60fps loop
  const playerRef = useRef({
    pos: new THREE.Vector3(park.spawn.x, park.spawn.y, park.spawn.z),
    vel: new THREE.Vector2(0, 0),
    yaw: park.spawn.yaw,
    pitch: 0,
    groundY: park.spawn.y,
    stamina: 100,
    exhausted: false,
    regenTimer: 0,
    bobPhase: 0,
    distanceSinceStep: 0,
    crouchOffset: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const isLockedRef = useRef(false);
  const mouseSensitivityRef = useRef(WORLD_SETTINGS.mouseSensitivity);
  const headBobRef = useRef(true);

  // Lighting & scene refs
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const waterMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 1800);
  };

  // Load photos from IndexedDB
  useEffect(() => {
    let canceled = false;
    getAllPhotos().then(stored => {
      if (canceled || stored.length === 0) return;
      setPhotos(stored);
    });
    return () => {
      canceled = true;
    };
  }, []);

  // Update park visits in progress store
  useEffect(() => {
    progress.visitPark(park.id, park.name);
  }, [park.id, park.name]);

  const toggleBinoculars = () => {
    if (isLookingThroughTelescopeRef.current) return;
    if (isCameraActiveRef.current) {
      toggleCamera();
    }
    const next = !isBinocularsActiveRef.current;
    isBinocularsActiveRef.current = next;
    setIsBinocularsActive(next);
    audioManager.playBinocularsClick();

    const camera = cameraRef.current;
    if (!camera) return;

    if (next) {
      const hasEDGlass = progress.isOwned('binoculars_ed');
      binocularsFovRef.current = hasEDGlass ? 13.0 : 17.5;
      camera.fov = binocularsFovRef.current;
      camera.updateProjectionMatrix();
      setBinocularsZoomLevel(Math.round((70 / binocularsFovRef.current) * 10) / 10);
      showToast(
        hasEDGlass
          ? '10×42 ED Binoculars: Ultra-sharp optics with 1.8s instant wildlife identification'
          : 'Raised Field Binoculars (Scroll to zoom, C to brace, B to lower)'
      );
    } else {
      camera.fov = 70;
      camera.updateProjectionMatrix();
      setBinocularTarget(null);
      binocularsRef.current?.reset();
      showToast('Lowered Binoculars');
    }
  };

  const toggleCamera = () => {
    if (isLookingThroughTelescopeRef.current) return;
    if (isBinocularsActiveRef.current) {
      toggleBinoculars();
    }
    const next = !isCameraActiveRef.current;
    isCameraActiveRef.current = next;
    setIsCameraActive(next);
    audioManager.playBinocularsClick();

    const camera = cameraRef.current;
    if (!camera) return;

    if (next) {
      camera.fov = cameraFovRef.current;
      camera.updateProjectionMatrix();
      setCameraZoom(Math.round((70 / cameraFovRef.current) * 10) / 10);
      showToast('Camera Raised: Frame subject and Click or Space to take photo');
    } else {
      camera.fov = 70;
      camera.updateProjectionMatrix();
      setCameraGuide(null);
      showToast('Camera Lowered');
    }
  };

  const setCameraZoomFov = (fov: number) => {
    const hasTelephoto = progress.isOwned('lens_telephoto');
    const minFov = hasTelephoto ? 12.0 : 16.0;
    cameraFovRef.current = clamp(fov, minFov, 60.0);
    const camera = cameraRef.current;
    if (camera && isCameraActiveRef.current) {
      camera.fov = cameraFovRef.current;
      camera.updateProjectionMatrix();
    }
    const z = Math.round((70 / cameraFovRef.current) * 10) / 10;
    cameraZoomFactorRef.current = z;
    setCameraZoom(z);
  };

  const triggerShutter = () => {
    if (isCameraActiveRef.current) {
      shutterTriggerRef.current = true;
    }
  };

  const toggleTelescope = () => {
    if (isBinocularsActiveRef.current) {
      toggleBinoculars();
    }
    if (isCameraActiveRef.current) {
      toggleCamera();
    }

    const nextState = !isLookingThroughTelescopeRef.current;
    isLookingThroughTelescopeRef.current = nextState;
    setIsLookingThroughTelescope(nextState);

    // Hide or show telescope mesh so barrel doesn't clip when looking down
    if (telescopeGroupRef.current) {
      telescopeGroupRef.current.visible = !nextState;
    }

    const camera = cameraRef.current;
    if (!camera) return;

    if (nextState) {
      telescopeFovRef.current = 11.0;
      camera.fov = telescopeFovRef.current;
      camera.updateProjectionMatrix();
      setTelescopeZoomLevel(Math.round((70 / telescopeFovRef.current) * 10) / 10);
      // Pre-aim down towards the river valley and meadows below
      playerRef.current.pitch = -0.42;
      playerRef.current.yaw = Math.PI * 0.72;
      showToast('Telescope View: Mouse Drag or Arrow Keys to tilt Up & Down into the valley');
    } else {
      camera.fov = 70;
      camera.updateProjectionMatrix();
      showToast('Exited Telescope View');
    }
  };

  const handleTelescopePan = (dYaw: number, dPitch: number) => {
    playerRef.current.yaw += dYaw;
    // Generous vertical pitch range down to -1.35 rad (-77°) into the valley!
    playerRef.current.pitch = clamp(playerRef.current.pitch + dPitch, -1.35, 0.75);
    setPitch(playerRef.current.pitch);
    setYaw(playerRef.current.yaw);
  };

  const toggleCompass = () => {
    if (!progress.isOwned('compass_map')) {
      setJournalInitialTab('shop');
      setShowJournal(true);
      showToast('Orienteering Compass can be purchased in the Ranger Shop');
      return;
    }
    const next = !isCompassDrawn;
    setIsCompassDrawn(next);
    showToast(next ? 'Holding Orienteering Compass' : 'Stowed Compass');
  };

  const handleDrinkWater = () => {
    const res = progress.drinkWater();
    showToast(res.message);
  };

  const handleRefillWater = () => {
    const res = progress.refillWater(
      isOnSummit ? 'Summit Overlook Potable Water Fountain' : 'Trailhead Potable Water Station'
    );
    showToast(res.message);
  };

  const handleOpenShop = () => {
    setJournalInitialTab('shop');
    setShowJournal(true);
  };

  const setLightingPreset = (preset: 'day' | 'sunset' | 'dawn' | 'twilight') => {
    timeOfDayRef.current = preset;
    setTimeOfDay(preset);
    const sun = sunLightRef.current;
    const hemi = hemiLightRef.current;
    const sky = skyMatRef.current;
    const water = waterMatRef.current;
    const scene = sceneRef.current;
    if (!sun || !hemi || !sky || !scene) return;

    if (preset === 'day') {
      const fogCol = new THREE.Color(park.atmosphere.fogColor);
      scene.background = fogCol;
      scene.fog = new THREE.FogExp2(fogCol, park.atmosphere.fogDensity);
      sun.color.setHex(park.atmosphere.sunColor);
      sun.intensity = park.atmosphere.sunIntensity;
      hemi.color.setHex(park.atmosphere.hemiSky);
      hemi.groundColor.setHex(park.atmosphere.hemiGround);
      hemi.intensity = 1.15;
      sky.uniforms.cHorizon.value.setHex(park.atmosphere.skyHorizon);
      sky.uniforms.cMid.value.setHex(park.atmosphere.skyMid);
      sky.uniforms.cZenith.value.setHex(park.atmosphere.skyZenith);
      sky.uniforms.cSun.value.setHex(park.atmosphere.skySun);
      if (water) {
        water.uniforms.fogColor.value.copy(fogCol);
        water.uniforms.skyReflectColor.value.setHex(park.water.skyReflectColor);
        water.uniforms.sunColor.value.setHex(0xfff0c8);
      }
    } else if (preset === 'sunset') {
      const fogCol = new THREE.Color(0xd99a7e);
      scene.background = fogCol;
      scene.fog = new THREE.FogExp2(fogCol, park.atmosphere.fogDensity * 1.1);
      sun.color.setHex(0xff7538);
      sun.intensity = 3.2;
      hemi.color.setHex(0xdfa082);
      hemi.groundColor.setHex(0x523624);
      hemi.intensity = 0.95;
      sky.uniforms.cHorizon.value.setHex(0xd99a7e);
      sky.uniforms.cMid.value.setHex(0xc2786a);
      sky.uniforms.cZenith.value.setHex(0x42385c);
      sky.uniforms.cSun.value.setHex(0xffaa44);
      if (water) {
        water.uniforms.fogColor.value.copy(fogCol);
        water.uniforms.skyReflectColor.value.setHex(0xd48a74);
        water.uniforms.sunColor.value.setHex(0xff9944);
      }
    } else if (preset === 'dawn') {
      const fogCol = new THREE.Color(0xcbd4c8);
      scene.background = fogCol;
      scene.fog = new THREE.FogExp2(fogCol, park.atmosphere.fogDensity * 1.05);
      sun.color.setHex(0xffc892);
      sun.intensity = 2.4;
      hemi.color.setHex(0xb2ccdf);
      hemi.groundColor.setHex(0x657552);
      hemi.intensity = 1.05;
      sky.uniforms.cHorizon.value.setHex(0xcbd4c8);
      sky.uniforms.cMid.value.setHex(0x9bc2ca);
      sky.uniforms.cZenith.value.setHex(0x4b7899);
      sky.uniforms.cSun.value.setHex(0xffd5a0);
      if (water) {
        water.uniforms.fogColor.value.copy(fogCol);
        water.uniforms.skyReflectColor.value.setHex(0x9fc2c4);
        water.uniforms.sunColor.value.setHex(0xffd8b0);
      }
    } else {
      // Twilight
      const fogCol = new THREE.Color(0x384252);
      scene.background = fogCol;
      scene.fog = new THREE.FogExp2(fogCol, park.atmosphere.fogDensity * 1.25);
      sun.color.setHex(0x607494);
      sun.intensity = 1.2;
      hemi.color.setHex(0x445570);
      hemi.groundColor.setHex(0x202b28);
      hemi.intensity = 0.65;
      sky.uniforms.cHorizon.value.setHex(0x384252);
      sky.uniforms.cMid.value.setHex(0x272e42);
      sky.uniforms.cZenith.value.setHex(0x111624);
      sky.uniforms.cSun.value.setHex(0x889fc4);
      if (water) {
        water.uniforms.fogColor.value.copy(fogCol);
        water.uniforms.skyReflectColor.value.setHex(0x3a485a);
        water.uniforms.sunColor.value.setHex(0x88a2c8);
      }
    }
  };

  const handleTeleport = (x: number, y: number, z: number, targetYaw: number) => {
    if (isLookingThroughTelescopeRef.current) {
      toggleTelescope();
    }
    const closedHere = findClosedZoneAt(x, z, getZonesForPark(park.id));
    if (closedHere) {
      showToast(`${closedHere.name} is closed right now`);
      return;
    }
    playerRef.current.pos.set(x, y, z);
    playerRef.current.groundY = y;
    playerRef.current.yaw = targetYaw;
    playerRef.current.vel.set(0, 0);
    showToast('Fast Traveled');
  };

  const handleDeletePhoto = (id: string) => {
    deletePhotoFromStore(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    setLatestPhoto(prev => (prev && prev.id === id ? null : prev));
  };

  // Main Three.js Scene Setup & 60fps Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    // Reset player position to park spawn
    playerRef.current.pos.set(park.spawn.x, park.spawn.y, park.spawn.z);
    playerRef.current.groundY = park.spawn.y;
    playerRef.current.yaw = park.spawn.yaw;
    playerRef.current.pitch = 0;
    playerRef.current.vel.set(0, 0);

    // 1. Renderer
   const renderer = new THREE.WebGLRenderer({ 
   antialias: true, 
   powerPreference: 'high-performance',
   preserveDrawingBuffer: true 
   });
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, WORLD_SETTINGS.maxPixelRatio));
   renderer.setSize(container.clientWidth, container.clientHeight);
   renderer.toneMapping = THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure = 1.1;
   renderer.shadowMap.enabled = true;
   renderer.shadowMap.type = THREE.PCFSoftShadowMap;
   container.appendChild(renderer.domElement);

    // 2. Scene & Fog from ParkDefinition
    const FOG_COLOR = new THREE.Color(park.atmosphere.fogColor);
    const scene = new THREE.Scene();
    scene.background = FOG_COLOR;
    scene.fog = new THREE.FogExp2(FOG_COLOR, park.atmosphere.fogDensity);
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    cameraRef.current = camera;

    // 4. Sky Dome
    const SUN_DIR = new THREE.Vector3(0.35, 0.42, -0.84).normalize();
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        cHorizon: { value: new THREE.Color(park.atmosphere.skyHorizon) },
        cMid: { value: new THREE.Color(park.atmosphere.skyMid) },
        cZenith: { value: new THREE.Color(park.atmosphere.skyZenith) },
        cSun: { value: new THREE.Color(park.atmosphere.skySun) },
        sunDir: { value: SUN_DIR.clone() },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 cHorizon; uniform vec3 cMid; uniform vec3 cZenith; uniform vec3 cSun; uniform vec3 sunDir;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 col = mix(cHorizon, cMid, smoothstep(0.0, 0.28, h));
          col = mix(col, cZenith, smoothstep(0.25, 0.85, h));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += cSun * (pow(s, 6.0) * 0.28 + pow(s, 64.0) * 0.55);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    skyMatRef.current = skyMaterial;

    const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMaterial);
    skyMesh.frustumCulled = false;
    skyMesh.renderOrder = -1;
    scene.add(skyMesh);

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(park.atmosphere.hemiSky, park.atmosphere.hemiGround, 1.15);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(park.atmosphere.sunColor, park.atmosphere.sunIntensity);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    const d = sunLight.shadow.camera;
    d.left = -65;
    d.right = 65;
    d.top = 65;
    d.bottom = -65;
    d.near = 1.0;
    d.far = 280;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.05;
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLightRef.current = sunLight;

    // 6. Terrain Geometry & Vertex Colors
    const terrainGeo = new THREE.PlaneGeometry(
      WORLD_SETTINGS.worldSize,
      WORLD_SETTINGS.worldSize,
      WORLD_SETTINGS.terrainSegments,
      WORLD_SETTINGS.terrainSegments
    );
    terrainGeo.rotateX(-Math.PI / 2);

    {
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
      }
      terrainGeo.computeVertexNormals();

      const normals = terrainGeo.attributes.normal;
      const colors = new Float32Array(pos.count * 3);
      const tc = park.terrain.colors;
      const cValley = new THREE.Color(tc.valley);
      const cMeadow = new THREE.Color(tc.meadow);
      const cDryGrass = new THREE.Color(tc.dryGrass);
      const cSlope = new THREE.Color(tc.steepSlope);
      const cRiverbed = new THREE.Color(tc.riverbed);
      const cRiverbank = new THREE.Color(tc.riverbank);
      const cRock = new THREE.Color(tc.summitRock);
      const cMulch = new THREE.Color(0x284724);
      const seasonDef = getSeasonDef();
      const cSeason = new THREE.Color(seasonDef.groundColor);
      const col = new THREE.Color();

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ny = normals.getY(i);
        const rDist = getRiverDistance(x, z);
        const n1 = fbm(x * 0.035 + 40, z * 0.035 - 20, 3);
        const n2 = fbm(x * 0.12 - 9, z * 0.12 + 31, 2);
        const n3 = fbm(x * 0.32 + 10, z * 0.32 - 55, 2);
        const rockNoise = fbm(x * 0.055 - 33, z * 0.055 + 88, 3);

        col.copy(cValley).lerp(cMeadow, sstep(-0.35, 0.35, n1));
        col.lerp(cDryGrass, sstep(0.12, 0.62, n1 + y * 0.015) * 0.65);
        col.lerp(cSlope, sstep(0.9, 0.72, ny) * 0.88);

        if (ny < 0.84 || rockNoise > 0.3) {
          const rockBlend = sstep(0.84, 0.68, ny) * 0.75 + sstep(0.3, 0.58, rockNoise) * 0.45;
          col.lerp(cRock, Math.min(1.0, rockBlend));
        }

        if (ny > 0.8 && n1 < -0.22) {
          col.lerp(cMulch, sstep(-0.22, -0.55, n1) * 0.65);
        }

        if (park.water.hasRiver) {
          if (rDist < park.water.halfWidth) {
            col.lerp(cRiverbed, 0.92);
          } else if (rDist < park.water.halfWidth + 5.5) {
            const tBank = sstep(park.water.halfWidth + 5.5, park.water.halfWidth, rDist);
            col.lerp(cRiverbank, tBank * 0.8);
          }
        }

        if (y > 20.0) {
          const tSummit = sstep(20.0, park.terrain.mountain.height, y);
          col.lerp(cRock, tSummit * 0.75);
        }

        // Task 10: season tint (autumn warmth, spring freshness, winter snow)
        if (seasonDef.groundAmount > 0) {
          let amt = seasonDef.groundAmount;
          if (seasonDef.groundIsSnow) {
            // Snow settles on flatter ground and builds up with height; none in the river
            amt *= 0.35 + 0.65 * sstep(0.7, 0.92, ny);
            amt = Math.min(0.95, amt + Math.max(0, y) * 0.006);
            if (park.water.hasRiver && rDist < park.water.halfWidth + 0.5) amt = 0;
          }
          col.lerp(cSeason, amt);
        }

        const mottling = 0.86 + n2 * 0.18 + n3 * 0.08;
        col.multiplyScalar(mottling);

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 7. Water Shader
    let waterMaterial: THREE.ShaderMaterial | null = null;
    let waterMesh: THREE.Mesh | null = null;
    if (park.water.hasRiver) {
      waterMaterial = createWaterShaderMaterial(SUN_DIR);
      waterMatRef.current = waterMaterial;
      waterMesh = createRiverWaterMesh(waterMaterial);
      scene.add(waterMesh);
    }

    // 8. Trail System
    const trailGroup = createTrailMeshGroup();
    scene.add(trailGroup);

    // 9. Bridge
    const bridgeGroup = createBridgeGroup();
    scene.add(bridgeGroup);

    // 10. Summit Overlook (Bench, Sign, Telescope)
    const overlookGroup = createSummitOverlookGroup();
    scene.add(overlookGroup);
    const teleMesh = overlookGroup.getObjectByName('observationTelescope') as THREE.Group | null;
    telescopeGroupRef.current = teleMesh;

    // 11. Rocks & Boulders
    const rocksGroup = createRocksSystem();
    scene.add(rocksGroup);

    // 12. Forest Floor & Decaying Logs
    const floorDebris = createForestFloorSystem();
    scene.add(floorDebris);

    // 13. Grass Instancing
    const grassSystem = new GrassSystem();
    scene.add(grassSystem.mesh);
    grassSystem.update(park.spawn.x, park.spawn.z, true);

    // 14. Forest Trees & Shrubs
    createForestSystem(scene, WORLD_SETTINGS.worldSize);

    // 15. Wildlife Population
    const wildlife = new WildlifeManager(scene);
    wildlifeRef.current = wildlife;

    // 15b. Task 8: responsible-recreation rules (closed areas, fragile areas, litter)
    const sceneStartMs = performance.now();
    const zones: RangerZone[] = getZonesForPark(park.id);
    scene.add(createZoneMarkersGroup(zones, park));
    const litterSpots: LitterSpot[] = buildLitterSpots(park);
    const litterGroup = createLitterGroup(
      litterSpots,
      progress.getSnapshot().data.litterCollected,
      park.id
    );
    scene.add(litterGroup);
    let sensitiveTimer = 0;
    let sensitiveCooldownUntil = 0;
    let lastStartleTotal = 0;
    let lastStartlePenaltyMs = 0;
    let rangerKey = '';

    // 16. Binoculars Logic
    const binocularSystem = new BinocularsSystem((sighting, isNewSpecies) => {
      setSightingsCount(prev => prev + 1);
      audioManager.playBinocularsClick();
      progress.recordSighting(sighting, park.id, park.name);
    });
    binocularsRef.current = binocularSystem;

    // 17. Floating Motes
    const MOTE_COUNT = 160;
    const MOTE_AREA = 75;
    const moteBase = new Float32Array(MOTE_COUNT * 3);
    const rMote = mulberry32(777);
    for (let i = 0; i < MOTE_COUNT; i++) {
      moteBase[i * 3] = rMote() * 1000;
      moteBase[i * 3 + 1] = rMote() * 4.5;
      moteBase[i * 3 + 2] = rMote() * 1000;
    }

    const makeGlowTexture = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    };

    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTE_COUNT * 3), 3));
    const motes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        map: makeGlowTexture(),
        color: 0xffe9a8,
        size: 0.32,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    motes.frustumCulled = false;
    scene.add(motes);

    const updateMotes = (t: number, px: number, pz: number, groundY: number) => {
      const arr = moteGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < MOTE_COUNT; i++) {
        const bx = moteBase[i * 3] + Math.sin(t * 0.25 + i) * 1.5;
        const bz = moteBase[i * 3 + 2] + Math.cos(t * 0.21 + i * 1.7) * 1.5;
        const dx = ((((bx - px) % MOTE_AREA) + MOTE_AREA) % MOTE_AREA) - MOTE_AREA / 2;
        const dz = ((((bz - pz) % MOTE_AREA) + MOTE_AREA) % MOTE_AREA) - MOTE_AREA / 2;
        arr[i * 3] = px + dx;
        arr[i * 3 + 1] = groundY + 0.4 + moteBase[i * 3 + 1] + Math.sin(t * 0.5 + i * 2.1) * 0.3;
        arr[i * 3 + 2] = pz + dz;
      }
      moteGeo.attributes.position.needsUpdate = true;
    };

    // 18. Pointer Lock & Controls Event Handlers
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      isLockedRef.current = locked;
      setIsCursorLocked(locked);
      onPauseChange(!locked);
      if (locked) {
        audioManager.init();
        if (showGallery) setShowGallery(false);
        if (showJournal) setShowJournal(false);
      }
    };

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onPointerDown = (e: MouseEvent) => {
      if (e.button === 0 && isCameraActiveRef.current && isLockedRef.current) {
        shutterTriggerRef.current = true;
      }
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const p = playerRef.current;
      if (isLookingThroughTelescopeRef.current) {
        if (isLockedRef.current) {
          const sens = mouseSensitivityRef.current * 0.35;
          p.yaw -= e.movementX * sens;
          p.pitch -= e.movementY * sens;
          p.pitch = clamp(p.pitch, -1.35, 0.75);
        } else if (isDragging) {
          const dx = e.clientX - lastMouseX;
          const dy = e.clientY - lastMouseY;
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
          p.yaw -= dx * 0.0035;
          p.pitch -= dy * 0.0035;
          p.pitch = clamp(p.pitch, -1.35, 0.75);
        }
        setPitch(p.pitch);
        setYaw(p.yaw);
        return;
      }

      if (!isLockedRef.current) return;
      const zoomFactor = isBinocularsActiveRef.current
        ? clamp(binocularsFovRef.current / 70, 0.15, 1.0)
        : isCameraActiveRef.current
        ? clamp(cameraFovRef.current / 70, 0.15, 1.0)
        : 1.0;

      p.yaw -= e.movementX * mouseSensitivityRef.current * zoomFactor;
      p.pitch -= e.movementY * mouseSensitivityRef.current * zoomFactor;
      p.pitch = clamp(p.pitch, -1.45, 1.45);
      setPitch(p.pitch);
      setYaw(p.yaw);
    };

    const onWheel = (e: WheelEvent) => {
      if (isLookingThroughTelescopeRef.current) {
        e.preventDefault();
        const delta = e.deltaY * 0.015;
        telescopeFovRef.current = clamp(telescopeFovRef.current + delta, 3.5, 22.0);
        if (cameraRef.current) {
          cameraRef.current.fov = telescopeFovRef.current;
          cameraRef.current.updateProjectionMatrix();
        }
        setTelescopeZoomLevel(Math.round((70 / telescopeFovRef.current) * 10) / 10);
      } else if (isCameraActiveRef.current) {
        e.preventDefault();
        setCameraZoomFov(cameraFovRef.current + e.deltaY * 0.03);
      } else if (isBinocularsActiveRef.current) {
        e.preventDefault();
        const hasED = progress.isOwned('binoculars_ed');
        const minFov = hasED ? 12.0 : 17.5;
        const delta = e.deltaY * 0.015;
        binocularsFovRef.current = clamp(binocularsFovRef.current + delta, minFov, 28.0);
        if (cameraRef.current) {
          cameraRef.current.fov = binocularsFovRef.current;
          cameraRef.current.updateProjectionMatrix();
        }
        setBinocularsZoomLevel(Math.round((70 / binocularsFovRef.current) * 10) / 10);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;

      if (e.code.startsWith('Arrow')) e.preventDefault();
      keysRef.current.add(e.code);

      // Key B: Toggle Field Binoculars
      if (e.code === 'KeyB') {
        toggleBinoculars();
        return;
      }

      // Key V: Toggle Field Camera
      if (e.code === 'KeyV' && isLockedRef.current) {
        toggleCamera();
        return;
      }

      // Key G: Toggle Photo Gallery
      if (e.code === 'KeyG') {
        setShowGallery(prev => !prev);
        if (!showGallery) {
          document.exitPointerLock();
        }
        return;
      }

      // Key J: Toggle Field Journal & Shop
      if (e.code === 'KeyJ') {
        setShowJournal(prev => !prev);
        if (!showJournal) {
          document.exitPointerLock();
        }
        return;
      }

      // Key K: Toggle Handheld Compass (Task 7)
      if (e.code === 'KeyK') {
        toggleCompass();
        return;
      }

      // Key Q: Pick up litter (Task 8)
      if (e.code === 'KeyQ') {
        const spot = nearLitterRef.current;
        if (spot) {
          const entry = progress.collectLitter(park.id, spot.id, spot.label);
          const obj = litterGroup.getObjectByName(`litter:${spot.id}`);
          if (obj) litterGroup.remove(obj);
          nearLitterRef.current = null;
          if (!entry) showToast('Already picked up');
        }
        return;
      }

      // Key X: Drink water from canteen (Task 7)
      if (e.code === 'KeyX') {
        handleDrinkWater();
        return;
      }

      // Key R: Refill water at station (Task 7)
      if (e.code === 'KeyR' && isNearWaterStationRef.current) {
        handleRefillWater();
        return;
      }

      // Shutter on Space or Enter when Camera is raised
      if ((e.code === 'Space' || e.code === 'Enter') && isCameraActiveRef.current && isLockedRef.current) {
        e.preventDefault();
        if (!e.repeat) {
          shutterTriggerRef.current = true;
        }
        return;
      }

      // Key E: Toggle Telescope View
      if (e.code === 'KeyE') {
        if (isLookingThroughTelescopeRef.current || isNearTelescopeRef.current) {
          toggleTelescope();
        }
        return;
      }

      // Escape key: exit telescope, camera, or binoculars
      if (e.code === 'Escape') {
        if (isLookingThroughTelescopeRef.current) {
          e.preventDefault();
          toggleTelescope();
          return;
        }
        if (isCameraActiveRef.current) {
          e.preventDefault();
          toggleCamera();
          return;
        }
        if (isBinocularsActiveRef.current) {
          e.preventDefault();
          toggleBinoculars();
          return;
        }
      }

      // Tab toggles cursor lock so player can freely click any button on screen
      if (e.code === 'Tab') {
        e.preventDefault();
        if (isLockedRef.current) {
          document.exitPointerLock();
          showToast('Mouse Free: Click UI options (Press Tab or click scene to lock)');
        } else {
          renderer.domElement.requestPointerLock();
          showToast('Mouse Locked to Camera');
        }
        return;
      }

      // Hotkey T: Cycle Lighting preset
      if (e.code === 'KeyT') {
        const times: ('day' | 'sunset' | 'dawn' | 'twilight')[] = ['day', 'sunset', 'dawn', 'twilight'];
        const nextIdx = (times.indexOf(timeOfDayRef.current) + 1) % times.length;
        setLightingPreset(times[nextIdx]);
        showToast(`Lighting: ${times[nextIdx].toUpperCase()}`);
      }

      // Hotkeys 1, 2, 3, 4: Teleport to landmarks
      if (e.code === 'Digit1' && park.landmarks[0]) {
        const lm = park.landmarks[0];
        handleTeleport(lm.x, lm.y, lm.z, lm.yaw);
        showToast(`Jumped to ${lm.name}`);
      }
      if (e.code === 'Digit2' && park.landmarks[1]) {
        const lm = park.landmarks[1];
        handleTeleport(lm.x, lm.y, lm.z, lm.yaw);
        showToast(`Jumped to ${lm.name}`);
      }
      if (e.code === 'Digit3' && park.landmarks[2]) {
        const lm = park.landmarks[2];
        handleTeleport(lm.x, lm.y, lm.z, lm.yaw);
        showToast(`Jumped to ${lm.name}`);
      }
      if (e.code === 'Digit4' && park.landmarks[3]) {
        const lm = park.landmarks[3];
        handleTeleport(lm.x, lm.y, lm.z, lm.yaw);
        showToast(`Jumped to ${lm.name}`);
      }

      // Hotkey P: Cycle Park
      if (e.code === 'KeyP') {
        const nextParkId = park.id === 'whispering-valley' ? 'great-smoky-mountains' : 'whispering-valley';
        onSelectPark(nextParkId);
      }

      // Telescope Zoom in/out via + / - keys
      if (isLookingThroughTelescopeRef.current) {
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
          telescopeFovRef.current = Math.max(3.5, telescopeFovRef.current - 1.5);
          if (cameraRef.current) {
            cameraRef.current.fov = telescopeFovRef.current;
            cameraRef.current.updateProjectionMatrix();
          }
          setTelescopeZoomLevel(Math.round((70 / telescopeFovRef.current) * 10) / 10);
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
          telescopeFovRef.current = Math.min(22.0, telescopeFovRef.current + 1.5);
          if (cameraRef.current) {
            cameraRef.current.fov = telescopeFovRef.current;
            cameraRef.current.updateProjectionMatrix();
          }
          setTelescopeZoomLevel(Math.round((70 / telescopeFovRef.current) * 10) / 10);
        }
      }

      if (e.code === 'KeyF') {
        setPhotoMode(prev => !prev);
      }
      if (e.code === 'KeyM') {
        const muted = audioManager.toggleMute();
        setIsMuted(muted);
        showToast(muted ? 'Audio Muted' : 'Audio Unmuted');
      }
      if (e.code === 'KeyH') {
        headBobRef.current = !headBobRef.current;
        showToast(`Head Bob: ${headBobRef.current ? 'ON' : 'OFF'}`);
      }
      if (e.code === 'KeyC') {
        playerRef.current.crouchOffset = playerRef.current.crouchOffset > 0 ? 0 : 0.6;
        showToast(playerRef.current.crouchOffset > 0 ? 'Crouching (Stealth & Stable Camera)' : 'Standing');
      }
      if (e.code === 'BracketLeft') {
        mouseSensitivityRef.current = Math.max(0.0008, mouseSensitivityRef.current * 0.85);
        showToast(`Sensitivity: ${(mouseSensitivityRef.current * 1000).toFixed(1)}`);
      }
      if (e.code === 'BracketRight') {
        mouseSensitivityRef.current = Math.min(0.008, mouseSensitivityRef.current / 0.85);
        showToast(`Sensitivity: ${(mouseSensitivityRef.current * 1000).toFixed(1)}`);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onBlur = () => {
      keysRef.current.clear();
    };

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);

    const onCanvasClick = () => {
      if (!isLockedRef.current) {
        renderer.domElement.requestPointerLock();
      }
    };
    renderer.domElement.addEventListener('click', onCanvasClick);

    // 19. Player Physics & Movement Loop
    let lastTime = performance.now();
    let hudUpdateCounter = 0;
    let evalCounter = 0;
    let landmarkCheckTimer = 0;
    let photoCounter = 0;

    const updatePhysics = (dt: number) => {
      const p = playerRef.current;
      const keys = keysRef.current;

      // Telescope aiming: movement locked in place, 2-axis aiming enabled
      if (isLookingThroughTelescopeRef.current) {
        const turnH =
          (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0) -
          (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0);
        const turnV =
          (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0) -
          (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0);
        p.yaw += turnH * WORLD_SETTINGS.arrowTurnSpeed * 0.45 * dt;
        p.pitch += turnV * WORLD_SETTINGS.arrowTurnSpeed * 0.45 * dt;
        p.pitch = clamp(p.pitch, -1.35, 0.75);
        setPitch(p.pitch);
        setYaw(p.yaw);
        return;
      }

      const fwd =
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const side = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
      const wantsMove = fwd !== 0 || side !== 0;

      const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
      p.yaw += turn * WORLD_SETTINGS.arrowTurnSpeed * dt;

      const sinY = Math.sin(p.yaw);
      const cosY = Math.cos(p.yaw);
      let dirX = -sinY * fwd + cosY * side;
      let dirZ = -cosY * fwd - sinY * side;
      const len = Math.hypot(dirX, dirZ);
      if (len > 0) {
        dirX /= len;
        dirZ /= len;
      }

      const onBridgeNow = isPointOnBridge(p.pos.x, p.pos.z);
      const inRiverNow = isPointInRiver(p.pos.x, p.pos.z);
      const onSummitNow = isPointOnSummitDeck(p.pos.x, p.pos.z);
      const curWaterDepth = inRiverNow ? getWaterDepth(p.pos.x, p.pos.z) : 0;

      // Proximity checks
      const teleX = park.terrain.mountain.x - 2.2;
      const teleZ = park.terrain.mountain.z + 1.8;
      const distToTelescope = Math.hypot(p.pos.x - teleX, p.pos.z - teleZ);
      const nearTele = onSummitNow && distToTelescope < 2.4;
      isNearTelescopeRef.current = nearTele;

      // Potable Water Station check (Task 7): Trailhead or Summit deck
      const distToSpawn = Math.hypot(p.pos.x - park.spawn.x, p.pos.z - park.spawn.z);
      const nearWaterStation = distToSpawn < 8.5 || (onSummitNow && distToTelescope < 6.0);
      isNearWaterStationRef.current = nearWaterStation;

      const sprintHeld = keys.has('ShiftLeft') || keys.has('ShiftRight');
      const sprinting = sprintHeld && wantsMove && !p.exhausted && p.stamina > 0 && !inRiverNow;

      // First-aid kit & electrolytes capability (Task 7): doubles recovery rate
      const hasFirstAid = progress.isOwned('first_aid');
      let regenBoost = hasFirstAid ? 2.0 : 1.0;

      // Dehydration: below 15% hydration you tire faster and recover slower.
      // The rescue whistle (signalling for help) halves the penalty.
      const currentHydration = progress.getSnapshot().data.hydration;
      const isDehydrated = currentHydration < 15;
      const hasWhistle = progress.isOwned('bear_bell_whistle');
      const dehydratedDrain = isDehydrated ? (hasWhistle ? 1.25 : 1.5) : 1.0;
      if (isDehydrated) regenBoost *= hasWhistle ? 0.75 : 0.5;
      if (isDehydrated && !lowWaterWarnedRef.current) {
        lowWaterWarnedRef.current = true;
        showToast('Low on water: you tire faster. Drink [X] or refill at a fountain.');
      } else if (currentHydration >= 30) {
        lowWaterWarnedRef.current = false;
      }

      if (sprinting) {
        p.stamina -= WORLD_SETTINGS.staminaDrain * dehydratedDrain * dt;
        p.regenTimer = WORLD_SETTINGS.staminaRegenDelay;
        if (p.stamina <= 0) {
          p.stamina = 0;
          p.exhausted = true;
        }
      } else {
        p.regenTimer -= dt;
        if (p.regenTimer <= 0) {
          const rate = (wantsMove ? WORLD_SETTINGS.staminaRegen * 0.6 : WORLD_SETTINGS.staminaRegen) * regenBoost;
          p.stamina = Math.min(100, p.stamina + rate * dt);
        }
        if (p.exhausted && p.stamina >= WORLD_SETTINGS.staminaExhaustRecover) {
          p.exhausted = false;
        }
      }

      // Update Hydration Drainage (Task 7)
      progress.updateHydrationDrain(dt, sprinting, wantsMove);

      const gx = (heightAt(p.pos.x + 1, p.pos.z) - heightAt(p.pos.x - 1, p.pos.z)) / 2;
      const gz = (heightAt(p.pos.x, p.pos.z + 1) - heightAt(p.pos.x, p.pos.z - 1)) / 2;
      const slopeAlong = gx * dirX + gz * dirZ;
      const slopeFactor = Math.max(0.5, 1.0 - Math.max(slopeAlong, 0) * 0.75);

      let topSpeed = (sprinting ? WORLD_SETTINGS.sprintSpeed : WORLD_SETTINGS.walkSpeed) * slopeFactor;
      if (inRiverNow) {
        topSpeed = WORLD_SETTINGS.wadeSpeed;
      }
      if (p.crouchOffset > 0) {
        topSpeed *= 0.6;
      }
      if (isBinocularsActiveRef.current) {
        topSpeed *= 0.45;
      } else if (isCameraActiveRef.current) {
        topSpeed *= 0.7;
      }

      const targetX = wantsMove ? dirX * topSpeed : 0;
      const targetZ = wantsMove ? dirZ * topSpeed : 0;
      const ease = 1 - Math.exp(-10 * dt);
      p.vel.x += (targetX - p.vel.x) * ease;
      p.vel.y += (targetZ - p.vel.y) * ease;

      const moveX = p.vel.x * dt;
      const moveZ = p.vel.y * dt;
      p.pos.x += moveX;
      p.pos.z += moveZ;

      const limit = WORLD_SETTINGS.worldSize / 2 - 30;
      p.pos.x = Math.max(-limit, Math.min(limit, p.pos.x));
      p.pos.z = Math.max(-limit, Math.min(limit, p.pos.z));

      pushOutOfTrees(p.pos);
      pushOutOfRocks(p.pos);

      // Task 8: closed areas (hard rule), fragile areas (soft rule), litter pick-up range
      {
        const closedHit = pushOutOfClosedZones(p.pos, zones);
        let zoneNotice: RangerNoticeState['zone'] = null;
        let sensitiveInside: RangerZone | null = null;
        for (const z of zones) {
          const zd = Math.hypot(p.pos.x - z.x, p.pos.z - z.z);
          if (z.kind === 'sensitive' && zd < z.radius) sensitiveInside = z;
          const near = zd < z.radius + (z.kind === 'closed' ? 7 : 5);
          if (near || (closedHit && closedHit.id === z.id)) {
            zoneNotice = { name: z.name, reason: z.reason, kind: z.kind, inside: zd < z.radius };
          }
        }
        if (sensitiveInside) {
          sensitiveTimer += dt;
          if (sensitiveTimer >= 6 && performance.now() > sensitiveCooldownUntil) {
            sensitiveCooldownUntil = performance.now() + 45000;
            sensitiveTimer = 0;
            progress.recordFragileAreaDamage(sensitiveInside.name, sensitiveInside.reason);
          }
        } else {
          sensitiveTimer = 0;
        }
        zoneNoticeRef.current = zoneNotice;

        let nearSpot: LitterSpot | null = null;
        let bestD = 2.6;
        for (const s of litterSpots) {
          if (!litterGroup.getObjectByName(`litter:${s.id}`)) continue;
          const ld = Math.hypot(p.pos.x - s.x, p.pos.z - s.z);
          if (ld < bestD) {
            bestD = ld;
            nearSpot = s;
          }
        }
        nearLitterRef.current = nearSpot;
      }

      const targetGround = getWalkableHeight(p.pos.x, p.pos.z);
      p.groundY += (targetGround - p.groundY) * (1 - Math.exp(-14 * dt));

      const moveDistance = Math.hypot(moveX, moveZ);
      p.distanceSinceStep += moveDistance;
      const stepInterval = sprinting ? 1.7 : 1.25;

      if (p.distanceSinceStep >= stepInterval && wantsMove) {
        p.distanceSinceStep = 0;
        if (inRiverNow) {
          audioManager.playFootstep('water');
        } else if (onBridgeNow || onSummitNow) {
          audioManager.playFootstep('wood');
        } else {
          audioManager.playFootstep('earth');
        }
      }

      const rDist = getRiverDistance(p.pos.x, p.pos.z);
      audioManager.updateRiverProximity(rDist);

      const speed = Math.hypot(p.vel.x, p.vel.y);
      p.bobPhase += speed * dt * 1.7;
      const bob = headBobRef.current ? Math.sin(p.bobPhase) * 0.035 * Math.min(1, speed / WORLD_SETTINGS.walkSpeed) : 0;

      const eyeH = WORLD_SETTINGS.eyeHeight - p.crouchOffset;
      camera.position.set(p.pos.x, p.groundY + eyeH + bob, p.pos.z);
      camera.rotation.set(p.pitch, p.yaw, 0);

      hudUpdateCounter++;
      if (hudUpdateCounter % 4 === 0) {
        setStamina(p.stamina);
        setExhausted(p.exhausted);
        setAltitude(p.groundY);
        setYaw(p.yaw);
        setPitch(p.pitch);
        setPlayerCoord({ x: p.pos.x, z: p.pos.z });
        setIsWading(inRiverNow);
        setWaterDepth(curWaterDepth);
        setIsOnBridge(onBridgeNow);
        setIsOnSummit(onSummitNow);
        setIsNearTelescope(nearTele);
        setIsNearWaterStation(nearWaterStation);
      }
    };

    // Viewport frame calculator for photography
    const getViewportFrame = (): ViewportFrame => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const frameHeight = Math.min(0.78 * h, 0.6 * w);
      return {
        halfW: (PHOTO_RULES.frameAspect * frameHeight) / w,
        halfH: frameHeight / h,
      };
    };

    const photoCaptureCanvas = document.createElement('canvas');

    const capturePhotoFromScreen = (scoreResult: ReturnType<typeof evaluateCurrentFraming>) => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const frameH = Math.min(0.78 * ch, 0.6 * cw);
      const frameW = PHOTO_RULES.frameAspect * frameH;

      const srcCanvas = renderer.domElement;
      const scaleX = srcCanvas.width / cw;
      const scaleY = srcCanvas.height / ch;

      const sx = ((cw - frameW) / 2) * scaleX;
      const sy = ((ch - frameH) / 2) * scaleY;
      const sw = frameW * scaleX;
      const sh = frameH * scaleY;

      const outW = Math.min(960, Math.round(sw));
      const outH = Math.round(outW / PHOTO_RULES.frameAspect);

      photoCaptureCanvas.width = outW;
      photoCaptureCanvas.height = outH;
      const ctx = photoCaptureCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, outW, outH);
      const dataUrl = photoCaptureCanvas.toDataURL('image/jpeg', 0.88);

      const subjectKey = `${park.id}:${scoreResult.kind}:${scoreResult.subjectId}`;
      let bonus = 0;
      let isNew = false;
      const tags = [...scoreResult.tags];

      if (scoreResult.kind === 'wildlife' && scoreResult.responsible && scoreResult.condition === 'calm') {
        if (progress.getPhotoBest(subjectKey) === 0) {
          bonus = PHOTO_RULES.newSubjectBonus;
          isNew = true;
          tags.push({ text: `First sighting photo of this ${scoreResult.detail.toLowerCase()} (+${bonus})`, good: true });
        }
      } else if (scoreResult.kind === 'landmark' && progress.getPhotoBest(subjectKey) === 0) {
        bonus = PHOTO_RULES.newLandmarkBonus;
        isNew = true;
        tags.push({ text: `New landmark registered (+${bonus})`, good: true });
      }

      const finalScore = Math.min(100, scoreResult.score + bonus);
      photoCounter += 1;

      const photo: ScoredPhoto = {
        id: `photo_${Date.now().toString(36)}_${photoCounter}`,
        dataUrl,
        kind: scoreResult.kind,
        subject: scoreResult.subject,
        detail: scoreResult.detail,
        distance: scoreResult.distance,
        score: finalScore,
        grade: finalScore >= 85 ? 'Exceptional' : finalScore >= 70 ? 'Great' : finalScore >= 50 ? 'Good' : 'Fair',
        tags,
        responsible: scoreResult.responsible && scoreResult.condition !== 'alert' && scoreResult.condition !== 'fleeing',
        isNewSubject: isNew,
        parkName: park.name,
        timeOfDay: timeOfDayRef.current,
        zoom: 70 / camera.fov,
        takenAt: Date.now(),
      };

      setPhotos(prev => [photo, ...prev]);
      progress.recordPhoto(photo, park.id, park.name, subjectKey);
      savePhotoToStore(photo);
      setLatestPhoto(photo);
      setFlashKey(k => k + 1);
      audioManager.playShutter();

      if (latestPhotoTimeoutRef.current !== null) {
        window.clearTimeout(latestPhotoTimeoutRef.current);
      }
      latestPhotoTimeoutRef.current = window.setTimeout(() => setLatestPhoto(null), 7000);
    };

    // 20. Main Animation Frame Loop
    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const t = now / 1000;

      updatePhysics(dt);

      if (isLookingThroughTelescopeRef.current) {
        const teleX = park.terrain.mountain.x - 2.2;
        const teleY = park.terrain.mountain.height + 0.12 + 1.54;
        const teleZ = park.terrain.mountain.z + 1.8;
        camera.position.set(teleX, teleY, teleZ);
        camera.rotation.set(playerRef.current.pitch, playerRef.current.yaw, 0);
      } else {
        const p = playerRef.current;
        const eyeH = WORLD_SETTINGS.eyeHeight - p.crouchOffset;
        camera.position.set(p.pos.x, p.groundY + eyeH, p.pos.z);

        // Breathing / handheld micro-drift when using optics
        let driftYaw = 0;
        let driftPitch = 0;
        if (isBinocularsActiveRef.current || isCameraActiveRef.current) {
          const crouchDamp = p.crouchOffset > 0 ? 0.3 : 1.0;
          const moveDamp = Math.hypot(p.vel.x, p.vel.y) > 0.3 ? 2.0 : 1.0;
          const amp = (isBinocularsActiveRef.current ? 0.0022 : 0.0012) * crouchDamp * moveDamp;
          driftYaw = (Math.sin(t * 1.7) + 0.6 * Math.sin(t * 3.1 + 1.3)) * amp;
          driftPitch = (Math.sin(t * 1.3 + 0.7) + 0.6 * Math.sin(t * 2.7)) * amp;
        }
        camera.rotation.set(p.pitch + driftPitch, p.yaw + driftYaw, 0);
      }

      skyMesh.position.copy(camera.position);

      const pPos = playerRef.current.pos;
      const sunCenterStepX = Math.round(pPos.x / 2.0) * 2.0;
      const sunCenterStepZ = Math.round(pPos.z / 2.0) * 2.0;
      sunLight.target.position.set(sunCenterStepX, playerRef.current.groundY, sunCenterStepZ);
      sunLight.position.set(
        sunCenterStepX + SUN_DIR.x * 100,
        playerRef.current.groundY + SUN_DIR.y * 100,
        sunCenterStepZ + SUN_DIR.z * 100
      );

      if (waterMaterial) {
        waterMaterial.uniforms.time.value = t;
      }

      grassSystem.update(pPos.x, pPos.z);
      updateMotes(t, pPos.x, pPos.z, playerRef.current.groundY);
      audioManager.updateAmbientBirds(t);

      // Wildlife tick
      const isSprintingNow =
        (keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight')) &&
        !playerRef.current.exhausted &&
        playerRef.current.stamina > 0;
      const isCrouchingNow = playerRef.current.crouchOffset > 0;

      wildlife.update(
        dt,
        pPos,
        isSprintingNow,
        isCrouchingNow,
        isLookingThroughTelescopeRef.current,
        showToast
      );

      // Task 8: startled wildlife penalty and on-screen notices
      if (wildlife.totalStartles > lastStartleTotal) {
        lastStartleTotal = wildlife.totalStartles;
        const nowMs = performance.now();
        if (nowMs - sceneStartMs > 5000 && nowMs - lastStartlePenaltyMs > 20000) {
          lastStartlePenaltyMs = nowMs;
          progress.recordStartle();
        }
      }
      {
        const ageMs = performance.now() - sceneStartMs;
        const showWildlife =
          !isLookingThroughTelescopeRef.current && wildlife.nearestDist < SAFE_DISTANCE_M && ageMs > 15000;
        const lit = nearLitterRef.current;
        const next: RangerNoticeState = {
          wildlife: showWildlife
            ? {
                dist: wildlife.nearestDist,
                alert: wildlife.nearestState === 'ALERT' || wildlife.nearestState === 'FLEE',
              }
            : null,
          zone: zoneNoticeRef.current,
          litter: lit ? { label: lit.label, tip: lit.tip } : null,
        };
        const zn = next.zone;
        const key = [
          next.wildlife ? `${Math.round(next.wildlife.dist)}${next.wildlife.alert ? 'a' : 'c'}` : '-',
          zn ? `${zn.name}${zn.kind}${zn.inside}` : '-',
          next.litter ? next.litter.label : '-',
        ].join('|');
        if (key !== rangerKey) {
          rangerKey = key;
          setRangerNotice(next);
        }
      }

      camera.updateMatrixWorld(true);

      // Binoculars tick
      const hasED = progress.isOwned('binoculars_ed');
      const target = binocularsRef.current?.update(
        dt,
        camera,
        wildlife.deerList,
        isBinocularsActiveRef.current,
        70 / camera.fov,
        hasED ? 1.55 : 1.0
      );
      if (isBinocularsActiveRef.current) {
        setBinocularTarget(target ? { ...target } : null);
      }

      // Landmark discovery timer
      landmarkCheckTimer += dt;
      if (landmarkCheckTimer > 0.5) {
        landmarkCheckTimer = 0;
        for (const lm of park.landmarks) {
          if (Math.hypot(lm.x - pPos.x, lm.z - pPos.z) < 14) {
            progress.discoverLandmark(park.id, park.name, lm);
          }
        }
      }

      // Camera Framing Evaluation
      let currentFramingScore: ReturnType<typeof evaluateCurrentFraming> | null = null;
      if (isCameraActiveRef.current && !isLookingThroughTelescopeRef.current) {
        const hasTelephoto = progress.isOwned('lens_telephoto');
        currentFramingScore = evaluateCurrentFraming({
          camera,
          frame: getViewportFrame(),
          animals: wildlife.deerList,
          landmarks: park.landmarks,
          timeOfDay: timeOfDayRef.current,
          zoom: 70 / camera.fov,
          moving: Math.hypot(playerRef.current.vel.x, playerRef.current.vel.y) > 0.4,
          braced: playerRef.current.crouchOffset > 0,
          cameraStabilityBonus: hasTelephoto,
        });

        evalCounter++;
        if (evalCounter % 3 === 0) {
          setCameraGuide({
            kind: currentFramingScore.kind,
            subject: currentFramingScore.subject,
            u: currentFramingScore.u,
            v: currentFramingScore.v,
            distance: currentFramingScore.distance,
            condition: currentFramingScore.condition,
            tooClose: currentFramingScore.tooClose,
            hints: currentFramingScore.hints,
          });
        }
      }

      // Shutter Click Trigger
      if (shutterTriggerRef.current) {
        shutterTriggerRef.current = false;
        if (currentFramingScore) {
          capturePhotoFromScreen(currentFramingScore);
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (latestPhotoTimeoutRef.current !== null) {
        window.clearTimeout(latestPhotoTimeoutRef.current);
      }
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [park.id, onPauseChange]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#cfd9c4]">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-pointer" />

      {/* Top Left Progress, Credits & Reputation Badge */}
      {!isCameraActive && !isLookingThroughTelescope && !photoMode && (
        <ProgressBadge
          onOpenJournal={() => {
            setJournalInitialTab('overview');
            setShowJournal(true);
          }}
          onOpenShop={handleOpenShop}
        />
      )}

      {/* Real-time Activity & Reward Toast Notifications */}
      <ActivityToastFeed />

      {/* Camera Viewfinder Overlay (when V is toggled) */}
      {isCameraActive && (
        <CameraViewfinder
          zoom={cameraZoom}
          guide={cameraGuide}
          photoCount={photos.length}
          flashKey={flashKey}
          onShutter={triggerShutter}
          onLower={toggleCamera}
          onOpenGallery={() => setShowGallery(true)}
        />
      )}

      {/* Newly Captured Photograph Pop-up Card */}
      <PhotoResultCard photo={latestPhoto} />

      {/* Task 7 Handheld Orienteering Compass (when equipped & toggled with K) */}
      {isCompassDrawn && (
        <HandheldCompassUI
          currentPark={park}
          yaw={yaw}
          altitude={altitude}
          playerPos={playerCoord}
          onClose={() => setIsCompassDrawn(false)}
        />
      )}

      {/* Field Journal & Ranger Gear Shop Modal */}
      {showJournal && (
        <JournalModal
          park={park}
          photos={photos}
          initialTab={journalInitialTab}
          onClose={() => setShowJournal(false)}
          onExport={progress.exportData}
          onImport={progress.importData}
          onReset={progress.reset}
        />
      )}

      {/* Photo Gallery Modal */}
      {showGallery && (
        <PhotoGalleryModal
          photos={photos}
          onClose={() => setShowGallery(false)}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* Standard HUD Overlay with Task 7 Hydration & Equippable Compass */}
      {!isCameraActive && (
        <HUD
          currentPark={park}
          availableParks={AVAILABLE_PARKS}
          stamina={stamina}
          exhausted={exhausted}
          hydration={progressData.hydration}
          waterLiters={progressData.waterLiters}
          maxWaterLiters={progressData.maxWaterLiters}
          altitude={altitude}
          yaw={yaw}
          pitch={pitch}
          waterDepth={waterDepth}
          isWading={isWading}
          isOnBridge={isOnBridge}
          isOnSummit={isOnSummit}
          isNearTelescope={isNearTelescope}
          isNearWaterStation={isNearWaterStation}
          isLookingThroughTelescope={isLookingThroughTelescope}
          telescopeZoomLevel={telescopeZoomLevel}
          isBinocularsActive={isBinocularsActive}
          binocularsZoomLevel={binocularsZoomLevel}
          binocularTarget={binocularTarget}
          sightingsCount={sightingsCount}
          isMuted={isMuted}
          photoMode={photoMode}
          timeOfDay={timeOfDay}
          isCursorLocked={isCursorLocked}
          isCompassOwned={progress.isOwned('compass_map')}
          isCompassEquipped={isCompassDrawn}
          onToggleTelescope={toggleTelescope}
          onTelescopePan={handleTelescopePan}
          onToggleBinoculars={toggleBinoculars}
          onToggleCamera={toggleCamera}
          onToggleGallery={() => setShowGallery(true)}
          onToggleCompass={toggleCompass}
          onDrinkWater={handleDrinkWater}
          onRefillWater={handleRefillWater}
          onOpenShop={handleOpenShop}
          onToggleCursorLock={() => {
            if (isLockedRef.current) {
              document.exitPointerLock();
            } else if (containerRef.current?.querySelector('canvas')) {
              containerRef.current.querySelector('canvas')!.requestPointerLock();
            }
          }}
          onSelectPark={onSelectPark}
          onToggleMute={() => {
            const muted = audioManager.toggleMute();
            setIsMuted(muted);
            showToast(muted ? 'Audio Muted' : 'Audio Unmuted');
          }}
          onTogglePhotoMode={() => setPhotoMode(prev => !prev)}
          onSelectTimeOfDay={setLightingPreset}
          onTeleport={handleTeleport}
          onToggleHelp={() => setShowHelp(prev => !prev)}
          photoCount={photos.length}
        />
      )}

      {/* Task 8: wildlife distance, closed/fragile area and litter notices */}
      {!photoMode && !isLookingThroughTelescope && <RangerNotices notice={rangerNotice} />}

      {/* Floating Center Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-stone-900/85 backdrop-blur-md text-amber-200 border border-stone-700/60 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl tracking-wide animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Controls & Field Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 text-stone-200 max-w-md w-full rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-amber-200 mb-1">{park.name}</h2>
            <p className="text-xs text-emerald-400 font-semibold mb-2">
              {park.parkServiceUnit} • {park.state}
            </p>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">{park.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-5 bg-stone-950/50 p-3.5 rounded-xl border border-stone-800">
              <div>
                <span className="font-mono text-amber-300 font-semibold">W A S D</span> /{' '}
                <span className="font-mono text-amber-300 font-semibold">Arrows</span>
              </div>
              <div className="text-stone-300">Walk / Turn</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">B</span>
              </div>
              <div className="text-stone-300">Field Binoculars</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">V</span> /{' '}
                <span className="font-mono text-amber-300 font-semibold">Space</span>
              </div>
              <div className="text-stone-300">Camera / Shoot photo</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">K</span>
              </div>
              <div className="text-stone-300">Handheld Compass & Topo Map</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">X</span> /{' '}
                <span className="font-mono text-amber-300 font-semibold">R</span>
              </div>
              <div className="text-stone-300">Drink Water / Refill Canteen</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">Q</span>
              </div>
              <div className="text-stone-300">Pick Up Litter</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">J</span>
              </div>
              <div className="text-stone-300">Field Journal & Gear Shop</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">G</span>
              </div>
              <div className="text-stone-300">Photo Gallery</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">E</span>
              </div>
              <div className="text-stone-300">Summit Telescope</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">C</span>
              </div>
              <div className="text-stone-300">Crouch / Steady shot</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">Tab</span>
              </div>
              <div className="text-stone-300">Free / Lock Mouse Cursor</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">T</span>
              </div>
              <div className="text-stone-300">Cycle Time of Day</div>

              <div>
                <span className="font-mono text-amber-300 font-semibold">1, 2, 3, 4</span>
              </div>
              <div className="text-stone-300">Jump to Landmarks</div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-stone-950 transition cursor-pointer text-sm"
            >
              Resume Exploration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
