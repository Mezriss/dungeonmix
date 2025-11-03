import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDrag } from "@/hooks/boardCanvas/useDrag";

import type { RefObject } from "react";

describe("useDrag", () => {
  let mockRefs: RefObject<HTMLDivElement>[];
  let mockOnUpdate: (moveX: number, moveY: number) => void;
  let mockElements: HTMLDivElement[];

  beforeEach(() => {
    // Create mock elements with style methods
    mockElements = [
      document.createElement("div"),
      document.createElement("div"),
    ];

    mockRefs = mockElements.map((el) => ({ current: el }));
    mockOnUpdate = vi.fn();

    vi.clearAllMocks();
  });

  const createPointerEvent = (clientX: number, clientY: number): any => ({
    clientX,
    clientY,
  });

  it("should return onDragStart function", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    expect(typeof result.current.onDragStart).toBe("function");
  });

  it("should add event listeners on drag start", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    act(() => {
      result.current.onDragStart(createPointerEvent(100, 200));
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
  });

  it("should set CSS custom properties on pointer move", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // Start drag at (100, 200)
    act(() => {
      result.current.onDragStart(createPointerEvent(100, 200));
    });

    // Move to (150, 250)
    act(() => {
      const moveEvent = new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(moveEvent);
    });

    // Check that CSS properties are set on all refs
    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("50px");
      expect(el.style.getPropertyValue("--dy")).toBe("50px");
    });
  });

  it("should handle negative delta on pointer move", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // Start drag at (200, 300)
    act(() => {
      result.current.onDragStart(createPointerEvent(200, 300));
    });

    // Move to (150, 250) - backwards
    act(() => {
      const moveEvent = new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(moveEvent);
    });

    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("-50px");
      expect(el.style.getPropertyValue("--dy")).toBe("-50px");
    });
  });

  it("should not set properties if drag was not started", () => {
    renderHook(() => useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }));

    // Try to move without starting drag
    act(() => {
      const moveEvent = new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(moveEvent);
    });

    // Properties should not be set
    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("");
      expect(el.style.getPropertyValue("--dy")).toBe("");
    });
  });

  it("should call onUpdate with delta on pointer up", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // Start drag at (100, 200)
    act(() => {
      result.current.onDragStart(createPointerEvent(100, 200));
    });

    // End drag at (180, 280)
    act(() => {
      const upEvent = new PointerEvent("pointerup", {
        clientX: 180,
        clientY: 280,
      });
      window.dispatchEvent(upEvent);
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(80, 80);
  });

  it("should remove CSS properties on pointer up", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // Start drag
    act(() => {
      result.current.onDragStart(createPointerEvent(100, 200));
    });

    // Move to set properties
    act(() => {
      const moveEvent = new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(moveEvent);
    });

    // Verify properties are set
    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("50px");
      expect(el.style.getPropertyValue("--dy")).toBe("50px");
    });

    // End drag
    act(() => {
      const upEvent = new PointerEvent("pointerup", {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(upEvent);
    });

    // Properties should be removed
    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("");
      expect(el.style.getPropertyValue("--dy")).toBe("");
    });
  });

  it("should remove event listeners on pointer up", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // Start drag
    act(() => {
      result.current.onDragStart(createPointerEvent(100, 200));
    });

    // End drag
    act(() => {
      const upEvent = new PointerEvent("pointerup", {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(upEvent);
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should handle complete drag workflow", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // Start drag at (100, 100)
    act(() => {
      result.current.onDragStart(createPointerEvent(100, 100));
    });

    // Move multiple times
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 120, clientY: 130 }),
      );
    });

    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("20px");
      expect(el.style.getPropertyValue("--dy")).toBe("30px");
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 150, clientY: 170 }),
      );
    });

    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("50px");
      expect(el.style.getPropertyValue("--dy")).toBe("70px");
    });

    // End drag
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerup", { clientX: 160, clientY: 180 }),
      );
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(60, 80);
    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("");
      expect(el.style.getPropertyValue("--dy")).toBe("");
    });
  });

  it("should handle multiple refs correctly", () => {
    const thirdElement = document.createElement("div");
    const threeRefs = [...mockRefs, { current: thirdElement }];

    const { result } = renderHook(() =>
      useDrag({ refs: threeRefs, onUpdate: mockOnUpdate }),
    );

    act(() => {
      result.current.onDragStart(createPointerEvent(100, 100));
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 125, clientY: 135 }),
      );
    });

    // All three elements should have properties set
    [...mockElements, thirdElement].forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("25px");
      expect(el.style.getPropertyValue("--dy")).toBe("35px");
    });
  });

  it("should handle null refs gracefully on pointer up", () => {
    const nullableRefs: RefObject<HTMLDivElement>[] = [
      { current: mockElements[0] },
      { current: null! },
    ];

    const { result } = renderHook(() =>
      useDrag({ refs: nullableRefs, onUpdate: mockOnUpdate }),
    );

    act(() => {
      result.current.onDragStart(createPointerEvent(100, 100));
    });

    // Should not throw when encountering null ref
    expect(() => {
      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointerup", { clientX: 150, clientY: 150 }),
        );
      });
    }).not.toThrow();

    expect(mockOnUpdate).toHaveBeenCalledWith(50, 50);
  });

  it("should allow starting a new drag after previous one ends", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    // First drag
    act(() => {
      result.current.onDragStart(createPointerEvent(100, 100));
    });
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerup", { clientX: 150, clientY: 150 }),
      );
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(50, 50);

    // Second drag
    act(() => {
      result.current.onDragStart(createPointerEvent(200, 200));
    });
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 250, clientY: 250 }),
      );
    });

    mockElements.forEach((el) => {
      expect(el.style.getPropertyValue("--dx")).toBe("50px");
      expect(el.style.getPropertyValue("--dy")).toBe("50px");
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerup", { clientX: 250, clientY: 250 }),
      );
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(50, 50);
    expect(mockOnUpdate).toHaveBeenCalledTimes(2);
  });

  it("should handle zero delta", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    act(() => {
      result.current.onDragStart(createPointerEvent(100, 100));
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerup", { clientX: 100, clientY: 100 }),
      );
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(0, 0);
  });

  it("should update CSS properties continuously during drag", () => {
    const { result } = renderHook(() =>
      useDrag({ refs: mockRefs, onUpdate: mockOnUpdate }),
    );

    act(() => {
      result.current.onDragStart(createPointerEvent(0, 0));
    });

    // Simulate continuous movement
    const positions = [
      { x: 10, y: 10 },
      { x: 20, y: 25 },
      { x: 30, y: 45 },
      { x: 25, y: 40 },
    ];

    positions.forEach(({ x, y }) => {
      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", { clientX: x, clientY: y }),
        );
      });

      mockElements.forEach((el) => {
        expect(el.style.getPropertyValue("--dx")).toBe(`${x}px`);
        expect(el.style.getPropertyValue("--dy")).toBe(`${y}px`);
      });
    });
  });
});
