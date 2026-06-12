import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ImagePlus, MapPin, Send, Sparkles, Trash2, Copy, Eye } from "lucide-react";
import { cities } from "../domain/cities";
import { groupPhotosForEditor, reconcileCityOrder } from "../domain/editorGroups";
import { type Photo, type Story, validateStoryForPublish } from "../domain/story";
import { focusStoryCity } from "../events/storyViewerEvents";
import type { Language } from "../i18n";
import { cityDisplayName, cityOptionLabel, translations, validationReason } from "../i18n";
import { fileNameToCaption, prepareImageFile } from "../utils/image";

interface EditorProps {
  story: Story;
  onStoryChange: (story: Story) => void;
  onPublish: (story: Story) => void | Promise<void>;
  shareUrl?: string;
  onCopyShareUrl?: () => void;
  language?: Language;
}

export function Editor({
  story,
  onStoryChange,
  onPublish,
  shareUrl,
  onCopyShareUrl,
  language = "en"
}: EditorProps) {
  const [validationMessage, setValidationMessage] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [pendingBatchPhotos, setPendingBatchPhotos] = useState<Photo[] | null>(null);
  const [batchSelectedCityId, setBatchSelectedCityId] = useState("");
  const photoGroups = useMemo(() => groupPhotosForEditor(story), [story]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    () => new Set(["unbound", photoGroups.cityGroups[0]?.city.id].filter(Boolean) as string[])
  );
  const photosByCity = photoGroups.cityGroups.length;
  const copy = translations[language].editor;

  useEffect(() => {
    const availableGroupIds = new Set([
      ...(photoGroups.unboundPhotos.length > 0 ? ["unbound"] : []),
      ...photoGroups.cityGroups.map((group) => group.city.id)
    ]);

    setExpandedGroupIds((current) => {
      const next = new Set(Array.from(current).filter((groupId) => availableGroupIds.has(groupId)));

      if (photoGroups.unboundPhotos.length > 0) {
        next.add("unbound");
      }

      if (photoGroups.cityGroups.length > 0 && !photoGroups.cityGroups.some((group) => next.has(group.city.id))) {
        next.add(photoGroups.cityGroups[0].city.id);
      }

      return next;
    });
  }, [photoGroups]);

  const updateStory = (nextStory: Story) => {
    setValidationMessage("");
    onStoryChange(nextStory);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setIsPreparing(true);
    const preparedPhotos = await Promise.all(
      Array.from(files).map(async (file, index) => {
        const prepared = await prepareImageFile(file);
        return {
          id: `photo-${Date.now()}-${index}`,
          storyId: story.id,
          cityId: "",
          url: prepared.url,
          caption: fileNameToCaption(file.name),
          sortIndex: story.photos.length + index + 1,
          width: prepared.width,
          height: prepared.height
        };
      })
    );

    setIsPreparing(false);

    if (preparedPhotos.length > 1) {
      setPendingBatchPhotos(preparedPhotos);
      setBatchSelectedCityId("");
    } else {
      updateStory({
        ...story,
        photos: [...story.photos, ...preparedPhotos]
      });
    }
  };

  const confirmBatchImport = () => {
    if (!pendingBatchPhotos) return;
    const assignedPhotos = pendingBatchPhotos.map(photo => ({ ...photo, cityId: batchSelectedCityId }));
    
    if (batchSelectedCityId) {
      setExpandedGroupIds((current) => new Set([...current, batchSelectedCityId]));
    }
    
    updateStory({
      ...story,
      photos: [...story.photos, ...assignedPhotos]
    });
    setPendingBatchPhotos(null);
  };

  const skipBatchImport = () => {
    if (!pendingBatchPhotos) return;
    updateStory({
      ...story,
      photos: [...story.photos, ...pendingBatchPhotos]
    });
    setPendingBatchPhotos(null);
  };

  const updatePhoto = (photoId: string, patch: Partial<Photo>) => {
    const photos = story.photos.map((photo) => (photo.id === photoId ? { ...photo, ...patch } : photo));
    const cityOrder = reconcileCityOrder(story.cityOrder, photos);

    if (patch.cityId !== undefined) {
      setExpandedGroupIds((current) => new Set([...current, patch.cityId || "unbound"]));
    }

    updateStory({
      ...story,
      cityOrder,
      coverCityId: cityOrder.includes(story.coverCityId) ? story.coverCityId : cityOrder[0] ?? story.coverCityId,
      photos
    });
  };

  const removePhoto = (photoId: string) => {
    const photos = story.photos.filter((photo) => photo.id !== photoId);
    const cityOrder = reconcileCityOrder(story.cityOrder, photos);
    updateStory({
      ...story,
      cityOrder,
      coverCityId: cityOrder.includes(story.coverCityId) ? story.coverCityId : cityOrder[0] ?? story.coverCityId,
      photos
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const openCityOnMap = (cityId: string) => {
    setExpandedGroupIds((current) => new Set([...current, cityId]));
    focusStoryCity(cityId);
  };

  const renderPhotoCard = (photo: Photo) => (
    <article className="photo-editor-card" key={photo.id}>
      <div className="photo-thumbnail-container">
        <img src={photo.url} alt={photo.caption} />
        <button
          className="photo-delete-badge"
          type="button"
          aria-label={`${copy.remove} ${photo.caption}`}
          onClick={() => removePhoto(photo.id)}
        >
          <Trash2 aria-hidden="true" size={13} />
        </button>
      </div>
      <div className="photo-card-fields">
        <div className="photo-field">
          <label className="field-label" htmlFor={`caption-${photo.id}`}>
            {copy.caption}
          </label>
          <input
            id={`caption-${photo.id}`}
            className="text-input"
            value={photo.caption}
            onChange={(event) => updatePhoto(photo.id, { caption: event.target.value })}
          />
        </div>
        <div className="photo-field">
          <label className="field-label" htmlFor={`city-${photo.id}`}>
            {copy.cityFor} {photo.caption}
          </label>
          <div className="select-container">
            <select
              id={`city-${photo.id}`}
              className="text-input select-input"
              value={photo.cityId}
              onChange={(event) => updatePhoto(photo.id, { cityId: event.target.value })}
            >
              <option value="">{copy.selectCity}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {cityOptionLabel(city, language)}
                </option>
              ))}
            </select>
            <ChevronDown className="select-chevron" aria-hidden="true" size={15} />
          </div>
        </div>
      </div>
    </article>
  );

  const publish = async () => {
    const validation = validateStoryForPublish(story);
    if (!validation.ok) {
      setValidationMessage(validationReason(validation.reason, language));
      return;
    }

    await onPublish(story);
  };

  return (
    <section className="editor-panel" aria-label={copy.ariaLabel}>
      <div className="editor-heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.heading}</h2>
        <p>{copy.body}</p>
      </div>

      <label className="field-label" htmlFor="story-title">
        {copy.storyTitle}
      </label>
      <input
        id="story-title"
        className="text-input"
        value={story.title}
        onChange={(event) => updateStory({ ...story, title: event.target.value })}
      />

      <label className="upload-dropzone">
        <ImagePlus aria-hidden="true" size={21} />
        <span>{isPreparing ? copy.preparing : copy.upload}</span>
        <input type="file" accept="image/*" multiple onChange={(event) => void handleFiles(event.currentTarget.files)} />
      </label>

      <div className="editor-stats" aria-label="Story summary">
        <span>{story.photos.length} {copy.photos}</span>
        <span>{photosByCity} {copy.cities}</span>
      </div>

      <div className="photo-editor-list">
        {photoGroups.unboundPhotos.length > 0 ? (
          <section
            className="photo-city-group photo-city-group--unbound"
            data-group-id="unbound"
            aria-label={copy.unassignedGroup}
          >
            <div className="photo-group-header">
              <div className="photo-group-summary">
                <span className="photo-group-status photo-group-status--pending" aria-hidden="true" />
                <div>
                  <strong>{copy.unassignedPhotos}</strong>
                  <span>{photoGroups.unboundPhotos.length} {copy.photos}</span>
                </div>
              </div>
              <button
                className="photo-group-toggle"
                type="button"
                aria-label={expandedGroupIds.has("unbound") ? copy.collapseGroup : copy.expandGroup}
                aria-expanded={expandedGroupIds.has("unbound")}
                onClick={() => toggleGroup("unbound")}
              >
                {expandedGroupIds.has("unbound") ? <ChevronDown aria-hidden="true" size={18} /> : <ChevronRight aria-hidden="true" size={18} />}
              </button>
            </div>
            {expandedGroupIds.has("unbound") ? (
              <div className="photo-group-content">{photoGroups.unboundPhotos.map(renderPhotoCard)}</div>
            ) : null}
          </section>
        ) : null}

        {photoGroups.cityGroups.map(({ city, photos }) => {
          const groupId = city.id;
          const cityName = cityDisplayName(city, language);
          const isExpanded = expandedGroupIds.has(groupId);

          return (
            <section
              className="photo-city-group"
              data-group-id={groupId}
              aria-label={`${cityName} ${copy.photoGroup}`}
              key={groupId}
            >
              <div className="photo-group-header">
                <button
                  className="photo-group-summary photo-group-open-map"
                  type="button"
                  aria-label={copy.openCityOnMap.replace("{city}", cityName)}
                  onClick={() => openCityOnMap(groupId)}
                >
                  <span className="photo-group-status" aria-hidden="true" />
                  <div>
                    <strong>{cityName}</strong>
                    <span>{photos.length} {copy.photos}</span>
                  </div>
                  <span className="photo-group-map-status">
                    <MapPin aria-hidden="true" size={13} />
                    {copy.mapPoint}
                  </span>
                </button>
                <button
                  className="photo-group-toggle"
                  type="button"
                  aria-label={isExpanded ? copy.collapseGroup : copy.expandGroup}
                  aria-expanded={isExpanded}
                  onClick={() => toggleGroup(groupId)}
                >
                  {isExpanded ? <ChevronDown aria-hidden="true" size={18} /> : <ChevronRight aria-hidden="true" size={18} />}
                </button>
              </div>
              {isExpanded ? <div className="photo-group-content">{photos.map(renderPhotoCard)}</div> : null}
            </section>
          );
        })}
      </div>

      {validationMessage ? <p className="validation-message">{validationMessage}</p> : null}

      <div className="editor-actions">
        <button className="primary-action" type="button" onClick={() => void publish()}>
          <Send aria-hidden="true" size={17} />
          {copy.publish}
        </button>
        {shareUrl && onCopyShareUrl && (
          <button className="secondary-action" type="button" onClick={onCopyShareUrl}>
            <Copy aria-hidden="true" size={16} />
            {translations[language].app.copyLink}
          </button>
        )}
      </div>

      {shareUrl && (
        <div className="published-link-container">
          <Eye aria-hidden="true" size={14} />
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="published-link">
            {shareUrl}
          </a>
        </div>
      )}

      <div className="compliance-note">
        <Sparkles aria-hidden="true" size={16} />
        {copy.compliance}
      </div>

      {pendingBatchPhotos && (
        <div className="batch-modal-overlay">
          <div className="batch-modal">
            <h3>{copy.batchImportTitle}</h3>
            <p>{copy.batchImportMessage.replace("{count}", String(pendingBatchPhotos.length))}</p>
            <div className="select-container">
              <select
                className="text-input select-input"
                value={batchSelectedCityId}
                onChange={(e) => setBatchSelectedCityId(e.target.value)}
              >
                <option value="">{copy.selectCity}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {cityOptionLabel(city, language)}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-chevron" aria-hidden="true" size={15} />
            </div>
            <div className="batch-modal-actions">
              <button className="secondary-action" type="button" onClick={skipBatchImport}>
                {copy.batchImportSkip}
              </button>
              <button 
                className="primary-action" 
                type="button" 
                disabled={!batchSelectedCityId}
                onClick={confirmBatchImport}
              >
                {copy.batchImportConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
