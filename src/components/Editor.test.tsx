import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Story } from "../domain/story";
import { Editor } from "./Editor";

const unboundStory: Story = {
  id: "draft-story",
  title: "Draft Story",
  coverCityId: "hangzhou",
  cityOrder: [],
  createdAt: "2026-06-10T00:00:00.000Z",
  photos: [
    {
      id: "draft-photo",
      storyId: "draft-story",
      cityId: "",
      url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      caption: "Unbound memory",
      sortIndex: 1,
      width: 1,
      height: 1
    }
  ]
};

const groupedStory: Story = {
  id: "grouped-story",
  title: "Grouped Story",
  coverCityId: "hangzhou",
  cityOrder: ["hangzhou", "xian"],
  createdAt: "2026-06-10T00:00:00.000Z",
  photos: [
    {
      id: "pending-photo",
      storyId: "grouped-story",
      cityId: "",
      url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      caption: "Pending memory",
      sortIndex: 1,
      width: 1,
      height: 1
    },
    {
      id: "hangzhou-one",
      storyId: "grouped-story",
      cityId: "hangzhou",
      url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      caption: "West Lake morning",
      sortIndex: 2,
      width: 1,
      height: 1
    },
    {
      id: "hangzhou-two",
      storyId: "grouped-story",
      cityId: "hangzhou",
      url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      caption: "Tea garden rain",
      sortIndex: 3,
      width: 1,
      height: 1
    },
    {
      id: "xian-only",
      storyId: "grouped-story",
      cityId: "xian",
      url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      caption: "City wall",
      sortIndex: 4,
      width: 1,
      height: 1
    }
  ]
};

describe("Editor", () => {
  it("shows a publish validation message when a photo has no city", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();

    render(<Editor story={unboundStory} onStoryChange={vi.fn()} onPublish={onPublish} />);
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    expect(screen.getByText("Every photo needs a city before publishing.")).toBeInTheDocument();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it("updates photo city selection before publishing", async () => {
    const user = userEvent.setup();
    const onStoryChange = vi.fn();

    render(<Editor story={unboundStory} onStoryChange={onStoryChange} onPublish={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("City for Unbound memory"), "hangzhou");

    expect(onStoryChange).toHaveBeenCalledWith(
      expect.objectContaining({
        cityOrder: ["hangzhou"],
        photos: [expect.objectContaining({ cityId: "hangzhou" })]
      })
    );
  });

  it("groups pending photos separately and combines photos by city order", () => {
    const { container } = render(
      <Editor story={groupedStory} onStoryChange={vi.fn()} onPublish={vi.fn()} />
    );

    expect(screen.getByRole("region", { name: "Unassigned photos group" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Hangzhou photo group" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Xi'an photo group" })).toBeInTheDocument();

    const groups = Array.from(container.querySelectorAll<HTMLElement>(".photo-city-group"));
    expect(groups.map((group) => group.dataset.groupId)).toEqual(["unbound", "hangzhou", "xian"]);
    expect(groups[1].querySelectorAll(".photo-editor-card")).toHaveLength(2);
  });

  it("removes a city from city order when its final photo is deleted", async () => {
    const user = userEvent.setup();
    const onStoryChange = vi.fn();
    const story: Story = {
      ...groupedStory,
      coverCityId: "xian",
      cityOrder: ["xian"],
      photos: [groupedStory.photos[3]]
    };

    render(<Editor story={story} onStoryChange={onStoryChange} onPublish={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Remove City wall" }));

    expect(onStoryChange).toHaveBeenCalledWith(
      expect.objectContaining({ cityOrder: [], photos: [] })
    );
  });

  it("requests the matching map city when a city group title is clicked", async () => {
    const user = userEvent.setup();
    const receivedCityIds: string[] = [];
    const listener = (event: Event) => {
      receivedCityIds.push((event as CustomEvent<{ cityId: string }>).detail.cityId);
    };
    window.addEventListener("focus-story-city", listener);

    try {
      render(<Editor story={groupedStory} onStoryChange={vi.fn()} onPublish={vi.fn()} />);
      await user.click(screen.getByRole("button", { name: "Open Hangzhou on map" }));

      expect(receivedCityIds).toEqual(["hangzhou"]);
    } finally {
      window.removeEventListener("focus-story-city", listener);
    }
  });
});
