import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import * as THREE from "three";
import type { Language } from "../i18n";
import { cityDisplayName, cityPhotoAriaLabel } from "../i18n";
import type { City } from "../domain/story";
import { getMainMapBoundarySegments, getMainMapPolygons } from "../map/chinaGeo";
import { MAP_ORBIT_CONTROLS } from "../map/mapInteraction";
import { MAP_CAMERA, MAP_GROUP_POSITION, MAP_GROUP_ROTATION } from "../map/mapScene";
import { getBoundaryVisualStyle, getProvinceVisualStyle } from "../map/mapStyle";
import { projectLngLatToWorld, projectRingToWorld } from "../map/projection";
import type { ChinaFeatureCollection, LngLat, RenderablePolygon } from "../map/types";

function simplifyRing(ring: LngLat[]) {
  const step = ring.length > 1200 ? 5 : ring.length > 700 ? 4 : ring.length > 360 ? 3 : ring.length > 180 ? 2 : 1;
  const simplified = ring.filter((_, index) => index % step === 0);
  const last = ring[ring.length - 1];

  if (last && simplified[simplified.length - 1] !== last) {
    simplified.push(last);
  }

  return simplified;
}

function polygonToShape(polygon: RenderablePolygon) {
  const projected = projectRingToWorld(simplifyRing(polygon.rings[0]));
  const shape = new THREE.Shape();

  projected.forEach(([x, y], index) => {
    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });
  shape.closePath();
  return shape;
}

function createLineGeometry(
  line: LngLat[],
  z = 0.145,
  gradient?: { colorTop: THREE.Color; colorBottom: THREE.Color; minY: number; maxY: number }
) {
  const points = projectRingToWorld(simplifyRing(line)).map(([x, y]) => new THREE.Vector3(x, y, z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  if (gradient) {
    const colors = [];
    for (let i = 0; i < points.length; i++) {
      const y = points[i].y;
      const t = Math.max(0, Math.min(1, (y - gradient.minY) / (gradient.maxY - gradient.minY || 1)));
      const color = new THREE.Color().lerpColors(gradient.colorTop, gradient.colorBottom, t);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  }

  return geometry;
}

function terrainNoise(x: number, y: number, seed: number) {
  return (
    Math.sin(x * 9.7 + seed * 0.013) * 0.018 +
    Math.cos(y * 11.3 + seed * 0.017) * 0.014 +
    Math.sin((x + y) * 17.1 + seed * 0.009) * 0.009
  );
}

function createTerrainGeometry(shape: THREE.Shape, depth: number, seed: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.036,
    bevelSize: 0.024,
    bevelSegments: 5
  });
  const position = geometry.attributes.position;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const topInfluence = Math.max(0, Math.min(1, (z - depth * 0.42) / (depth * 0.58)));
    const sideBand = Math.max(0, 1 - Math.abs((z / depth) - 0.52) * 2);
    position.setZ(index, z + terrainNoise(x, y, seed) * topInfluence + sideBand * 0.004);
  }

  geometry.computeVertexNormals();
  return geometry;
}

interface ChinaMeshProps {
  mapData: ChinaFeatureCollection;
}

