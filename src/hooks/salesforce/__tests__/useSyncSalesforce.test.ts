import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSyncSalesforce } from "@/hooks/salesforce/useSyncSalesforce";
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

describe("useSyncSalesforce", () => {
  const mockOnSyncComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useSyncSalesforce(mockOnSyncComplete));

    expect(result.current.syncLoading).toBe(false);
    expect(result.current.syncError).toBeNull();
    expect(result.current.syncStatus).toEqual({
      leads: "idle",
      opportunities: "idle",
      fellows: "idle",
    });
  });

  it("should handle successful sync for all data types", async () => {
    // Mock successful responses for all function calls
    (supabase.functions.invoke as any).mockImplementation(
      (functionName: string) => {
        if (functionName === "sync-salesforce-leads") {
          return Promise.resolve({
            data: { success: true, synced: 10 },
            error: null,
          });
        } else if (functionName === "sync-salesforce-opportunities") {
          return Promise.resolve({
            data: { success: true, synced: 5 },
            error: null,
          });
        } else if (functionName === "sync-fellows-data") {
          return Promise.resolve({
            data: { success: true, result: { inserted: 15 } },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
    );

    const { result } = renderHook(() => useSyncSalesforce(mockOnSyncComplete));

    await act(async () => {
      await result.current.syncSalesforceData();
    });

    // Check that sync status was updated correctly
    expect(result.current.syncStatus).toEqual({
      leads: "success",
      opportunities: "success",
      fellows: "success",
    });

    // Check that toasts were displayed
    expect(toast.info).toHaveBeenCalledWith(
      "Starting complete Salesforce data sync...",
    );
    expect(toast.success).toHaveBeenCalledWith("Synced 10 leads");
    expect(toast.success).toHaveBeenCalledWith("Synced 5 opportunities");
    expect(toast.success).toHaveBeenCalledWith("Synced 15 fellows");

    // Check that the completion callback was called
    expect(mockOnSyncComplete).toHaveBeenCalled();
  });

  it("should handle errors in sync process", async () => {
    // Mock an error for leads sync
    (supabase.functions.invoke as any).mockImplementation(
      (functionName: string) => {
        if (functionName === "sync-salesforce-leads") {
          return Promise.resolve({
            data: null,
            error: { message: "API error" },
          });
        } else if (functionName === "sync-salesforce-opportunities") {
          return Promise.resolve({
            data: { success: true, synced: 5 },
            error: null,
          });
        } else if (functionName === "sync-fellows-data") {
          return Promise.resolve({
            data: { success: true, result: { inserted: 15 } },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
    );

    const { result } = renderHook(() => useSyncSalesforce(mockOnSyncComplete));

    await act(async () => {
      await result.current.syncSalesforceData();
    });

    // Check that sync status was updated correctly
    expect(result.current.syncStatus.leads).toBe("error");
    expect(result.current.syncStatus.opportunities).toBe("success");
    expect(result.current.syncStatus.fellows).toBe("success");

    // Check error toast was displayed
    expect(toast.error).toHaveBeenCalledWith("Error syncing leads: API error");
  });

  it("should handle unexpected errors during sync", async () => {
    // Mock a complete failure
    (supabase.functions.invoke as any).mockRejectedValue(
      new Error("Unexpected error"),
    );

    const { result } = renderHook(() => useSyncSalesforce(mockOnSyncComplete));

    await act(async () => {
      await result.current.syncSalesforceData();
    });

    // Verify error state
    expect(result.current.syncError).toBe("Unexpected error");
    expect(toast.error).toHaveBeenCalledWith(
      "Error in sync process: Unexpected error",
    );
    expect(result.current.syncLoading).toBe(false);
  });
});
