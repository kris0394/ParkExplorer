/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { getRiverCenterX, getRiverWaterY } from '../terrain/riverTerrain.ts';
import { getActivePark } from '../data/parks.ts';

export function createWaterShaderMaterial(sunDir: THREE.Vector3): THREE.ShaderMaterial {
  const park = getActivePark();
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      sunDir: { value: sunDir.clone().normalize() },
      deepWaterColor: { value: new THREE.Color(park.water.deepColor) },
      shallowWaterColor: { value: new THREE.Color(park.water.shallowColor) },
      skyReflectColor: { value: new THREE.Color(park.water.skyReflectColor) },
      sunColor: { value: new THREE.Color(0xfff0c8) },
      foamColor: { value: new THREE.Color(0xedf8f0) },
      fogColor: { value: new THREE.Color(park.atmosphere.fogColor) },
      fogDensity: { value: park.atmosphere.fogDensity },
    },
    vertexShader: `
      uniform float time;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Gentle undulating wave displacement
        float wave1 = sin(pos.x * 0.45 + pos.z * 0.25 + time * 1.6) * 0.045;
        float wave2 = cos(pos.z * 0.65 - pos.x * 0.35 + time * 2.1) * 0.035;
        pos.y += wave1 + wave2;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;

        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 sunDir;
      uniform vec3 deepWaterColor;
      uniform vec3 shallowWaterColor;
      uniform vec3 skyReflectColor;
      uniform vec3 sunColor;
      uniform vec3 foamColor;

      varying vec3 vWorldPosition;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      // Fast analytical ripple normal perturbation
      vec3 computeWaveNormal(vec3 worldPos, float t) {
        float f1 = sin(worldPos.z * 0.95 + t * 2.4 + worldPos.x * 0.5) * 0.18;
        float f2 = cos(worldPos.x * 1.35 - t * 1.9 + worldPos.z * 0.7) * 0.16;
        float f3 = sin((worldPos.x + worldPos.z) * 2.2 + t * 3.2) * 0.11;
        float f4 = cos((worldPos.z - worldPos.x) * 3.8 + t * 4.1) * 0.07;
        
        vec3 n = vec3(f1 + f3, 1.0, f2 + f4);
        return normalize(n);
      }

      void main() {
        vec3 V = normalize(cameraPosition - vWorldPosition);
        vec3 N = computeWaveNormal(vWorldPosition, time);
        vec3 L = normalize(sunDir);
        vec3 H = normalize(L + V);

        // Shoreline proximity (vUv.x: 0 at west bank, 0.5 center, 1.0 east bank)
        float bankDist = abs(vUv.x - 0.5) * 2.0;

        // Fresnel reflection
        float NdotV = max(dot(N, V), 0.0);
        float fresnel = clamp(0.12 + 0.88 * pow(1.0 - NdotV, 3.5), 0.0, 1.0);

        // Water body color: deeper in middle, clearer turquoise at edges
        vec3 waterCol = mix(deepWaterColor, shallowWaterColor, pow(bankDist, 1.8));

        // Specular glint
        float NdotH = max(dot(N, H), 0.0);
        float specular = pow(NdotH, 96.0) * 1.6;
        // Fine glitter sparkles on water facets
        float glitter = pow(max(dot(N, H), 0.0), 24.0) * 0.35 * (sin(vWorldPosition.z * 10.0 + time * 5.0) * 0.5 + 0.5);

        // Surface reflection mixing
        vec3 surfaceCol = mix(waterCol, skyReflectColor, fresnel * 0.75);
        surfaceCol += (specular + glitter) * sunColor;

        // Shore foam / froth
        float foamNoise = sin(vWorldPosition.z * 4.2 + time * 1.8) * cos(vWorldPosition.x * 3.1 - time * 1.4);
        float foamThreshold = 0.76 + foamNoise * 0.08;
        float foamFactor = smoothstep(foamThreshold, 0.99, bankDist);
        vec3 finalCol = mix(surfaceCol, foamColor, foamFactor * 0.72);

        // Transparency: slightly translucent in shallows
        float alpha = clamp(0.90 + foamFactor * 0.1, 0.82, 0.98);
        gl_FragColor = vec4(finalCol, alpha);

        // Shading order & color space handling:
        // 1. Tone mapping converts HDR lighting
        // 2. Color space transforms to sRGB
        // 3. Fog blends in display space to match environment fog seamlessly
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Builds the curved ribbon geometry for the river surface.
 */
export function createRiverWaterMesh(material: THREE.ShaderMaterial): THREE.Mesh {
  const zMin = -280;
  const zMax = 280;
  const zSegments = 240;
  const xSegments = 8;
  const riverWidth = getActivePark().water.halfWidth * 2.15; // slightly wider than halfwidth to overlap bank waterline

  const vertexCount = (zSegments + 1) * (xSegments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  let idx = 0;
  let uvIdx = 0;

  for (let j = 0; j <= zSegments; j++) {
    const tz = j / zSegments;
    const z = zMin + tz * (zMax - zMin);
    const centerX = getRiverCenterX(z);
    const waterY = getRiverWaterY(z);

    for (let i = 0; i <= xSegments; i++) {
      const tx = i / xSegments; // 0 to 1
      const xOffset = (tx - 0.5) * riverWidth;
      const x = centerX + xOffset;

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = waterY;
      positions[idx * 3 + 2] = z;

      uvs[uvIdx * 2] = tx;
      uvs[uvIdx * 2 + 1] = tz * 30.0; // repeated along river length

      idx++;
      uvIdx++;
    }
  }

  for (let j = 0; j < zSegments; j++) {
    for (let i = 0; i < xSegments; i++) {
      const a = j * (xSegments + 1) + i;
      const b = (j + 1) * (xSegments + 1) + i;
      const c = (j + 1) * (xSegments + 1) + (i + 1);
      const d = j * (xSegments + 1) + (i + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 1;
  mesh.receiveShadow = true;
  return mesh;
}
