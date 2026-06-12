import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { ChevronLeft, ChevronRight, MapPin, RotateCcw, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { isWebGLAvailable } from "../utils/webgl";
import type { Language } from "../i18n";
import { cityDialogLabel, cityDisplayName, cityPhotoAriaLabel, translations } from "../i18n";
import { loadChinaMapData } from "../map/chinaMapData";
import { projectCityToStagePercent, projectCityToWebglStagePercent } from "../map/projection";
import type { ChinaFeatureCollection } from "../map/types";
import { getCitiesWithPhotos, getPhotosForCity, type City, type Photo, type Story } from "../domain/story";
import { FOCUS_STORY_CITY_EVENT, getFocusStoryCityDetail } from "../events/storyViewerEvents";
import { LanguageToggle } from "./LanguageToggle";

const ChinaMapCanvas = lazy(() =>
  import("./ChinaMapCanvas").then((module) => ({ default: module.ChinaMapCanvas }))
);
import { ChinaMapFallback } from "./ChinaMapFallback";

const SWIPE_THRESHOLD = 56;
const MAX_SWIPE_DRAG = 180;
const CAROUSEL_DRAG_DISTANCE = 260;
const MAP_SILHOUETTE_URL = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/maps/china-silhouette.svg`;

type GsapDefault = typeof import("gsap")["default"];
let gsapPromise: Promise<GsapDefault> | undefined;

function loadGsap() {
  gsapPromise ??= import("gsap").then((module) => module.default);
  return gsapPromise;
}

function getCarouselPosition(index: number, activeIndex: number, length: number) {
  let position = index - activeIndex;
  const half = length / 2;

  if (position > half) {
    position -= length;
  } else if (position < -half) {
    position += length;
  }

  return position;
}

interface StoryViewerProps {
  story: Story;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  editorCollapsed?: boolean;
  onToggleEditor?: () => void;
}

export function StoryViewer({
  story,
  language,
  onLanguageChange,
  editorCollapsed,
  onToggleEditor
}: StoryViewerProps) {
  const stageRef = useRef<HTMLElement>(null);
  const mapSceneRef = useRef<HTMLDivElement>(null);
  const theaterRef = useRef<HTMLDivElement>(null);
  const [localLanguage, setLocalLanguage] = useState<Language>("en");
  const cities = useMemo(() => getCitiesWithPhotos(story), [story]);
  const [selectedCity, setSelectedCity] = useState<City | undefined>();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoDrag, setPhotoDrag] = useState({ active: false, offsetX: 0 });
  const [canRenderWebGL, setCanRenderWebGL] = useState(false);
  const [lowMapData, setLowMapData] = useState<ChinaFeatureCollection | undefined>();
  const [highMapData, setHighMapData] = useState<ChinaFeatureCollection | undefined>();
  const [isWebGLReady, setIsWebGLReady] = useState(false);
  const [mapAspect, setMapAspect] = useState(1.25);
  const dragStartXRef = useRef<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeLanguage = language ?? localLanguage;
  const setActiveLanguage = onLanguageChange ?? setLocalLanguage;
  const copy = translations[activeLanguage];

  const selectedPhotos = useMemo<Photo[]>(
    () => (selectedCity ? getPhotosForCity(story, selectedCity.id) : []),
    [selectedCity, story]
  );
  const currentPhoto = selectedPhotos[photoIndex] ?? selectedPhotos[0];
  const selectedCityPoint = selectedCity
    ? isWebGLReady
      ? projectCityToWebglStagePercent(selectedCity, mapAspect)
      : projectCityToStagePercent(selectedCity)
    : undefined;
  const shouldShowLightweightMap = !isWebGLReady;
  const shouldShowDomHotspots = !isWebGLReady;
  const focusStyle = useMemo(() => {
    if (!selectedCityPoint) {
      return {};
    }

    return {
      "--focus-x": `${selectedCityPoint.x.toFixed(2)}%`,
      "--focus-y": `${selectedCityPoint.y.toFixed(2)}%`,
      "--focus-shift-x": `${((50 - selectedCityPoint.x) * 0.18).toFixed(2)}%`,
      "--focus-shift-y": `${((50 - selectedCityPoint.y) * 0.16).toFixed(2)}%`
    } as CSSProperties;
  }, [selectedCityPoint?.x, selectedCityPoint?.y]);

  useEffect(() => {
    setCanRenderWebGL(isWebGLAvailable());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadChinaMapData("low")
      .then((mapData) => {
        if (!cancelled) {
          setLowMapData(mapData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLowMapData(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canRenderWebGL) {
      setHighMapData(undefined);
      setIsWebGLReady(false);
      return;
    }

    let cancelled = false;
    setIsWebGLReady(false);

    void loadChinaMapData("high")
      .then((mapData) => {
        if (!cancelled) {
          setHighMapData(mapData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHighMapData(undefined);
          setIsWebGLReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canRenderWebGL]);

  useEffect(() => {
    function onFocusStoryCity(event: Event) {
      const detail = getFocusStoryCityDetail(event);
      if (!detail) {
        return;
      }

      const city = cities.find((candidate) => candidate.id === detail.cityId);
      if (city) {
        setSelectedCity(city);
      }
    }

    window.addEventListener(FOCUS_STORY_CITY_EVENT, onFocusStoryCity);
    return () => window.removeEventListener(FOCUS_STORY_CITY_EVENT, onFocusStoryCity);
  }, [cities]);

  useLayoutEffect(() => {
    const updateAspect = () => {
      const rect = mapSceneRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect.height) {
        return;
      }

      setMapAspect(rect.width / rect.height);
    };

    updateAspect();

    if (typeof ResizeObserver === "undefined" || !mapSceneRef.current) {
      return;
    }

    const observer = new ResizeObserver(updateAspect);
    observer.observe(mapSceneRef.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!stageRef.current) {
      return;
    }

    const mapScene = stageRef.current.querySelector(".map-scene");
    let cancelled = false;

    void loadGsap().then((gsap) => {
      if (cancelled || !mapScene) {
        return;
      }

      gsap.fromTo(
        mapScene,
        { opacity: 0 },
        { opacity: 1, duration: 2.8, ease: "power3.out", clearProps: "opacity" }
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!theaterRef.current) {
      return;
    }

    const theater = theaterRef.current;
    let cancelled = false;

    void loadGsap().then((gsap) => {
      if (cancelled) {
        return;
      }

      gsap.fromTo(
        theater,
        { opacity: 0, y: 34, scale: 0.94, rotateX: -8 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.7, ease: "power3.out" }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCity?.id]);

  useEffect(() => {
    setPhotoIndex(0);
    setPhotoDrag({ active: false, offsetX: 0 });
    dragStartXRef.current = undefined;
  }, [selectedCity?.id]);

  const changePhoto = useCallback(
    (direction: 1 | -1) => {
      if (selectedPhotos.length < 2) {
        return;
      }

      setPhotoIndex((index) => (index + direction + selectedPhotos.length) % selectedPhotos.length);
    },
    [selectedPhotos.length]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!selectedCity || selectedPhotos.length === 0) {
        return;
      }

      if (event.key === "ArrowRight") {
        changePhoto(1);
      }

      if (event.key === "ArrowLeft") {
        changePhoto(-1);
      }

      if (event.key === "Escape") {
        setSelectedCity(undefined);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changePhoto, selectedCity, selectedPhotos.length]);

  const goToNext = () => {
    changePhoto(1);
  };

  const goToPrevious = () => {
    changePhoto(-1);
  };

  const beginPhotoDrag = (clientX: number) => {
    if (selectedPhotos.length < 2) {
      return;
    }

    dragStartXRef.current = clientX;
    setPhotoDrag({ active: true, offsetX: 0 });
  };

  const updatePhotoDrag = (clientX: number) => {
    if (dragStartXRef.current === undefined) {
      return;
    }

    const rawOffset = clientX - dragStartXRef.current;
    const offsetX = Math.max(-MAX_SWIPE_DRAG, Math.min(MAX_SWIPE_DRAG, rawOffset));
    setPhotoDrag({ active: true, offsetX });
  };

  const finishPhotoDrag = (clientX: number) => {
    if (dragStartXRef.current === undefined) {
      return;
    }

    const offsetX = clientX - dragStartXRef.current;

    if (Math.abs(offsetX) >= SWIPE_THRESHOLD) {
      changePhoto(offsetX < 0 ? 1 : -1);
    }

    dragStartXRef.current = undefined;
    setPhotoDrag({ active: false, offsetX: 0 });
  };

  const endPhotoDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finishPhotoDrag(event.clientX);
  };

  const endMousePhotoDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    finishPhotoDrag(event.clientX);
  };

  const carouselDragProgress = photoDrag.offsetX / CAROUSEL_DRAG_DISTANCE;

  return (
    <section ref={stageRef} className={`story-stage ${selectedCity ? "story-stage--focused" : ""}`} aria-label={copy.viewer.ariaLabel}>
      <div className="aurora aurora--left" />
      <div className="aurora aurora--right" />

      <header className="stage-header">
        <div>
          <p className="eyebrow">{copy.viewer.eyebrow}</p>
        </div>
        <div className="stage-header__actions">
          <LanguageToggle language={activeLanguage} onLanguageChange={setActiveLanguage} />
          {!selectedCity ? (
            <button className="ghost-button" type="button" onClick={() => setSelectedCity(undefined)}>
              <RotateCcw aria-hidden="true" size={18} />
              {copy.viewer.resetView}
            </button>
          ) : null}
          {onToggleEditor && (
            <button
              className="ghost-button"
              type="button"
              aria-label={editorCollapsed ? translations[activeLanguage].app.showEditor : translations[activeLanguage].app.hideEditor}
              title={editorCollapsed ? translations[activeLanguage].app.showEditor : translations[activeLanguage].app.hideEditor}
              onClick={onToggleEditor}
            >
              {editorCollapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}
              {editorCollapsed ? translations[activeLanguage].app.showEditor : translations[activeLanguage].app.hideEditor}
            </button>
          )}
        </div>
      </header>

      <div
        ref={mapSceneRef}
        className={`map-scene ${canRenderWebGL ? "map-scene--webgl" : ""}`}
        style={focusStyle}
        aria-hidden={Boolean(selectedCity)}
      >
        {!isWebGLReady && (
          lowMapData ? (
            <ChinaMapFallback mapData={lowMapData} />
          ) : (
            <img
              src={MAP_SILHOUETTE_URL}
              role="img"
              aria-label="China map silhouette"
              className="fallback-china-map"
              style={{
                pointerEvents: "none"
              }}
            />
          )
        )}
        {canRenderWebGL && highMapData && (
          <Suspense fallback={null}>
            <ChinaMapCanvas
              mapData={highMapData}
              cities={cities}
              language={activeLanguage}
              onReady={() => setIsWebGLReady(true)}
              onCitySelect={setSelectedCity}
              selectedCityId={selectedCity?.id}
            />
          </Suspense>
        )}
        {(!canRenderWebGL || !isWebGLReady) ? cities.map((city, index) => {
          const point = canRenderWebGL
            ? projectCityToWebglStagePercent(city, mapAspect)
            : projectCityToStagePercent(city);
          const hotspotStyle = {
            left: `${point.x}%`,
            top: `${point.y}%`,
            animationDelay: `${index * 0.18 + 1.1}s`,
            "--label-y": `${index % 3 === 0 ? -16 : index % 3 === 1 ? 16 : 0}px`
          } as CSSProperties;

          return (
            <button
              className={city.id === selectedCity?.id ? "city-hotspot city-hotspot--active" : "city-hotspot"}
              key={city.id}
              style={hotspotStyle}
              type="button"
              aria-label={cityPhotoAriaLabel(city, activeLanguage)}
              onClick={() => setSelectedCity(city)}
            >
              <span className="hotspot-core" />
              <span className="hotspot-label">{cityDisplayName(city, activeLanguage)}</span>
            </button>
          );
        }) : null}
      </div>

      <aside className="city-rail" aria-label={copy.viewer.citiesWithPhotos}>
        {cities.map((city) => (
          <button
            key={city.id}
            className={city.id === selectedCity?.id ? "city-pill city-pill--active" : "city-pill"}
            type="button"
            onClick={() => setSelectedCity(city)}
          >
            <MapPin aria-hidden="true" size={14} />
            {cityDisplayName(city, activeLanguage)}
          </button>
        ))}
      </aside>

      {selectedCity && currentPhoto ? (
        <div ref={theaterRef} className="photo-theater" style={focusStyle} role="dialog" aria-label={cityDialogLabel(selectedCity, activeLanguage)}>
          <button className="close-theater" type="button" aria-label={copy.viewer.backToMap} onClick={() => setSelectedCity(undefined)}>
            <X aria-hidden="true" size={18} />
          </button>
          <div className="photo-beam" />
          <div
            className={photoDrag.active ? "photo-stack photo-carousel photo-carousel--dragging" : "photo-stack photo-carousel"}
            data-active-index={photoIndex}
            onMouseDown={(event) => beginPhotoDrag(event.clientX)}
            onMouseLeave={(event) => {
              if (photoDrag.active) {
                endMousePhotoDrag(event);
              }
            }}
            onMouseMove={(event) => updatePhotoDrag(event.clientX)}
            onMouseUp={endMousePhotoDrag}
            onPointerCancel={endPhotoDrag}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture?.(event.pointerId);
              beginPhotoDrag(event.clientX);
            }}
            onPointerMove={(event) => updatePhotoDrag(event.clientX)}
            onPointerUp={endPhotoDrag}
          >
            {selectedPhotos.map((photo, index) => {
              const basePosition = getCarouselPosition(index, photoIndex, selectedPhotos.length);
              const position = basePosition + carouselDragProgress;
              const distance = Math.abs(position);
              const isActive = index === photoIndex;
              const x = position * (isMobile ? 160 : 300);
              const y = Math.min(distance, 2) * 32;
              const z = (isMobile ? 60 : 120) - Math.min(distance, 2.5) * (isMobile ? 160 : 260);
              const rotateY = position * (isMobile ? 32 : 45);
              const scale = Math.max(isMobile ? 0.45 : 0.55, 1 - distance * 0.22);
              const opacity = Math.max(0, 1 - Math.max(0, distance - 1.1) * 0.8);
              const cardStyle = {
                zIndex: Math.round(50 - distance * 10),
                opacity,
                pointerEvents: distance > 1.6 ? "none" : "auto",
                transformStyle: "preserve-3d",
                transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                transition: photoDrag.active
                  ? "none"
                  : "transform 380ms cubic-bezier(0.25, 1, 0.5, 1), opacity 380ms ease"
              } as CSSProperties;

              return (
                <figure
                  className={isActive ? "carousel-photo-card carousel-photo-card--active" : "carousel-photo-card"}
                  key={photo.id}
                  style={cardStyle}
                  onClick={() => {
                    if (!photoDrag.active && !isActive) {
                      setPhotoIndex(index);
                    }
                  }}
                >
                  <img src={photo.url} alt={isActive ? photo.caption : ""} draggable={false} />
                  {isActive ? (
                    <figcaption>
                      <strong>{cityDisplayName(selectedCity, activeLanguage)}</strong>
                      <span>{photo.caption}</span>
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
          <div className="photo-controls">
            <button type="button" onClick={goToPrevious} aria-label={copy.viewer.previousPhoto}>
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <span>
              {photoIndex + 1} / {selectedPhotos.length}
            </span>
            <button type="button" onClick={goToNext} aria-label={copy.viewer.nextPhoto}>
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      ) : null}

      <footer className="map-source">
        {copy.viewer.mapSource}
      </footer>
    </section>
  );
}
