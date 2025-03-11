import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStats } from "../useStats";
import * as baseStatsModule from "../useBaseStats";
import * as fellowsStatsModule from "../useFellowsStats";
import * as leadsStatsModule from "../useLeadsStats";
import * as opportunitiesStatsModule from "../useOpportunitiesStats";

// Define the SpyInstance type manually
type SpyInstance = ReturnType<typeof vi.spyOn>;

// Mock the imported modules
vi.mock("../useBaseStats", async () => {
  const actual = await vi.importActual("../useBaseStats");
  return {
    ...actual,
    useBaseStats: vi.fn(),
  };
});

vi.mock("../useFellowsStats", async () => {
  const actual = await vi.importActual("../useFellowsStats");
  return {
    ...actual,
    fetchFellowsStats: vi.fn(),
  };
});

vi.mock("../useLeadsStats", async () => {
  const actual = await vi.importActual("../useLeadsStats");
  return {
    ...actual,
    fetchLeadsStats: vi.fn(),
  };
});

vi.mock("../useOpportunitiesStats", async () => {
  const actual = await vi.importActual("../useOpportunitiesStats");
  return {
    ...actual,
    fetchOpportunitiesStats: vi.fn(),
  };
});

describe("useStats", () => {
  let useBaseStatsMock: SpyInstance;
  let fetchFellowsStatsMock: SpyInstance;
  let fetchLeadsStatsMock: SpyInstance;
  let fetchOpportunitiesStatsMock: SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock return values
    useBaseStatsMock = vi
      .spyOn(baseStatsModule, "useBaseStats")
      .mockReturnValue({
        stats: {
          fellowsCount: 0,
          leadsCount: 0,
          activeOpportunitiesCount: 0,
          closedWonOpportunitiesCount: 0,
        },
        setStats: vi.fn(),
        lastRefreshed: null,
        setLastRefreshed: vi.fn(),
        handleError: vi.fn(),
      });

    fetchFellowsStatsMock = vi
      .spyOn(fellowsStatsModule, "fetchFellowsStats")
      .mockResolvedValue({
        fellowsCount: 10,
        employmentStatusCounts: [{ status: "Active", count: 10 }],
      });

    fetchLeadsStatsMock = vi
      .spyOn(leadsStatsModule, "fetchLeadsStats")
      .mockResolvedValue({
        leadsCount: 20,
        weeklyLeadCounts: [{ week: "2023-01-01", count: 5 }],
      });

    fetchOpportunitiesStatsMock = vi
      .spyOn(opportunitiesStatsModule, "fetchOpportunitiesStats")
      .mockResolvedValue({
        activeOpportunitiesCount: 15,
        closedWonOpportunitiesCount: 5,
        opportunityStageCounts: [{ stage: "Family Interview", count: 8 }],
      });
  });

  it("should fetch all stats on mount", async () => {
    renderHook(() => useStats(null));

    // Verify all fetch functions were called
    await waitFor(() => {
      expect(fetchFellowsStatsMock).toHaveBeenCalledWith(
        null,
        expect.any(Function),
      );
      expect(fetchLeadsStatsMock).toHaveBeenCalledWith(
        null,
        expect.any(Function),
      );
      expect(fetchOpportunitiesStatsMock).toHaveBeenCalledWith(
        null,
        expect.any(Function),
      );
    });
  });

  it("should update stats with fetched data", async () => {
    const setStatsMock = vi.fn();
    vi.spyOn(baseStatsModule, "useBaseStats").mockReturnValue({
      stats: {
        fellowsCount: 0,
        leadsCount: 0,
        activeOpportunitiesCount: 0,
        closedWonOpportunitiesCount: 0,
      },
      setStats: setStatsMock,
      lastRefreshed: null,
      setLastRefreshed: vi.fn(),
      handleError: vi.fn(),
    });

    renderHook(() => useStats(null));

    await waitFor(() => {
      expect(setStatsMock).toHaveBeenCalledWith({
        fellowsCount: 10,
        leadsCount: 20,
        activeOpportunitiesCount: 15,
        closedWonOpportunitiesCount: 5,
      });
    });
  });

  it("should refetch stats when selectedCampusId changes", async () => {
    const { rerender } = renderHook(({ campusId }) => useStats(campusId), {
      initialProps: { campusId: null },
    });

    // Clear initial calls
    vi.clearAllMocks();

    // Change campus ID
    rerender({ campusId: "campus-123" });

    await waitFor(() => {
      expect(fetchFellowsStatsMock).toHaveBeenCalledWith(
        "campus-123",
        expect.any(Function),
      );
      expect(fetchLeadsStatsMock).toHaveBeenCalledWith(
        "campus-123",
        expect.any(Function),
      );
      expect(fetchOpportunitiesStatsMock).toHaveBeenCalledWith(
        "campus-123",
        expect.any(Function),
      );
    });
  });

  it("should set lastRefreshed timestamp after fetching", async () => {
    const setLastRefreshedMock = vi.fn();
    vi.spyOn(baseStatsModule, "useBaseStats").mockReturnValue({
      stats: {
        fellowsCount: 0,
        leadsCount: 0,
        activeOpportunitiesCount: 0,
        closedWonOpportunitiesCount: 0,
      },
      setStats: vi.fn(),
      lastRefreshed: null,
      setLastRefreshed: setLastRefreshedMock,
      handleError: vi.fn(),
    });

    renderHook(() => useStats(null));

    await waitFor(() => {
      expect(setLastRefreshedMock).toHaveBeenCalled();
      // Check if it's called with a Date object
      expect(setLastRefreshedMock.mock.calls[0][0] instanceof Date).toBe(true);
    });
  });

  it("should handle errors during fetching", async () => {
    const handleErrorMock = vi.fn();
    vi.spyOn(baseStatsModule, "useBaseStats").mockReturnValue({
      stats: {
        fellowsCount: 0,
        leadsCount: 0,
        activeOpportunitiesCount: 0,
        closedWonOpportunitiesCount: 0,
      },
      setStats: vi.fn(),
      lastRefreshed: null,
      setLastRefreshed: vi.fn(),
      handleError: handleErrorMock,
    });

    const testError = new Error("Test error");
    fetchFellowsStatsMock.mockRejectedValue(testError);

    renderHook(() => useStats(null));

    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledWith(testError);
    });
  });
});
