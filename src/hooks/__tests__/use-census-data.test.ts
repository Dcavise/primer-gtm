import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCensusData } from "@/hooks/use-census-data";
import { toast } from "sonner";

// Mock the Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock the toast notifications
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Import the mocked supabase
import { supabase } from "@/integrations/supabase-client";

// Mock census data response
const mockCensusData = {
  totalPopulation: 5000,
  medianHouseholdIncome: 75000,
  medianHomeValue: 350000,
  educationLevelHS: 92.5,
  educationLevelBachelor: 45.2,
  unemploymentRate: 4.3,
  povertyRate: 9.8,
  medianAge: 38.5,
  categories: {
    demographic: [
      { name: "Population", value: "5,000" },
      { name: "Median Age", value: "38.5" },
    ],
    economic: [
      { name: "Median Household Income", value: "$75,000" },
      { name: "Unemployment Rate", value: "4.3%" },
    ],
    housing: [{ name: "Median Home Value", value: "$350,000" }],
    education: [{ name: "Bachelor's Degree or Higher", value: "45.2%" }],
  },
};

describe("useCensusData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCensusData());

    expect(result.current.censusData).toBeNull();
    expect(result.current.status).toBe("idle");
    expect(result.current.searchedAddress).toBe("");
    expect(result.current.isMockData).toBe(false);
  });

  it("should fetch census data successfully", async () => {
    // Mock successful response
    (supabase.functions.invoke as any).mockResolvedValue({
      data: {
        data: mockCensusData,
        searchedAddress: "123 Main St, Anytown, USA",
        isMockData: false,
        tractsIncluded: 5,
        blockGroupsIncluded: 10,
        radiusMiles: 5,
      },
      error: null,
    });

    const { result } = renderHook(() => useCensusData());

    await act(async () => {
      await result.current.fetchCensusData("123 Main St, Anytown, USA");
    });

    // Verify status and data
    expect(result.current.status).toBe("success");
    expect(result.current.censusData).toEqual(mockCensusData);
    expect(result.current.searchedAddress).toBe("123 Main St, Anytown, USA");
    expect(result.current.isMockData).toBe(false);

    // Verify toast notification
    expect(toast.success).toHaveBeenCalledWith("Census data retrieved", {
      description: expect.stringContaining("5 mile radius"),
    });
  });

  it("should handle mock data from API", async () => {
    // Mock response with mock data flag
    (supabase.functions.invoke as any).mockResolvedValue({
      data: {
        data: mockCensusData,
        searchedAddress: "123 Main St, Anytown, USA",
        isMockData: true,
        error: "Could not geocode the address",
        tractsIncluded: 0,
        blockGroupsIncluded: 0,
        radiusMiles: 5,
      },
      error: null,
    });

    const { result } = renderHook(() => useCensusData());

    await act(async () => {
      await result.current.fetchCensusData("123 Main St, Anytown, USA");
    });

    // Verify status and mock data flag
    expect(result.current.status).toBe("success");
    expect(result.current.isMockData).toBe(true);

    // Verify warning toast
    expect(toast.warning).toHaveBeenCalledWith("Using estimated census data", {
      description: expect.stringContaining("Could not geocode the address"),
    });
  });

  it("should handle API errors", async () => {
    // Mock error response
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: { message: "Function execution error" },
    });

    const { result } = renderHook(() => useCensusData());

    await act(async () => {
      await result.current.fetchCensusData("123 Main St, Anytown, USA");
    });

    // Verify error status
    expect(result.current.status).toBe("error");
    expect(result.current.censusData).toBeNull();

    // Verify error toast
    expect(toast.error).toHaveBeenCalledWith("Error retrieving census data", {
      description: expect.stringContaining("Function execution error"),
    });
  });

  it("should handle unexpected errors", async () => {
    // Mock unexpected failure
    (supabase.functions.invoke as any).mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useCensusData());

    await act(async () => {
      await result.current.fetchCensusData("123 Main St, Anytown, USA");
    });

    // Verify error status
    expect(result.current.status).toBe("error");
    expect(result.current.censusData).toBeNull();

    // Verify error toast
    expect(toast.error).toHaveBeenCalledWith("Error retrieving census data", {
      description: expect.stringContaining("please try again"),
    });
  });

  it("should reset data when called", () => {
    const { result } = renderHook(() => useCensusData());

    // Set some initial state
    act(() => {
      result.current.status = "success" as any;
      result.current.searchedAddress = "123 Main St";
      result.current.censusData = mockCensusData as any;
    });

    // Call reset
    act(() => {
      result.current.reset();
    });

    // Verify reset state
    expect(result.current.status).toBe("idle");
    expect(result.current.searchedAddress).toBe("");
    expect(result.current.censusData).toBeNull();
  });
});
