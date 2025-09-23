import { describe, expect, it } from "vitest";
import { createReactPanel } from "./panel";


describe("createReactPanel", () => {
  it("should create a React component when provided with a package name", () => {
    const [ReactDevtoolsPanel, NoOpReactDevtoolsPanel] = createReactPanel('@tanstack/devtools-react');
    expect(ReactDevtoolsPanel).toBeDefined();
    expect(NoOpReactDevtoolsPanel).toBeDefined();
  });

  it("should create a React component when provided with a different import name", () => {
    const [ReactDevtoolsPanel, NoOpReactDevtoolsPanel] = createReactPanel('@tanstack/devtools-react', 'default');
    expect(ReactDevtoolsPanel).toBeDefined();
    expect(NoOpReactDevtoolsPanel).toBeDefined();
  });
});