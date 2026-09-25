import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, FileImage, PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
import { Editor } from "./components/Editor";
import { StoryViewer } from "./components/StoryViewer";
import { TimelinePlayer } from "./components/TimelinePlayer";
import { PhotoLightbox } from "./components/PhotoLightbox";
import { calculateStoryStats } from "./domain/statsCalculator";
import { createDemoStory, type Story } from "./domain/story";
import type { Language } from "./i18n";
import { translations } from "./i18n";
import { storyRepository } from "./storage/storyRepository";
import { useStoryStore } from "./store/useStoryStore";

type ShareState =
  | { status: "loading" }
  | { status: "not-found"; id: string }
  | { status: "ready"; story: Story };

function shareIdFromHash(hash: string): string | undefined {
  const match = hash.match(/^#\/s\/([^/]+)$/);
  return match?.[1];
}

function ShareRoute({
  id,
  language,
  onLanguageChange
}: {
  id: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const [state, setState] = useState<ShareState>({ status: "loading" });
  const copy = translations[language].app;

  useEffect(() => {
    void storyRepository.findById(id).then((story) => {
      setState(story ? { status: "ready", story } : { status: "not-found", id });
    });
  }, [id]);

  if (state.status === "loading") {
    return <div className="loading-screen">{copy.loading}</div>;
  }

  if (state.status === "not-found") {
    return (
      <div className="empty-route">
        <h1>{copy.notFoundTitle}</h1>
        <p>{copy.notFoundBody}</p>
      </div>
    );
  }

  return <StoryViewer story={state.story} language={language} onLanguageChange={onLanguageChange} />;
}

export function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem("china-memory-language");
    return saved === "en" || saved === "zh" ? saved : "zh";
  });
  const [shareId, setShareId] = useState<string | undefined>(() => shareIdFromHash(window.location.hash));
  const story = useStoryStore((state) => state.story);
  const setStory = useStoryStore((state) => state.setStory);
  const resetToDemo = useStoryStore((state) => state.resetToDemo);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [editorCollapsed, setEditorCollapsed] = useState(true);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const copy = translations[language].app;

  // Travel statistics calculation
  const travelStats = useMemo(() => {
    return calculateStoryStats(story);
  }, [story]);

  useEffect(() => {
    const handleHashChange = () => {
      setShareId(shareIdFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const updateLanguage = (nextLanguage: Language) => {
    window.localStorage.setItem("china-memory-language", nextLanguage);
    setLanguage(nextLanguage);
  };

  const shareUrl = useMemo(() => {
    if (!publishedUrl) {
      return "";
    }
    return publishedUrl;
  }, [publishedUrl]);

  if (shareId) {
    return <ShareRoute id={shareId} language={language} onLanguageChange={updateLanguage} />;
  }

  const publish = async (nextStory: Story) => {
    const published = await storyRepository.publish(nextStory);
    const url = `${window.location.origin}${window.location.pathname}#/s/${published.id}`;
    setStory(published);
    setPublishedUrl(url);
  };

  const copyShareUrl = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard?.writeText(shareUrl);
  };

  return (
    <div className={editorCollapsed ? "app-shell app-shell--map-only" : "app-shell"}>
      {!editorCollapsed ? (
        <Editor
          story={story}
          onStoryChange={setStory}
          onPublish={publish}
          shareUrl={shareUrl}
          onCopyShareUrl={copyShareUrl}
          language={language}
        />
      ) : null}
      <main className={editorCollapsed ? "preview-pane preview-pane--map-only" : "preview-pane"}>
        <div className="viewer-frame">
          <StoryViewer
            story={story}
            language={language}
            onLanguageChange={updateLanguage}
            editorCollapsed={editorCollapsed}
            onToggleEditor={() => setEditorCollapsed(!editorCollapsed)}
          />
        </div>

        {/* Floating Timeline Player & Travel Stats Bar */}
        <div className="timeline-dock" style={{ position: "absolute", bottom: 16, right: 16, zIndex: 100, display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.9)", padding: 8, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ fontSize: 12, color: "#555" }}>
            足迹统计: {travelStats.provinceCount} 省 / {travelStats.cityCount} 市 ({travelStats.totalDistanceKm} km)
          </div>
          <TimelinePlayer
            totalNodes={story.nodes.length}
            currentNodeIndex={currentNodeIndex}
            onIndexChange={setCurrentNodeIndex}
            isPlaying={isPlayingTimeline}
            onPlayToggle={() => setIsPlayingTimeline(!isPlayingTimeline)}
          />
        </div>

        {/* Fullscreen Photo Lightbox Modal */}
        <PhotoLightbox
          isOpen={!!activePhotoUrl}
          photoUrl={activePhotoUrl ?? ""}
          onClose={() => setActivePhotoUrl(null)}
        />
      </main>
    </div>
  );
}
