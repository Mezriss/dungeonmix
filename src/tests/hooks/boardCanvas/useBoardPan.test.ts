import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBoardPan } from "@/hooks/boardCanvas/useBoardPan";
import { BoardStateContext } from "@/providers/BoardStateContext";

import type { State } from "@/state";
import type { ReactNode } from "react";

describe("useBoardPan", () => {
  let mockActions: {
    select: ReturnType<typeof vi.fn>;
    moveBoard: ReturnType<typeof vi.fn>;
  };

  let mockState: State;

  beforeEach(() => {
    mockActions = {
      select: vi.fn(),
      moveBoard: vi.fn(),
    };

    mockState = {
      data: {} as any,
      ui: {} as any,
      actions: mockActions as any,
    };

    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) =>
      createElement(BoardStateContext.Provider, { value: mockState }, children);
  };

  const createPointerEvent = (
    clientX: number,
    clientY: number,
    buttons = 4,
  ): any => ({
    clientX,
    clientY,
    buttons,
  });

  it("should return initial panDelta of { x: 0, y: 0 }", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });
  });

  it("should return startPan, pan, and endPan functions", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.startPan).toBe("function");
    expect(typeof result.current.pan).toBe("function");
    expect(typeof result.current.endPan).toBe("function");
  });

  it("should start pan when middle mouse button is pressed (buttons === 4)", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startPan(createPointerEvent(100, 200, 4));
    });

    expect(mockActions.select).toHaveBeenCalledWith(null);
  });

  it("should not start pan when other mouse buttons are pressed", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startPan(createPointerEvent(100, 200, 1)); // Left button
    });

    expect(mockActions.select).not.toHaveBeenCalled();
  });

  it("should update panDelta during pan", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Start pan at (100, 200)
    act(() => {
      result.current.startPan(createPointerEvent(100, 200, 4));
    });

    // Pan to (150, 250)
    act(() => {
      result.current.pan(createPointerEvent(150, 250));
    });

    expect(result.current.panDelta).toEqual({ x: 50, y: 50 });
  });

  it("should not update panDelta if pan was not started", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.pan(createPointerEvent(150, 250));
    });

    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });
  });

  it("should handle negative pan delta", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Start pan at (200, 300)
    act(() => {
      result.current.startPan(createPointerEvent(200, 300, 4));
    });

    // Pan to (150, 250) - moving backwards
    act(() => {
      result.current.pan(createPointerEvent(150, 250));
    });

    expect(result.current.panDelta).toEqual({ x: -50, y: -50 });
  });

  it("should call moveBoard and reset on endPan", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Start pan at (100, 200)
    act(() => {
      result.current.startPan(createPointerEvent(100, 200, 4));
    });

    // Pan to (150, 250)
    act(() => {
      result.current.pan(createPointerEvent(150, 250));
    });

    // End pan at (180, 280)
    act(() => {
      result.current.endPan(createPointerEvent(180, 280));
    });

    expect(mockActions.moveBoard).toHaveBeenCalledWith(80, 80);
    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });
  });

  it("should not call moveBoard if pan was not started", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.endPan(createPointerEvent(180, 280));
    });

    expect(mockActions.moveBoard).not.toHaveBeenCalled();
  });

  it("should handle complete pan workflow", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Initial state
    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });

    // Start pan
    act(() => {
      result.current.startPan(createPointerEvent(100, 100, 4));
    });
    expect(mockActions.select).toHaveBeenCalledWith(null);

    // Pan multiple times
    act(() => {
      result.current.pan(createPointerEvent(120, 130));
    });
    expect(result.current.panDelta).toEqual({ x: 20, y: 30 });

    act(() => {
      result.current.pan(createPointerEvent(140, 160));
    });
    expect(result.current.panDelta).toEqual({ x: 40, y: 60 });

    // End pan
    act(() => {
      result.current.endPan(createPointerEvent(150, 170));
    });
    expect(mockActions.moveBoard).toHaveBeenCalledWith(50, 70);
    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });
  });

  it("should allow starting a new pan after ending previous one", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // First pan
    act(() => {
      result.current.startPan(createPointerEvent(100, 100, 4));
    });
    act(() => {
      result.current.pan(createPointerEvent(150, 150));
    });
    act(() => {
      result.current.endPan(createPointerEvent(150, 150));
    });

    expect(mockActions.moveBoard).toHaveBeenCalledWith(50, 50);
    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });

    // Second pan
    act(() => {
      result.current.startPan(createPointerEvent(200, 200, 4));
    });
    act(() => {
      result.current.pan(createPointerEvent(250, 250));
    });

    expect(result.current.panDelta).toEqual({ x: 50, y: 50 });

    act(() => {
      result.current.endPan(createPointerEvent(250, 250));
    });

    expect(mockActions.moveBoard).toHaveBeenCalledWith(50, 50);
    expect(mockActions.moveBoard).toHaveBeenCalledTimes(2);
  });

  it("should handle pan starting at coordinates (0, 0)", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Start pan at (0, 0) - edge case
    act(() => {
      result.current.startPan(createPointerEvent(0, 0, 4));
    });

    // This should not update because the check is !x && !y
    act(() => {
      result.current.pan(createPointerEvent(50, 50));
    });

    // Due to the logic in the hook, (0, 0) is treated as "not started"
    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });
  });

  it("should handle pan with only x coordinate being 0", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Start pan at (0, 100)
    act(() => {
      result.current.startPan(createPointerEvent(0, 100, 4));
    });

    act(() => {
      result.current.pan(createPointerEvent(50, 150));
    });

    // Should work because only x is 0, not both
    expect(result.current.panDelta).toEqual({ x: 50, y: 50 });
  });

  it("should handle pan with only y coordinate being 0", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    // Start pan at (100, 0)
    act(() => {
      result.current.startPan(createPointerEvent(100, 0, 4));
    });

    act(() => {
      result.current.pan(createPointerEvent(150, 50));
    });

    // Should work because only y is 0, not both
    expect(result.current.panDelta).toEqual({ x: 50, y: 50 });
  });

  it("should reset panDelta to zero after endPan", () => {
    const { result } = renderHook(() => useBoardPan(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startPan(createPointerEvent(100, 100, 4));
    });

    act(() => {
      result.current.pan(createPointerEvent(200, 200));
    });

    expect(result.current.panDelta).toEqual({ x: 100, y: 100 });

    act(() => {
      result.current.endPan(createPointerEvent(200, 200));
    });

    expect(result.current.panDelta).toEqual({ x: 0, y: 0 });
  });
});
