import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBoardDimensions } from "@/hooks/boardCanvas/useBoardDimensions";

import type { RefObject } from "react";

describe("useBoardDimensions", () => {
  let mockElement: HTMLElement;
  let ref: RefObject<HTMLElement>;

  beforeEach(() => {
    // Create a mock element with getBoundingClientRect
    mockElement = document.createElement("div");
    ref = { current: mockElement };

    // Mock getBoundingClientRect
    vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
      width: 800,
      height: 600,
      x: 10,
      y: 20,
      top: 20,
      right: 810,
      bottom: 620,
      left: 10,
      toJSON: () => {},
    } as DOMRect);
  });

  it("should return initial dimensions of { width: 0, height: 0, x: 0, y: 0 }", () => {
    const emptyRef: RefObject<HTMLElement> = { current: null! };
    const { result } = renderHook(() => useBoardDimensions(emptyRef));

    expect(result.current).toEqual({
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    });
  });

  it("should return element dimensions when ref is set", async () => {
    const { result } = renderHook(() => useBoardDimensions(ref));

    await waitFor(() => {
      expect(result.current.width).toBe(800);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
    expect(result.current.x).toBe(10);
    expect(result.current.y).toBe(20);
  });

  it("should update dimensions on window resize", async () => {
    const { result } = renderHook(() => useBoardDimensions(ref));

    await waitFor(() => {
      expect(result.current.width).toBe(800);
    });

    // Change the mock return value
    vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
      width: 1024,
      height: 768,
      x: 15,
      y: 25,
      top: 25,
      right: 1039,
      bottom: 793,
      left: 15,
      toJSON: () => {},
    } as DOMRect);

    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(result.current.width).toBe(1024);
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.x).toBe(15);
    expect(result.current.y).toBe(25);
  });

  it("should handle ref changes", async () => {
    const { result, rerender } = renderHook(
      ({ ref }) => useBoardDimensions(ref),
      { initialProps: { ref } },
    );

    await waitFor(() => {
      expect(result.current.width).toBe(800);
    });

    // Create a new ref with different dimensions
    const newMockElement = document.createElement("div");
    const newRef: RefObject<HTMLElement> = { current: newMockElement };

    vi.spyOn(newMockElement, "getBoundingClientRect").mockReturnValue({
      width: 1200,
      height: 900,
      x: 5,
      y: 10,
      top: 10,
      right: 1205,
      bottom: 910,
      left: 5,
      toJSON: () => {},
    } as DOMRect);

    rerender({ ref: newRef });

    await waitFor(() => {
      expect(result.current.width).toBe(1200);
    });

    expect(result.current.width).toBe(1200);
    expect(result.current.height).toBe(900);
    expect(result.current.x).toBe(5);
    expect(result.current.y).toBe(10);
  });

  it("should cleanup resize listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount, result } = renderHook(() => useBoardDimensions(ref));

    // Wait for effect to run
    await waitFor(() => {
      expect(result.current.width).toBe(800);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should not update dimensions if ref.current is null", () => {
    const nullRef: RefObject<HTMLElement> = { current: null! };
    const { result } = renderHook(() => useBoardDimensions(nullRef));

    // Should remain at initial values
    expect(result.current).toEqual({
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    });
  });

  it("should call getBoundingClientRect on mount", async () => {
    const getBoundingClientRectSpy = vi.spyOn(
      mockElement,
      "getBoundingClientRect",
    );

    renderHook(() => useBoardDimensions(ref));

    await waitFor(() => {
      expect(getBoundingClientRectSpy).toHaveBeenCalled();
    });
  });

  it("should add resize event listener on mount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    renderHook(() => useBoardDimensions(ref));

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });

    addEventListenerSpy.mockRestore();
  });

  it("should handle multiple rapid resize events", async () => {
    const { result } = renderHook(() => useBoardDimensions(ref));

    await waitFor(() => {
      expect(result.current.width).toBe(800);
    });

    // Simulate multiple rapid resizes
    for (let i = 0; i < 5; i++) {
      vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
        width: 800 + i * 100,
        height: 600 + i * 50,
        x: 10,
        y: 20,
        top: 20,
        right: 810 + i * 100,
        bottom: 620 + i * 50,
        left: 10,
        toJSON: () => {},
      } as DOMRect);

      act(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }

    await waitFor(() => {
      expect(result.current.width).toBe(1200);
    });

    expect(result.current.width).toBe(1200);
    expect(result.current.height).toBe(800);
    expect(result.current.x).toBe(10);
    expect(result.current.y).toBe(20);
  });
});
