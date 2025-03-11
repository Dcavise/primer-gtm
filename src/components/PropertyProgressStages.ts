import { Stage } from "@/components/StageProgressBar";
import { PropertyPhase } from "@/types/realEstate";

// Map property phases to progress stages
export const getProgressStages = (): Stage[] => {
  return [
    {
      name: "New Site",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Initial Diligence",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Survey",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Test Fit",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Plan Production",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Permitting",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Construction",
      isCompleted: false,
      isCurrent: false,
    },
    {
      name: "Set Up",
      isCompleted: false,
      isCurrent: false,
    },
  ];
};

// This function maps a property's phase to the corresponding progress stages
export const mapPhaseToProgressStages = (phase: PropertyPhase | null): Stage[] => {
  const stages = getProgressStages();

  if (!phase) return stages;

  // Reset all stages to default state
  stages.forEach((stage) => {
    stage.isCompleted = false;
    stage.isCurrent = false;
  });

  // Determine which stages should be marked as completed or current based on the phase
  switch (phase) {
    case "0. New Site":
      stages[0].isCurrent = true;
      return stages;

    case "1. Initial Diligence":
      stages[0].isCompleted = true;
      stages[1].isCurrent = true;
      return stages;

    case "2. Survey":
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCurrent = true;
      return stages;

    case "3. Test Fit":
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCurrent = true;
      return stages;

    case "4. Plan Production":
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCurrent = true;
      return stages;

    case "5. Permitting":
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCompleted = true;
      stages[5].isCurrent = true;
      return stages;

    case "6. Construction":
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCompleted = true;
      stages[5].isCompleted = true;
      stages[6].isCurrent = true;
      return stages;

    case "7. Set Up":
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCompleted = true;
      stages[5].isCompleted = true;
      stages[6].isCompleted = true;
      stages[7].isCurrent = true;
      return stages;

    case "Hold":
    case "Deprioritize":
      // For special statuses, don't highlight any specific stage
      return stages;

    default:
      return stages;
  }
};
