import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoStory, type Story } from "../domain/story";
import { cities } from "../domain/cities";
import { projectCityToStagePercent } from "../map/projection";
import { StoryViewer } from "./StoryViewer";

function stagePercentFor(cityId: string) {
  const city = cities.find((candidate) => candidate.id === cityId);
  if (!city) {
    throw new Error(`Missing city ${cityId}`);
  }

  const point = projectCityToStagePercent(city);
  return {
    x: `${point.x.toFixed(2)}%`,
    y: `${point.y.toFixed(2)}%`
  };
}

describe("StoryViewer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a lightweight map silhouette before detailed map data is ready", () => {
    render(<StoryViewer story={createDemoStory()} />);

    expect(screen.getByRole("img", { name: "China map silhouette" })).toBeInTheDocument();
  });

  it("keeps city photos usable when detailed map data fails to load", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));

    render(<StoryViewer story={createDemoStory()} />);
    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));

    expect(await screen.findByRole("dialog", { name: "Hangzhou photos" })).toBeInTheDocument();
  });

  it("shows city hotspots and reveals floating photos when a city is selected", async () => {
    const user = userEvent.setup();
    render(<StoryViewer story={createDemoStory()} />);

    expect(screen.getByText("China Memory Map")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));

    const theater = screen.getByRole("dialog", { name: "Hangzhou photos" });
    expect(within(theater).getByText("Hangzhou")).toBeInTheDocument();
    expect(within(theater).getByText("Morning light on West Lake")).toBeInTheDocument();
  });

  it("flips to the next photo with the keyboard", async () => {
    const user = userEvent.setup();
    render(<StoryViewer story={createDemoStory()} />);

    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByText("Tea fields after rain")).toBeInTheDocument();
  });

  it("slides to the next photo when the photo stack is swiped left", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryViewer story={createDemoStory()} />);

    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));

    const photoStack = container.querySelector<HTMLElement>(".photo-stack");
    expect(photoStack).toBeInTheDocument();

    fireEvent.mouseDown(photoStack!, { clientX: 360 });
    fireEvent.mouseMove(photoStack!, { clientX: 250 });
    fireEvent.mouseUp(photoStack!, { clientX: 250 });

    expect(screen.getByText("Tea fields after rain")).toBeInTheDocument();
  });

  it("renders city hotspots only for cities that have photos", () => {
    const story: Story = {
      ...createDemoStory(),
      cityOrder: ["xian", "hangzhou"],
      photos: [
        {
          id: "hangzhou-only",
          storyId: "demo-china-memory",
          cityId: "hangzhou",
          url: "https://example.com/hangzhou.jpg",
          caption: "Only Hangzhou has a memory",
          sortIndex: 1,
          width: 1200,
          height: 1500
        }
      ]
    };

    render(<StoryViewer story={story} />);

    expect(screen.getByRole("button", { name: "Open Hangzhou photos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open Xi'an photos" })).not.toBeInTheDocument();
  });

  it("lays city photos out as a draggable 3D carousel", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryViewer story={createDemoStory()} />);

    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));

    const carousel = container.querySelector<HTMLElement>(".photo-carousel");
    const cards = container.querySelectorAll(".carousel-photo-card");

    expect(carousel).toBeInTheDocument();
    expect(cards.length).toBe(2);
    expect(cards[0]).toHaveStyle({ transformStyle: "preserve-3d" });
    expect(cards[1].getAttribute("style")).toContain("rotateY");
  });

  it("opens a city's photos when the editor requests map focus", async () => {
    render(<StoryViewer story={createDemoStory()} />);

    fireEvent(window, new CustomEvent("focus-story-city", { detail: { cityId: "hangzhou" } }));

    expect(await screen.findByRole("dialog", { name: "Hangzhou photos" })).toBeInTheDocument();
    expect(screen.getByText("Morning light on West Lake")).toBeInTheDocument();
  });

  it("moves the map focus to the selected city projection", async () => {
    const user = userEvent.setup();
    render(<StoryViewer story={createDemoStory()} />);

    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));

    const stage = screen.getByLabelText("China Memory Map");
    const mapScene = stage.querySelector<HTMLElement>(".map-scene");
    const expected = stagePercentFor("hangzhou");

    expect(stage).toHaveClass("story-stage--focused");
    expect(mapScene?.style.getPropertyValue("--focus-x")).toBe(expected.x);
    expect(mapScene?.style.getPropertyValue("--focus-y")).toBe(expected.y);
  });

  it("hides the reset-view control while the photo theater is open", async () => {
    const user = userEvent.setup();
    render(<StoryViewer story={createDemoStory()} />);

    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open Hangzhou photos" }));

    expect(screen.queryByRole("button", { name: "Reset view" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to map" })).toBeInTheDocument();
  });
});
