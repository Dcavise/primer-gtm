import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBaseStats } from "../useBaseStats";
import { mockToast } from "./setupTests";

describe("useBaseStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useBaseStats());

    expect(result.current.stats).toEqual({
      fellowsCount: 0,
      leadsCount: 0,
      activeOpportunitiesCount: 0,
      closedWonOpportunitiesCount: 0,
    });
    expect(result.current.lastRefreshed).toBeNull();
  });

  it("should update stats when setStats is called", () => {
    const { result } = renderHook(() => useBaseStats());

    const newStats = {
      fellowsCount: 10,
      leadsCount: 20,
      activeOpportunitiesCount: 15,
      closedWonOpportunitiesCount: 5,
    };

    act(() => {
      result.current.setStats(newStats);
    });

    expect(result.current.stats).toEqual(newStats);
  });

  it("should update lastRefreshed when setLastRefreshed is called", () => {
    const { result } = renderHook(() => useBaseStats());

    const now = new Date();

    act(() => {
      result.current.setLastRefreshed(now);
    });

    expect(result.current.lastRefreshed).toBe(now);
  });

  it("should handle error correctly", () => {
    const { result } = renderHook(() => useBaseStats());
    const testError = new Error("Test error");

    act(() => {
      result.current.handleError(testError);
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Failed to load analytics data",
    );
  });

  it("should handle error with custom message", () => {
    const { result } = renderHook(() => useBaseStats());
    const testError = new Error("Test error");
    const customMessage = "Custom error message";

    act(() => {
      result.current.handleError(testError, customMessage);
    });

    expect(mockToast.error).toHaveBeenCalledWith(customMessage);
  });
});
