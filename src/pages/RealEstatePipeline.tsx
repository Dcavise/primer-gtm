
import React, { useState } from "react";
import { RealEstatePipelineSync } from "@/components/RealEstatePipelineSync";
import { useRealEstatePipelineSync } from "@/hooks/useRealEstatePipelineSync";
import { SyncStatusDisplay } from "@/components/RealEstatePipeline/SyncStatusDisplay";
import { SyncStatsInfo } from "@/components/RealEstatePipeline/SyncStatsInfo";
import { PipelineAnalytics } from "@/components/RealEstatePipeline/PipelineAnalytics";
import { SyncErrorAlert } from "@/components/RealEstatePipeline/SyncErrorAlert";
import { Navbar } from "@/components/Navbar";

export default function RealEstatePipelinePage() {
  const {
    syncStatus,
    syncStats,
    pipelineAnalytics,
    syncError,
    startSync,
    stopSync,
    isSyncing,
    lastSyncTime,
  } = useRealEstatePipelineSync();

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const openSyncModal = () => {
    setIsSyncModalOpen(true);
  };

  const closeSyncModal = () => {
    setIsSyncModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Real Estate Pipeline</h1>
            <Navbar />
          </div>
          <p className="text-white/80 mt-2">
            Monitor and analyze your real estate acquisition pipeline
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {syncError && <SyncErrorAlert error={syncError} />}

        <SyncStatusDisplay
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          openSyncModal={openSyncModal}
        />

        <SyncStatsInfo syncStats={syncStats} />

        <PipelineAnalytics pipelineAnalytics={pipelineAnalytics} />

        <RealEstatePipelineSync
          isOpen={isSyncModalOpen}
          onClose={closeSyncModal}
          startSync={startSync}
          stopSync={stopSync}
          isSyncing={isSyncing}
        />
      </main>
    </div>
  );
};
