import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchFellowsStats } from "../useFellowsStats";
import { mockSupabase } from "./setupTests";

describe("fetchFellowsStats", () => {
  const mockHandleError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Ensure all mock methods return the mock object for chaining
    Object.values(mockSupabase).forEach((method) => {
      if (typeof method === "function") {
        (method as any).mockReturnValue(mockSupabase);
      }
    });
  });

  it("should return correct data when API call succeeds", async () => {
    // Mock data
    const mockFellowsData = [
      { id: 1, fellow_name: "John Doe", fte_employment_status: "Active" },
      { id: 2, fellow_name: "Jane Smith", fte_employment_status: "Active" },
      { id: 3, fellow_name: "Bob Johnson", fte_employment_status: "Open" },
    ];

    // Setup the promise to be returned at the end of the chain
    const mockResponse = Promise.resolve({
      count: 3,
      data: mockFellowsData,
      error: null,
    });

    // Setup the last method in the chain to return a thenable that resolves to our mock data
    mockSupabase.or.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => mockResponse.then(callback),
      };
    });

    const result = await fetchFellowsStats([], mockHandleError);

    expect(result.fellowsCount).toBe(3);
    expect(result.employmentStatusCounts.length).toBe(2); // Active and Open statuses
    expect(result.employmentStatusCounts[0].status).toBe("Active");
    expect(result.employmentStatusCounts[0].count).toBe(2);
    expect(result.employmentStatusCounts[1].status).toBe("Open");
    expect(result.employmentStatusCounts[1].count).toBe(1);
  });

  it("should filter by campus ID when provided", async () => {
    const campusIds = ["campus-123"];

    // Setup the promise to be returned at the end of the chain
    const mockResponse = Promise.resolve({
      count: 2,
      data: [
        { id: 1, fellow_name: "John Doe", fte_employment_status: "Active" },
        { id: 2, fellow_name: "Jane Smith", fte_employment_status: "Active" },
      ],
      error: null,
    });

    // Setup the last method in the chain to return a thenable
    mockSupabase.or.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => mockResponse.then(callback),
      };
    });

    const result = await fetchFellowsStats(campusIds, mockHandleError);

    expect(result.fellowsCount).toBe(2);
  });

  it("should handle API error", async () => {
    const mockError = new Error("API error");

    // Setup the promise to be returned at the end of the chain
    const mockResponse = Promise.resolve({
      count: null,
      data: null,
      error: mockError,
    });

    // Setup the last method in the chain to return a thenable
    mockSupabase.or.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => mockResponse.then(callback),
      };
    });

    await fetchFellowsStats([], mockHandleError);

    expect(mockHandleError).toHaveBeenCalledWith(mockError, "Error fetching fellows stats");
  });

  it("should return empty data on error", async () => {
    const mockError = new Error("API error");

    // Setup the promise to be returned at the end of the chain
    const mockResponse = Promise.resolve({
      count: null,
      data: null,
      error: mockError,
    });

    // Setup the last method in the chain to return a thenable
    mockSupabase.or.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => mockResponse.then(callback),
      };
    });

    const result = await fetchFellowsStats([], mockHandleError);

    expect(result).toEqual({
      fellowsCount: 0,
      employmentStatusCounts: [],
    });
  });
});