function ChinaMesh({ mapData }: ChinaMeshProps) {
  const shapes = useMemo(
    () =>
      getMainMapPolygons(mapData)
        .filter((polygon) => polygon.rings[0]?.length > 3)
        .map((polygon) => ({
          key: `${polygon.featureName}-${polygon.rings[0][0][0]}-${polygon.rings[0][0][1]}`,
          featureName: polygon.featureName,
          shape: polygonToShape(polygon),
          style: getProvinceVisualStyle(polygon.featureName, polygon.rings[0].length),
          seed: polygon.rings[0].length
        })),
    [mapData]
  );
  const renderShapes = useMemo(
    () =>
      shapes.map((shape) => ({
        ...shape,
        geometry: createTerrainGeometry(shape.shape, shape.style.depth, shape.seed)
      })),
    [shapes]
  );
  const boundaryStyle = useMemo(() => getBoundaryVisualStyle(), []);
  const mainBoundarySegments = useMemo(
    () => getMainMapBoundarySegments(mapData).filter((line) => line.length > 3),
    [mapData]
  );
  const gradientInfo = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    mainBoundarySegments.forEach(line => {
      projectRingToWorld(simplifyRing(line)).forEach(([, y]) => {
        if (y < min) min = y;
        if (y > max) max = y;
      });
    });
    return {
      minY: min,
      maxY: max,
      colorTop: new THREE.Color(boundaryStyle.gradientColorTop),
      colorBottom: new THREE.Color(boundaryStyle.gradientColorBottom)
    };
  }, [mainBoundarySegments, boundaryStyle.gradientColorTop, boundaryStyle.gradientColorBottom]);

  const boundaryGeometries = useMemo(
    () => mainBoundarySegments.map((line) => createLineGeometry(line, boundaryStyle.lineZ, gradientInfo)),
    [boundaryStyle.lineZ, mainBoundarySegments, gradientInfo]
  );
  const glowBoundaryGeometries = useMemo(
    () => mainBoundarySegments.map((line) => createLineGeometry(line, boundaryStyle.glowZ, gradientInfo)),
    [boundaryStyle.glowZ, mainBoundarySegments, gradientInfo]
  );
  const contourGeometries = useMemo(
    () =>
      mainBoundarySegments
        .filter((line, index) => line.length > 42 && index % 3 === 0)
        .map((line) => createLineGeometry(line, boundaryStyle.contourZ, gradientInfo)),
    [boundaryStyle.contourZ, mainBoundarySegments, gradientInfo]
  );
  const outerGlowGeometries = useMemo(
    () =>
      mainBoundarySegments
        .filter((line) => line.length > 48)
        .map((line) => createLineGeometry(line, boundaryStyle.lineZ + 0.002, gradientInfo)),
    [boundaryStyle.lineZ, mainBoundarySegments, gradientInfo]
  );
  const strataBoundaryGeometries = useMemo(
    () =>
      [0.072, 0.128, 0.184].flatMap((z) =>
        mainBoundarySegments
          .filter((line) => line.length > 24)
          .map((line) => createLineGeometry(line, z))
      ),
    [mainBoundarySegments]
  );
  const boundaryMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        vertexColors: true,
        transparent: true,
        opacity: boundaryStyle.lineOpacity,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      }),
    [boundaryStyle.lineOpacity]
  );
  const glowBoundaryMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        vertexColors: true,
        transparent: true,
        opacity: boundaryStyle.glowOpacity,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      }),
    [boundaryStyle.glowOpacity]
  );
  const contourMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        vertexColors: true,
        transparent: true,
        opacity: boundaryStyle.contourOpacity,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      }),
    [boundaryStyle.contourOpacity]
  );
  const outerGlowMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        vertexColors: true,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      }),
    []
  );
  const strataMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#d28136",
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
    []
  );

  return (
    <>
      <group
        rotation={[MAP_GROUP_ROTATION.x, MAP_GROUP_ROTATION.y, MAP_GROUP_ROTATION.z]}
        position={[MAP_GROUP_POSITION.x, MAP_GROUP_POSITION.y, MAP_GROUP_POSITION.z]}
      >
        {renderShapes.map(({ key, geometry, style }, index) => (
          <mesh key={key} position={[0, 0, index * 0.0008]}>
            <primitive object={geometry} attach="geometry" />
            <meshPhysicalMaterial
              clearcoat={0.24}
              clearcoatRoughness={0.52}
              color={style.color}
              emissive={style.emissive}
              emissiveIntensity={style.emissiveIntensity}
              metalness={style.metalness}
              roughness={style.roughness}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {shapes.slice(0, 120).map(({ key, shape, style }, index) => (
          <mesh key={`highlight-${key}`} position={[0, 0, boundaryStyle.lineZ - 0.01 + index * 0.00018]}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial
              color={style.highlightColor}
              transparent
              opacity={boundaryStyle.highlightOpacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {shapes
          .filter(({ featureName }) => ["四川省", "云南省"].includes(featureName))
          .map(({ key, shape }, index) => (
            <mesh key={`aqua-${key}`} position={[0, 0, boundaryStyle.aquaZ + index * 0.0005]}>
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial
                color={boundaryStyle.aquaColor}
                transparent
                opacity={boundaryStyle.aquaOpacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
        ))}
        {strataBoundaryGeometries.map((geometry, index) => (
          <primitive key={`strata-${index}`} object={new THREE.Line(geometry, strataMaterial)} />
        ))}
        {boundaryGeometries.map((geometry, index) => (
          <primitive key={`boundary-${index}`} object={new THREE.Line(geometry, boundaryMaterial)} />
        ))}
        {glowBoundaryGeometries.map((geometry, index) => (
          <primitive key={`boundary-glow-${index}`} object={new THREE.Line(geometry, glowBoundaryMaterial)} />
        ))}
        {contourGeometries.map((geometry, index) => (
          <primitive key={`terrain-contour-${index}`} object={new THREE.Line(geometry, contourMaterial)} />
        ))}
        {outerGlowGeometries.map((geometry, index) => (
          <primitive key={`outer-glow-${index}`} object={new THREE.Line(geometry, outerGlowMaterial)} />
        ))}
      </group>
      <group
        rotation={[MAP_GROUP_ROTATION.x, MAP_GROUP_ROTATION.y, MAP_GROUP_ROTATION.z]}
        position={[0.12, -0.3, -0.26]}
      >
        {shapes.slice(0, 90).map(({ key, shape }) => (
          <mesh key={`shadow-${key}`}>
            <extrudeGeometry args={[shape, { depth: 0.04, bevelEnabled: false }]} />
            <meshStandardMaterial color="#03080c" roughness={0.82} metalness={0.24} transparent opacity={0.48} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </>
  );
}

interface CityHotspot3DItemProps {
  city: City;
  language: Language;
  isActive: boolean;
  onCitySelect?: (city: City) => void;
}

function CityHotspot3DItem({ city, language, isActive, onCitySelect }: CityHotspot3DItemProps) {
  const point = useMemo(() => projectLngLatToWorld(city.lng, city.lat), [city.lng, city.lat]);

  const pointWorld = useMemo(() => {
    const local = new THREE.Vector3(point.x, point.y, 0.32);
    const euler = new THREE.Euler(MAP_GROUP_ROTATION.x, MAP_GROUP_ROTATION.y, MAP_GROUP_ROTATION.z);
    local.applyEuler(euler);
    local.add(new THREE.Vector3(MAP_GROUP_POSITION.x, MAP_GROUP_POSITION.y, MAP_GROUP_POSITION.z));
    return local;
  }, [point]);

  const lineMeshRef = useRef<THREE.Mesh>(null);
  const waveRingRef = useRef<THREE.Mesh>(null);
  const topGroupRef = useRef<THREE.Group>(null);

  const currentHeightRef = useRef(0.45);
  const colorActive = useMemo(() => new THREE.Color("#00e5ff"), []);
  const colorInactive = useMemo(() => new THREE.Color("#0088aa"), []);

  useFrame(({ clock }) => {
    const targetHeight = isActive ? 0.85 : 0.45;

    currentHeightRef.current += (targetHeight - currentHeightRef.current) * 0.12;
    const h = currentHeightRef.current;

    if (lineMeshRef.current) {
      lineMeshRef.current.scale.set(1, h, 1);
      lineMeshRef.current.position.set(0, h / 2, 0);

      const mat = lineMeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.lerp(isActive ? colorActive : colorInactive, 0.15);
        mat.opacity = isActive ? 0.95 : 0.7;
      }
    }

    if (topGroupRef.current) {
      topGroupRef.current.position.set(0, h, 0);
    }

    if (waveRingRef.current) {
      const elapsed = clock.getElapsedTime();
      const cycle = (elapsed * 0.5) % 1.0;
      const scale = 0.1 + cycle * 2.5;
      waveRingRef.current.scale.set(scale, scale, 1);

      const mat = waveRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1 - cycle) * 0.65 * (isActive ? 1.0 : 0.5);
      }
    }
  });

  return (
    <group position={[pointWorld.x, pointWorld.y, pointWorld.z]}>
      {/* 底部发光圆环 (Base Ring) */}
      <mesh
        rotation={[MAP_GROUP_ROTATION.x, MAP_GROUP_ROTATION.y, MAP_GROUP_ROTATION.z]}
      >
        <ringGeometry args={[0.08, 0.14, 32]} />
        <meshBasicMaterial
          color={isActive ? "#00e5ff" : "#0088aa"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 波纹环 (Wave Ring) */}
      <mesh
        ref={waveRingRef}
        rotation={[MAP_GROUP_ROTATION.x, MAP_GROUP_ROTATION.y, MAP_GROUP_ROTATION.z]}
      >
        <ringGeometry args={[0.04, 0.16, 32]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 接地点小球 (Sphere) */}
      <mesh>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshBasicMaterial
          color={isActive ? "#00e5ff" : "#0088aa"}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* 极细垂直发光指引线 (Thin Vertical Line) */}
      <mesh ref={lineMeshRef}>
        <cylinderGeometry args={[0.008, 0.008, 1, 8]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <group ref={topGroupRef}>
        <Html
          center
          distanceFactor={7.8}
          zIndexRange={[18, 4]}
        >
          <button
            className={isActive ? "city-hotspot city-hotspot--webgl city-hotspot--active" : "city-hotspot city-hotspot--webgl"}
            type="button"
            aria-label={cityPhotoAriaLabel(city, language)}
            onClick={(event) => {
              event.stopPropagation();
              onCitySelect?.(city);
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <span className="hotspot-label hotspot-label--webgl">{cityDisplayName(city, language)}</span>
          </button>
        </Html>
      </group>
    </group>
  );
}

interface CityHotspots3DProps {
  cities: City[];
  language: Language;
  onCitySelect?: (city: City) => void;
  selectedCityId?: string;
}

function CityHotspots3D({ cities, language, onCitySelect, selectedCityId }: CityHotspots3DProps) {
  return (
    <group>
      {cities.map((city) => (
        <CityHotspot3DItem
          key={city.id}
          city={city}
          language={language}
          isActive={city.id === selectedCityId}
          onCitySelect={onCitySelect}
        />
      ))}
    </group>
  );
}

interface ChinaMapCanvasProps {
  mapData: ChinaFeatureCollection;
  cities?: City[];
  language?: Language;
  onReady?: () => void;
  onCitySelect?: (city: City) => void;
  selectedCityId?: string;
}

export function ChinaMapCanvas({ mapData, cities = [], language = "zh", onReady, onCitySelect, selectedCityId }: ChinaMapCanvasProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const cameraZ = isMobile ? 9.5 : MAP_ORBIT_CONTROLS.defaultCameraPosition[2];
  const maxDistance = isMobile ? 12.0 : MAP_ORBIT_CONTROLS.maxDistance;
  const defaultPosition: [number, number, number] = [
    MAP_ORBIT_CONTROLS.defaultCameraPosition[0],
    MAP_ORBIT_CONTROLS.defaultCameraPosition[1],
    cameraZ
  ];

  return (
    <div className="webgl-map">
      <Canvas
        camera={{ position: defaultPosition, fov: MAP_CAMERA.fov }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 1.8]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color("#000000"), 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.32;
          scene.background = null;
          scene.fog = new THREE.FogExp2("#02080c", 0.045);
          onReady?.();
        }}
      >
        <ambientLight intensity={0.36} />
        <hemisphereLight args={["#405766", "#02070a", 1.15]} />
        <directionalLight position={[2.9, 4.9, 5.8]} intensity={3.25} color="#ffd29a" />
        <directionalLight position={[-4.8, -1.8, 4.2]} intensity={1.55} color="#48d7ff" />
        <directionalLight position={[-5.5, 2.8, 3.6]} intensity={1.35} color="#ffc46f" />
        <pointLight position={[-3.4, 1.6, 3.1]} intensity={2.1} color="#32e6ff" />
        <pointLight position={[2.8, -1.8, 3.2]} intensity={2.35} color="#ff9f35" />
        <pointLight position={[0.2, 0.1, 2.7]} intensity={1.55} color="#ffc46f" />
        <ChinaMesh mapData={mapData} />
        <CityHotspots3D cities={cities} language={language} onCitySelect={onCitySelect} selectedCityId={selectedCityId} />
        <Sparkles count={150} speed={0.18} opacity={0.7} size={1.28} scale={[7.2, 3.4, 1.2]} color="#ffbd6b" />
        <Sparkles count={38} speed={0.12} opacity={0.42} size={2.2} scale={[3.4, 1.8, 0.8]} color="#32e6ff" />
        <OrbitControls
          enableDamping
          enablePan={MAP_ORBIT_CONTROLS.enablePan}
          enableZoom={MAP_ORBIT_CONTROLS.enableZoom}
          dampingFactor={MAP_ORBIT_CONTROLS.dampingFactor}
          maxAzimuthAngle={MAP_ORBIT_CONTROLS.maxAzimuthAngle}
          maxDistance={maxDistance}
          maxPolarAngle={MAP_ORBIT_CONTROLS.maxPolarAngle}
          minAzimuthAngle={MAP_ORBIT_CONTROLS.minAzimuthAngle}
          minDistance={MAP_ORBIT_CONTROLS.minDistance}
          minPolarAngle={MAP_ORBIT_CONTROLS.minPolarAngle}
          rotateSpeed={MAP_ORBIT_CONTROLS.rotateSpeed}
          target={MAP_ORBIT_CONTROLS.target}
          zoomSpeed={MAP_ORBIT_CONTROLS.zoomSpeed}
        />
      </Canvas>
    </div>
  );
}
