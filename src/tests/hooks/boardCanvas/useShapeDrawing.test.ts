import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { proxy } from "valtio";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShapeDrawing } from "@/hooks/boardCanvas/useShapeDrawing";
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

describe("useShapeDrawing", () => {
  let mockActions: {
    addArea: ReturnType<typeof vi.fn>;
  };

  let mockUI: UIState;
  let mockState: State;
  let rect: { x: number; y: number; width: number; height: number };

  beforeEach(() => {
    mockActions = {
      addArea: vi.fn(),
    };

    mockUI = proxy({
      selectedTool: "rectangle" as const,
      selectedId: null,
      editMode: true,
      marker: null,
      tracks: {},
      position: { x: 0, y: 0 },
      zoom: 1,
    });

    mockState = {
      data: {} as any,
      ui: mockUI,
      actions: mockActions as any,
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
  ): any => ({
    clientX,
    clientY,
    buttons,
    target: {
      closest: vi.fn((selector: string) => {
        if (selector === "#root") return true;
        if (selector === "button") return target?.closest?.(selector) || null;
        return null;
      }),
      ...target,
    },
  });

  it("should return tempShape, startDrawing, draw, and endDrawing", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    expect(result.current.tempShape).toBeNull();
    expect(typeof result.current.startDrawing).toBe("function");
    expect(typeof result.current.draw).toBe("function");
    expect(typeof result.current.endDrawing).toBe("function");
  });

  it("should start drawing a rectangle", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    expect(result.current.tempShape).toEqual({
      id: "temp",
      shape: "rectangle",
      width: 0,
      height: 0,
      x: 200, // 300 - 100
      y: 150, // 250 - 100
      tracks: [],
    });
  });

  it("should start drawing a circle", () => {
    mockUI.selectedTool = "circle";

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    expect(result.current.tempShape).toEqual({
      id: "temp",
      shape: "circle",
      width: 0,
      height: 0,
      x: 200,
      y: 150,
      tracks: [],
    });
  });

  it("should not start drawing if not in edit mode", () => {
    mockUI.editMode = false;

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should not start drawing if left mouse button is not pressed", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250, 2)); // Right button
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should not start drawing if selected tool is not circle or rectangle", () => {
    mockUI.selectedTool = "select";

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should not start drawing if clicking on a button", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
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
      result.current.startDrawing(
        createPointerEvent(300, 250, 1, mockTarget as any),
      );
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should not start drawing if not clicking inside #root", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    const mockTarget = {
      closest: vi.fn((selector: string) => {
        if (selector === "#root") return null;
        return null;
      }),
    };

    act(() => {
      result.current.startDrawing(
        createPointerEvent(300, 250, 1, mockTarget as any),
      );
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should update shape dimensions while drawing", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    // Start drawing at (300, 250)
    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    // Draw to (400, 350)
    act(() => {
      result.current.draw(createPointerEvent(400, 350));
    });

    expect(result.current.tempShape).toEqual({
      id: "temp",
      shape: "rectangle",
      width: 100, // 400 - 100 - 200
      height: 100, // 350 - 100 - 150
      x: 200,
      y: 150,
      tracks: [],
    });
  });

  it("should handle negative dimensions while drawing", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    // Start drawing at (400, 350)
    act(() => {
      result.current.startDrawing(createPointerEvent(400, 350));
    });

    // Draw backwards to (300, 250)
    act(() => {
      result.current.draw(createPointerEvent(300, 250));
    });

    expect(result.current.tempShape).toEqual({
      id: "temp",
      shape: "rectangle",
      width: -100, // 300 - 100 - 300
      height: -100, // 250 - 100 - 250
      x: 300,
      y: 250,
      tracks: [],
    });
  });

  it("should not update dimensions if drawing has not started", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.draw(createPointerEvent(400, 350));
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should continuously update dimensions during drawing", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    // Multiple draw updates
    act(() => {
      result.current.draw(createPointerEvent(350, 300));
    });

    expect(result.current.tempShape?.width).toBe(50);
    expect(result.current.tempShape?.height).toBe(50);

    act(() => {
      result.current.draw(createPointerEvent(400, 350));
    });

    expect(result.current.tempShape?.width).toBe(100);
    expect(result.current.tempShape?.height).toBe(100);

    act(() => {
      result.current.draw(createPointerEvent(450, 400));
    });

    expect(result.current.tempShape?.width).toBe(150);
    expect(result.current.tempShape?.height).toBe(150);
  });

  it("should finalize shape with correct position and dimensions", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    // Start at (300, 250), draw to (400, 350)
    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    act(() => {
      result.current.draw(createPointerEvent(400, 350));
    });

    act(() => {
      result.current.endDrawing();
    });

    // Calculate expected values:
    // x = (200 - 0 - 400) * 1 = -200
    // y = (150 - 0 - 300) * 1 = -150
    // width = 100 * 1 = 100
    // height = 100 * 1 = 100
    expect(mockActions.addArea).toHaveBeenCalledWith({
      id: "temp",
      shape: "rectangle",
      x: -200,
      y: -150,
      width: 100,
      height: 100,
      tracks: [],
    });

    expect(result.current.tempShape).toBeNull();
  });

  it("should apply zoom when finalizing shape", () => {
    mockUI.zoom = 2;

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    act(() => {
      result.current.draw(createPointerEvent(500, 450));
    });

    act(() => {
      result.current.endDrawing();
    });

    // x = (200 - 0 - 400) * (1/2) = -200 * 0.5 = -100
    // y = (150 - 0 - 300) * (1/2) = -150 * 0.5 = -75
    // width = 200 * (1/2) = 100
    // height = 200 * (1/2) = 100
    expect(mockActions.addArea).toHaveBeenCalledWith({
      id: "temp",
      shape: "rectangle",
      x: -100,
      y: -75,
      width: 100,
      height: 100,
      tracks: [],
    });
  });

  it("should apply pan offset when finalizing shape", () => {
    mockUI.position = { x: 50, y: 30 };

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    act(() => {
      result.current.draw(createPointerEvent(400, 350));
    });

    act(() => {
      result.current.endDrawing();
    });

    // x = (200 - 50 - 400) * 1 = -250
    // y = (150 - 30 - 300) * 1 = -180
    expect(mockActions.addArea).toHaveBeenCalledWith({
      id: "temp",
      shape: "rectangle",
      x: -250,
      y: -180,
      width: 100,
      height: 100,
      tracks: [],
    });
  });

  it("should apply both zoom and pan when finalizing shape", () => {
    mockUI.zoom = 0.5;
    mockUI.position = { x: 100, y: 50 };

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(300, 250));
    });

    act(() => {
      result.current.draw(createPointerEvent(350, 300));
    });

    act(() => {
      result.current.endDrawing();
    });

    // x = (200 - 100 - 400) * (1/0.5) = -300 * 2 = -600
    // y = (150 - 50 - 300) * (1/0.5) = -200 * 2 = -400
    // width = 50 * (1/0.5) = 50 * 2 = 100
    // height = 50 * (1/0.5) = 50 * 2 = 100
    expect(mockActions.addArea).toHaveBeenCalledWith({
      id: "temp",
      shape: "rectangle",
      x: -600,
      y: -400,
      width: 100,
      height: 100,
      tracks: [],
    });
  });

  it("should not finalize if no shape is being drawn", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.endDrawing();
    });

    expect(mockActions.addArea).not.toHaveBeenCalled();
  });

  it("should handle complete drawing workflow", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    // Initial state
    expect(result.current.tempShape).toBeNull();

    // Start drawing
    act(() => {
      result.current.startDrawing(createPointerEvent(200, 200));
    });

    expect(result.current.tempShape).not.toBeNull();
    expect(result.current.tempShape?.width).toBe(0);
    expect(result.current.tempShape?.height).toBe(0);

    // Draw
    act(() => {
      result.current.draw(createPointerEvent(300, 300));
    });

    expect(result.current.tempShape?.width).toBe(100);
    expect(result.current.tempShape?.height).toBe(100);

    // End drawing
    act(() => {
      result.current.endDrawing();
    });

    expect(mockActions.addArea).toHaveBeenCalled();
    expect(result.current.tempShape).toBeNull();
  });

  it("should allow drawing multiple shapes in sequence", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    // First shape
    act(() => {
      result.current.startDrawing(createPointerEvent(200, 200));
    });
    act(() => {
      result.current.draw(createPointerEvent(300, 300));
    });
    act(() => {
      result.current.endDrawing();
    });

    expect(mockActions.addArea).toHaveBeenCalledTimes(1);

    // Second shape
    act(() => {
      result.current.startDrawing(createPointerEvent(400, 400));
    });
    act(() => {
      result.current.draw(createPointerEvent(500, 500));
    });
    act(() => {
      result.current.endDrawing();
    });

    expect(mockActions.addArea).toHaveBeenCalledTimes(2);
  });

  it("should switch between circle and rectangle", () => {
    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    // Draw rectangle
    mockUI.selectedTool = "rectangle";
    act(() => {
      result.current.startDrawing(createPointerEvent(200, 200));
    });
    expect(result.current.tempShape?.shape).toBe("rectangle");
    act(() => {
      result.current.endDrawing();
    });

    // Draw circle
    mockUI.selectedTool = "circle";
    act(() => {
      result.current.startDrawing(createPointerEvent(300, 300));
    });
    expect(result.current.tempShape?.shape).toBe("circle");
  });

  it("should handle different rect dimensions", () => {
    const customRect = { x: 50, y: 75, width: 1000, height: 800 };

    const { result } = renderHook(() => useShapeDrawing({ rect: customRect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(200, 200));
    });

    expect(result.current.tempShape?.x).toBe(150); // 200 - 50
    expect(result.current.tempShape?.y).toBe(125); // 200 - 75

    act(() => {
      result.current.draw(createPointerEvent(300, 300));
    });

    act(() => {
      result.current.endDrawing();
    });

    // x = (150 - 0 - 500) * 1 = -350
    // y = (125 - 0 - 400) * 1 = -275
    expect(mockActions.addArea).toHaveBeenCalledWith(
      expect.objectContaining({
        x: -350,
        y: -275,
      }),
    );
  });

  it("should preserve shape type when finalizing", () => {
    mockUI.selectedTool = "circle";

    const { result } = renderHook(() => useShapeDrawing({ rect }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startDrawing(createPointerEvent(200, 200));
    });

    act(() => {
      result.current.draw(createPointerEvent(300, 300));
    });

    act(() => {
      result.current.endDrawing();
    });

    expect(mockActions.addArea).toHaveBeenCalledWith(
      expect.objectContaining({
        shape: "circle",
      }),
    );
  });
});
