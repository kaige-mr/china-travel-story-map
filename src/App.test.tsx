import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { createDemoStory } from "./domain/story";
import { LocalStoryRepository } from "./storage/storyRepository";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    window.localStorage.clear();
  });

  it("loads a published share route from local storage", async () => {
    const repository = new LocalStoryRepository();
    const story = await repository.publish(createDemoStory());
    window.history.pushState({}, "", `/s/${story.id}`);

    render(<App />);

    expect(await screen.findByLabelText("中国旅行地图")).toBeInTheDocument();
    expect(screen.queryByText("七日中国行")).not.toBeInTheDocument();
  });

  it("defaults to Chinese and can switch the workspace UI to English", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.getByText("编辑器")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布故事" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish story" })).toBeInTheDocument();
  });

  it("can collapse the editor to show the map stage by itself", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.getByRole("region", { name: "故事编辑器" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "隐藏编辑器" }));

    expect(screen.queryByRole("region", { name: "故事编辑器" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "显示编辑器" })).toBeInTheDocument();
    expect(screen.getByLabelText("中国旅行地图")).toBeInTheDocument();
  });
});
