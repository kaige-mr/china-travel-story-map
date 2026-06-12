# City-Grouped Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat photo editor list with pending-photo and city groups that stay synchronized with map hotspots and photo playback.

**Architecture:** Add pure domain helpers that group photos and reconcile `cityOrder`, then render those groups in `Editor`. City group title clicks dispatch a typed browser event containing `cityId`; `StoryViewer` listens for that event and selects the matching city using its existing internal viewer state.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Lucide React, existing Zustand-backed story state.

---

### Task 1: Add deterministic editor grouping helpers

**Files:**
- Create: `src/domain/editorGroups.ts`
- Create: `src/domain/editorGroups.test.ts`

- [ ] **Step 1: Write failing tests for grouping and city-order reconciliation**

Test that unbound photos are separated, city groups follow `story.cityOrder`, photos are sorted by `sortIndex`, new used cities append, and cities without photos are removed.

- [ ] **Step 2: Run the domain test and verify RED**

Run: `npm test -- src/domain/editorGroups.test.ts --run`

Expected: FAIL because `groupPhotosForEditor` and `reconcileCityOrder` do not exist.

- [ ] **Step 3: Implement the pure helpers**

```ts
export function reconcileCityOrder(cityOrder: string[], photos: Photo[]): string[] {
  const used = new Set(photos.map((photo) => photo.cityId).filter(Boolean));
  return [
    ...cityOrder.filter((cityId) => used.has(cityId)),
    ...Array.from(used).filter((cityId) => !cityOrder.includes(cityId))
  ];
}

export function groupPhotosForEditor(story: Story): EditorPhotoGroups {
  const sortedPhotos = [...story.photos].sort((left, right) => left.sortIndex - right.sortIndex);
  const unboundPhotos = sortedPhotos.filter((photo) => !photo.cityId);
  const cityOrder = reconcileCityOrder(story.cityOrder, sortedPhotos);
  const cityGroups = cityOrder.flatMap((cityId) => {
    const city = findCity(cityId);
    const photos = sortedPhotos.filter((photo) => photo.cityId === cityId);
    return city && photos.length > 0 ? [{ city, photos }] : [];
  });

  return { unboundPhotos, cityGroups };
}
```

- [ ] **Step 4: Run the domain test and verify GREEN**

Run: `npm test -- src/domain/editorGroups.test.ts --run`

Expected: PASS.

### Task 2: Render pending and city groups in the editor

**Files:**
- Modify: `src/components/Editor.tsx`
- Modify: `src/components/Editor.test.tsx`
- Modify: `src/i18n.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing editor tests**

Test that unbound photos render under a pending group, multiple photos for one city render in one city group, city groups follow story order, and deleting a city's final photo removes that city from `cityOrder`.

- [ ] **Step 2: Run editor tests and verify RED**

Run: `npm test -- src/components/Editor.test.tsx --run`

Expected: FAIL because grouped section headings and controls are absent.

- [ ] **Step 3: Implement grouped editor state and markup**

Use `groupPhotosForEditor(story)` for rendering. Keep an `expandedGroupIds` set in local UI state. Render a pending group first, then one group per city. Reuse a focused photo-card renderer so caption, city selection, and removal behavior stay identical.

- [ ] **Step 4: Reconcile story order on city changes and removals**

Use `reconcileCityOrder(story.cityOrder, photos)` in both `updatePhoto` and `removePhoto`. Update `coverCityId` to the first remaining city when necessary.

- [ ] **Step 5: Add bilingual group labels and restrained grouped-list styling**

Add translations for pending photos, map point, photo count, expand, and collapse. Add full-width group bands with compact headers and nested photo rows; avoid nested decorative cards.

- [ ] **Step 6: Run editor tests and verify GREEN**

Run: `npm test -- src/components/Editor.test.tsx --run`

Expected: PASS.

### Task 3: Connect city groups to the map viewer

**Files:**
- Create: `src/events/storyViewerEvents.ts`
- Modify: `src/components/Editor.tsx`
- Modify: `src/components/StoryViewer.tsx`
- Modify: `src/components/Editor.test.tsx`
- Modify: `src/components/StoryViewer.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Test that clicking a city group dispatches a city-focus event and that `StoryViewer` responds by opening the matching city's photo dialog.

- [ ] **Step 2: Run interaction tests and verify RED**

Run: `npm test -- src/components/Editor.test.tsx src/components/StoryViewer.test.tsx --run`

Expected: FAIL because the event module and listener do not exist.

- [ ] **Step 3: Implement the typed focus event**

```ts
export const FOCUS_STORY_CITY_EVENT = "focus-story-city";

export function focusStoryCity(cityId: string) {
  window.dispatchEvent(new CustomEvent(FOCUS_STORY_CITY_EVENT, { detail: { cityId } }));
}
```

Add a listener in `StoryViewer` that resolves `cityId` from its existing `cities` collection and calls `setSelectedCity`.

- [ ] **Step 4: Run interaction tests and verify GREEN**

Run: `npm test -- src/components/Editor.test.tsx src/components/StoryViewer.test.tsx --run`

Expected: PASS.

### Task 4: Verify behavior and visuals

**Files:**
- Modify only if browser verification exposes a scoped defect.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test -- --run`

Expected: all test files pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build pass; the existing large-chunk warning may remain.

- [ ] **Step 3: Verify in the in-app browser**

Confirm pending photos appear first, city groups match map hotspots, group expansion is stable, clicking a city group opens that city's carousel, deleting/rebinding updates the grouping, and the editor remains usable in Chinese and English.
