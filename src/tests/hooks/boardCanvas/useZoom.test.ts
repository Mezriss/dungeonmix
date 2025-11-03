import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useZoom } from "@/hooks/boardCanvas/useZoom";
import { BoardStateContext } from "@/providers/BoardStateContext";

import type { State } from "@/state";
import type { ReactNode, RefObject } from "react";

describe("useZoom", () => {
  let mockActions: {
    changeZoom: ReturnType<typeof vi.fn>;
  };

  let mockState: State;
  let mockElement: HTMLElement;
  let ref: RefObject<HTMLElement>;

  beforeEach(() => {
    mockActions = {
      changeZoom: vi.fn(),
    };

    mockState = {
      data: {} as any,
      ui: {} as any,
      actions: mockActions as any,
    };

    mockElement = document.createElement("div");
    ref = { current: mockElement };

    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) =>
      createElement(BoardStateContext.Provider, { value: mockState }, children);
  };

  it("should add wheel event listener on mount", () => {
    const addEventListenerSpy = vi.spyOn(mockElement, "addEventListener");

    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
  });

  it("should call changeZoom with positive factor on scroll down", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    act(() => {
      const wheelEvent = new WheelEvent("wheel", { deltaY: 100 });
      mockElement.dispatchEvent(wheelEvent);
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);
  });

  it("should call changeZoom with negative factor on scroll up", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    act(() => {
      const wheelEvent = new WheelEvent("wheel", { deltaY: -100 });
      mockElement.dispatchEvent(wheelEvent);
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(-0.1);
  });

  it("should handle multiple scroll events", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    // Scroll down
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 50 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);

    // Scroll up
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -50 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(-0.1);

    // Scroll down again
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 200 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);

    expect(mockActions.changeZoom).toHaveBeenCalledTimes(3);
  });

  it("should handle small positive deltaY values", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);
  });

  it("should handle small negative deltaY values", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(-0.1);
  });

  it("should handle zero deltaY as zoom in", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 0 }));
    });

    // deltaY === 0 is not > 0, so it goes to the else branch (-0.1)
    expect(mockActions.changeZoom).toHaveBeenCalledWith(-0.1);
  });

  it("should remove event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, "removeEventListener");

    const { unmount } = renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should not add event listener if ref.current is null", () => {
    const nullRef: RefObject<HTMLElement> = { current: null! };

    renderHook(() => useZoom(nullRef), {
      wrapper: createWrapper(),
    });

    // Should not throw and changeZoom should not be called
    expect(mockActions.changeZoom).not.toHaveBeenCalled();
  });

  it("should handle ref changes", () => {
    const { rerender } = renderHook(({ ref }) => useZoom(ref), {
      initialProps: { ref },
      wrapper: createWrapper(),
    });

    // Dispatch event on first element
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);

    // Create new element and ref
    const newElement = document.createElement("div");
    const newRef: RefObject<HTMLElement> = { current: newElement };

    // Rerender with new ref
    rerender({ ref: newRef });

    // Old element should no longer trigger zoom
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
    });

    // Should still be 1 call (from before)
    expect(mockActions.changeZoom).toHaveBeenCalledTimes(1);

    // New element should trigger zoom
    act(() => {
      newElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledTimes(2);
    expect(mockActions.changeZoom).toHaveBeenLastCalledWith(-0.1);
  });

  it("should handle rapid scroll events", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    // Simulate rapid scrolling
    act(() => {
      for (let i = 0; i < 10; i++) {
        mockElement.dispatchEvent(
          new WheelEvent("wheel", { deltaY: i % 2 === 0 ? 100 : -100 }),
        );
      }
    });

    expect(mockActions.changeZoom).toHaveBeenCalledTimes(10);
  });

  it("should use the same zoom factor regardless of deltaY magnitude", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    // Large deltaY
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 1000 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);

    mockActions.changeZoom.mockClear();

    // Small deltaY
    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);
  });

  it("should work with different element types", () => {
    const canvasElement = document.createElement("canvas");
    const canvasRef: RefObject<HTMLElement> = { current: canvasElement };

    renderHook(() => useZoom(canvasRef), {
      wrapper: createWrapper(),
    });

    act(() => {
      canvasElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 50 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledWith(0.1);
  });

  it("should cleanup properly when ref becomes null", () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, "removeEventListener");

    const { rerender } = renderHook(({ ref }) => useZoom(ref), {
      initialProps: { ref },
      wrapper: createWrapper(),
    });

    // Change ref to null
    const nullRef: RefObject<HTMLElement> = { current: null! };
    rerender({ ref: nullRef });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should handle actions reference changes", () => {
    const { rerender } = renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
    });

    expect(mockActions.changeZoom).toHaveBeenCalledTimes(1);

    // Create new actions
    const newMockActions = {
      changeZoom: vi.fn(),
    };

    mockState.actions = newMockActions as any;

    // Force rerender
    rerender();

    act(() => {
      mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }));
    });

    // New actions should be called
    expect(newMockActions.changeZoom).toHaveBeenCalledWith(-0.1);
  });

  it("should not call changeZoom before event listener is attached", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    // changeZoom should not be called during mount
    expect(mockActions.changeZoom).not.toHaveBeenCalled();
  });

  it("should handle continuous zoom in", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    // Multiple zoom in events
    for (let i = 0; i < 5; i++) {
      act(() => {
        mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -50 }));
      });
    }

    expect(mockActions.changeZoom).toHaveBeenCalledTimes(5);
    mockActions.changeZoom.mock.calls.forEach((call) => {
      expect(call[0]).toBe(-0.1);
    });
  });

  it("should handle continuous zoom out", () => {
    renderHook(() => useZoom(ref), {
      wrapper: createWrapper(),
    });

    // Multiple zoom out events
    for (let i = 0; i < 5; i++) {
      act(() => {
        mockElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 50 }));
      });
    }

    expect(mockActions.changeZoom).toHaveBeenCalledTimes(5);
    mockActions.changeZoom.mock.calls.forEach((call) => {
      expect(call[0]).toBe(0.1);
    });
  });
});
