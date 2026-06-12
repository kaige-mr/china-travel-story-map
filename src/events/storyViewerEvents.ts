export const FOCUS_STORY_CITY_EVENT = "focus-story-city";

export interface FocusStoryCityDetail {
  cityId: string;
}

export function focusStoryCity(cityId: string) {
  window.dispatchEvent(
    new CustomEvent<FocusStoryCityDetail>(FOCUS_STORY_CITY_EVENT, {
      detail: { cityId }
    })
  );
}

export function getFocusStoryCityDetail(event: Event): FocusStoryCityDetail | undefined {
  const detail = (event as CustomEvent<Partial<FocusStoryCityDetail>>).detail;

  if (typeof detail?.cityId !== "string" || detail.cityId.length === 0) {
    return undefined;
  }

  return { cityId: detail.cityId };
}
