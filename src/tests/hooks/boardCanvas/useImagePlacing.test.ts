import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { proxy } from "valtio";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImagePlacing } from "@/hooks/boardCanvas/useImagePlacing";
import { BoardStateContext } from "@/providers/BoardStateContext";

import type { State, UIState } from "@/state";
import type { ReactNode } from "react";

// Mock valtio
vi.mock("valtio", async () => {
  const actual = await vi.importActual("valtio");
  return {
    ...actual,
    useSnapshot: vi.fn((obj) => obj),
  };
});

describe("useImagePlacing", () => {
  let mockActions: {
    addImage: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };

  let mockUI: UIState;
  let mockState: State;
  let rect: { x: number; y: number; width: number; height: number };

  beforeEach(() => {
    mockActions = {
      addImage: vi.fn(() => "new-image-id"),
      select: vi.fn(),
    };

    mockUI = proxy({
      selectedTool: "image" as const,
      selectedId: null,
      editMode: true,
      marker: null,
      tracks: {},
      position: { x: 0, y: 0 },
      zoom: 1,
    });

    mockState = {
      data: {} as State["data"],
      ui: mockUI,
      actions: mockActions as unknown as State["actions"],
    };

    rect = { x: 100, y: 100, width: 800, height: 600 };

    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) =>
      createElement(BoardStateContext.Provider, { value: mockState }, children);
  };

  const createPointerEvent = (
    clientX: number,
    clientY: number,
    buttons = 1,
    target?: Partial<HTMLElement>,
  ) =>
    ({
      clientX,
      clientY,
      buttons,
      target: {
        closest: vi.fn((selector: string) => {
          if (selector === "#root") return true;
          if (selector === "button") return target?.closest?.(selector) || null;
          if (selector === "label") return target?.closest?.(selector) || null;
          return null;
        }),
        ...target,
      },
    }) as unknown as React.PointerEvent<HTMLDivElement>;

  it("should return placeImage function", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.placeImage).toBe("function");
  });

  it("should place image at correct position", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400));
    });

    // Calculate expected position:
    // x = (clientX - rect.x - rect.width/2 - ui.position.x) * (1 / ui.zoom)
    // x = (500 - 100 - 400 - 0) * 1 = 0
    // y = (clientY - rect.y - rect.height/2 - ui.position.y) * (1 / ui.zoom)
    // y = (400 - 100 - 300 - 0) * 1 = 0
    expect(mockActions.addImage).toHaveBeenCalledWith(0, 0);
    expect(mockActions.select).toHaveBeenCalledWith("new-image-id");
  });

  it("should calculate position with zoom", () => {
    mockUI.zoom = 2;

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(700, 550));
    });

    // x = (700 - 100 - 400 - 0) * (1/2) = 200 * 0.5 = 100
    // y = (550 - 100 - 300 - 0) * (1/2) = 150 * 0.5 = 75
    expect(mockActions.addImage).toHaveBeenCalledWith(100, 75);
  });

  it("should calculate position with pan offset", () => {
    mockUI.position = { x: 50, y: 30 };

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400));
    });

    // x = (500 - 100 - 400 - 50) * 1 = -50
    // y = (400 - 100 - 300 - 30) * 1 = -30
    expect(mockActions.addImage).toHaveBeenCalledWith(-50, -30);
  });

  it("should calculate position with both zoom and pan", () => {
    mockUI.zoom = 0.5;
    mockUI.position = { x: 100, y: 50 };

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(600, 500));
    });

    // x = (600 - 100 - 400 - 100) * (1/0.5) = 0 * 2 = 0
    // y = (500 - 100 - 300 - 50) * (1/0.5) = 50 * 2 = 100
    expect(mockActions.addImage).toHaveBeenCalledWith(0, 100);
  });

  it("should not place image if not in edit mode", () => {
    mockUI.editMode = false;

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400));
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should not place image if selected tool is not image", () => {
    mockUI.selectedTool = "select";

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400));
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should not place image if left mouse button is not pressed", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400, 2)); // Right button
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should not place image if clicking on a button", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    const mockTarget = {
      closest: vi.fn((selector: string) => {
        if (selector === "button") return document.createElement("button");
        if (selector === "#root") return true;
        return null;
      }),
    };

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400, 1, mockTarget));
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should not place image if clicking on a label", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    const mockTarget = {
      closest: vi.fn((selector: string) => {
        if (selector === "label") return document.createElement("label");
        if (selector === "#root") return true;
        return null;
      }),
    };

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400, 1, mockTarget));
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should not place image if not clicking inside #root", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    const mockTarget = {
      closest: vi.fn((selector: string) => {
        if (selector === "#root") return null;
        return null;
      }),
    };

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400, 1, mockTarget));
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should handle different rect positions", () => {
    const customRect = { x: 200, y: 150, width: 1000, height: 800 };

    const { result } = renderHook(() => useImagePlacing({ rect: customRect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(700, 550));
    });

    // x = (700 - 200 - 500 - 0) * 1 = 0
    // y = (550 - 150 - 400 - 0) * 1 = 0
    expect(mockActions.addImage).toHaveBeenCalledWith(0, 0);
  });

  it("should place multiple images in sequence", () => {
    mockActions.addImage
      .mockReturnValueOnce("image-1")
      .mockReturnValueOnce("image-2")
      .mockReturnValueOnce("image-3");

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400));
    });
    expect(mockActions.select).toHaveBeenCalledWith("image-1");

    act(() => {
      result.current.placeImage(createPointerEvent(600, 500));
    });
    expect(mockActions.select).toHaveBeenCalledWith("image-2");

    act(() => {
      result.current.placeImage(createPointerEvent(700, 600));
    });
    expect(mockActions.select).toHaveBeenCalledWith("image-3");

    expect(mockActions.addImage).toHaveBeenCalledTimes(3);
    expect(mockActions.select).toHaveBeenCalledTimes(3);
  });

  it("should handle negative coordinates", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(200, 200));
    });

    // x = (200 - 100 - 400 - 0) * 1 = -300
    // y = (200 - 100 - 300 - 0) * 1 = -200
    expect(mockActions.addImage).toHaveBeenCalledWith(-300, -200);
  });

  it("should handle extreme zoom levels", () => {
    mockUI.zoom = 0.1;

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(510, 410));
    });

    // x = (510 - 100 - 400 - 0) * (1/0.1) = 10 * 10 = 100
    // y = (410 - 100 - 300 - 0) * (1/0.1) = 10 * 10 = 100
    expect(mockActions.addImage).toHaveBeenCalledWith(100, 100);
  });

  it("should work with all valid conditions met", () => {
    mockUI.editMode = true;
    mockUI.selectedTool = "image";
    mockUI.zoom = 1;
    mockUI.position = { x: 0, y: 0 };

    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400, 1));
    });

    expect(mockActions.addImage).toHaveBeenCalled();
    expect(mockActions.select).toHaveBeenCalled();
  });

  it("should respect all guard conditions in combination", () => {
    const { result } = renderHook(() => useImagePlacing({ rect }), {
      wrapper: createWrapper(),
    });

    // Test with multiple failing conditions
    mockUI.editMode = false;
    mockUI.selectedTool = "select";

    act(() => {
      result.current.placeImage(createPointerEvent(500, 400, 2));
    });

    expect(mockActions.addImage).not.toHaveBeenCalled();
  });
});
