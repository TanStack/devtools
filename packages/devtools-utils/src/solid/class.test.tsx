import { beforeEach, describe, expect, it, vi } from "vitest";
import { constructCoreClass } from "./class";

const lazyImportMock = vi.fn((fn) => fn());
const renderMock = vi.fn();
const portalMock = vi.fn((props: any) => <div>{props.children}</div>);

vi.mock("solid-js", async () => {
  const actual = await vi.importActual<any>("solid-js");
  return {
    ...actual,
    lazy: lazyImportMock,
  }
});

vi.mock("solid-js/web", async () => {
  const actual = await vi.importActual<any>("solid-js/web");
  return {
    ...actual,
    render: renderMock,
    Portal: portalMock,
  };
});


describe("constructCoreClass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  })
  it("should export DevtoolsCore and NoOpDevtoolsCore classes and make no calls to Solid.js primitives", () => {
    const [DevtoolsCore, NoOpDevtoolsCore] = constructCoreClass("@test/devtools-mock-package");
    expect(DevtoolsCore).toBeDefined();
    expect(NoOpDevtoolsCore).toBeDefined();
    expect(lazyImportMock).not.toHaveBeenCalled();
  });

  it("DevtoolsCore should call solid primitives when mount is called", async () => {
    const [DevtoolsCore, _] = constructCoreClass("@test/devtools-mock-package");
    const instance = new DevtoolsCore();
    await instance.mount(document.createElement("div"), "dark")
    expect(renderMock).toHaveBeenCalled();
  });

  it("DevtoolsCore should throw if mount is called twice without unmounting", async () => {
    const [DevtoolsCore, _] = constructCoreClass("@test/devtools-mock-package");
    const instance = new DevtoolsCore();
    await instance.mount(document.createElement("div"), "dark")
    await expect(instance.mount(document.createElement("div"), "dark")).rejects.toThrow("Devtools is already mounted");
  });

  it("DevtoolsCore should throw if unmount is called before mount", () => {
    const [DevtoolsCore, _] = constructCoreClass("@test/devtools-mock-package");
    const instance = new DevtoolsCore();
    expect(() => instance.unmount()).toThrow("Devtools is not mounted");
  });

  it("DevtoolsCore should allow mount after unmount", async () => {
    const [DevtoolsCore, _] = constructCoreClass("@test/devtools-mock-package");
    const instance = new DevtoolsCore();
    await instance.mount(document.createElement("div"), "dark")
    instance.unmount();
    await expect(instance.mount(document.createElement("div"), "dark")).resolves.not.toThrow();
  });



  it("NoOpDevtoolsCore should not call any solid primitives when mount is called", async () => {
    const [_, NoOpDevtoolsCore] = constructCoreClass("@test/devtools-mock-package");
    const noOpInstance = new NoOpDevtoolsCore();
    await noOpInstance.mount(document.createElement("div"), "dark")

    expect(lazyImportMock).not.toHaveBeenCalled();
    expect(renderMock).not.toHaveBeenCalled();
    expect(portalMock).not.toHaveBeenCalled();
  });

  it("NoOpDevtoolsCore should not throw if mount is called multiple times", async () => {
    const [_, NoOpDevtoolsCore] = constructCoreClass("@test/devtools-mock-package");
    const noOpInstance = new NoOpDevtoolsCore();
    await noOpInstance.mount(document.createElement("div"), "dark")
    await expect(noOpInstance.mount(document.createElement("div"), "dark")).resolves.not.toThrow();
  });

  it("NoOpDevtoolsCore should not throw if unmount is called before mount", () => {
    const [_, NoOpDevtoolsCore] = constructCoreClass("@test/devtools-mock-package");
    const noOpInstance = new NoOpDevtoolsCore();
    expect(() => noOpInstance.unmount()).not.toThrow();
  });

  it("NoOpDevtoolsCore should not throw if unmount is called after mount", async () => {
    const [_, NoOpDevtoolsCore] = constructCoreClass("@test/devtools-mock-package");
    const noOpInstance = new NoOpDevtoolsCore();
    await noOpInstance.mount(document.createElement("div"), "dark")
    expect(() => noOpInstance.unmount()).not.toThrow();
  });
});