import { z } from "zod";
import {
  PropertyPhase,
  BooleanStatus,
  SurveyStatus,
  TestFitStatus,
  LeaseStatus,
} from "@/types/realEstate";

// Define the enum types based on the existing types in realEstate.ts
const BooleanStatusEnum = z.enum(["true", "false", "unknown"]).nullable();
const SurveyStatusEnum = z.enum(["complete", "pending", "unknown"]).nullable();
const TestFitStatusEnum = z.enum(["unknown", "pending", "complete"]).nullable();
const LeaseStatusEnum = z.enum(["pending", "sent", "signed"]).nullable();
const PhaseEnum = z
  .enum([
    "0. New Site",
    "1. Initial Diligence",
    "2. Survey",
    "3. Test Fit",
    "4. Plan Production",
    "5. Permitting",
    "6. Construction",
    "7. Set Up",
    "Hold",
    "Deprioritize",
  ])
  .nullable();

// Main property schema that matches your database structure
export const propertySchema = z.object({
  // Database fields
  id: z.number().optional(), // Optional for new entries
  created_at: z.string().optional(), // Optional as it's auto-generated

  // Basic information
  address: z.string().nullable().optional(),
  site_name: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  sf_available: z.string().nullable().optional(),

  // Landlord information
  ll_poc: z.string().nullable().optional(),
  ll_phone: z.string().nullable().optional(),
  ll_email: z.string().email("Invalid email format").nullable().optional(),

  // Property features
  fire_sprinklers: BooleanStatusEnum.optional(),
  fiber: BooleanStatusEnum.optional(),
  zoning: z.string().nullable().optional(),
  permitted_use: z.string().nullable().optional(),
  parking: z.string().nullable().optional(),

  // Authority Having Jurisdiction (AHJ) information
  ahj_zoning_confirmation: BooleanStatusEnum.optional(),
  ahj_building_records: z.string().nullable().optional(),

  // Status tracking
  survey_status: SurveyStatusEnum.optional(),
  test_fit_status: TestFitStatusEnum.optional(),
  loi_status: LeaseStatusEnum.optional(),
  lease_status: LeaseStatusEnum.optional(),
  status_notes: z.string().nullable().optional(),

  // Phasing information
  phase_group: z.string().nullable().optional(),
  campus_id: z.string().nullable().optional(),
  phase: PhaseEnum.optional(),
});

// Type for use in TypeScript
export type PropertyFormValues = z.infer<typeof propertySchema>;

// For form submission, we might want to exclude certain fields
export const propertySubmitSchema = propertySchema.omit({
  id: true,
  created_at: true,
});

export type PropertySubmitValues = z.infer<typeof propertySubmitSchema>;

// Sub-schemas for different sections of the form
export const propertyBasicInfoSchema = propertySchema.pick({
  address: true,
  site_name: true,
  market: true,
  sf_available: true,
  phase: true,
  zoning: true,
  permitted_use: true,
  parking: true,
  fire_sprinklers: true,
  fiber: true,
});

export const propertyLandlordSchema = propertySchema.pick({
  ll_poc: true,
  ll_phone: true,
  ll_email: true,
});

export const propertyStatusSchema = propertySchema.pick({
  ahj_zoning_confirmation: true,
  ahj_building_records: true,
  survey_status: true,
  test_fit_status: true,
  loi_status: true,
  lease_status: true,
  status_notes: true,
});

// Field validators for individual field validation
export const fieldValidators = {
  sf_available: z.string().nullable().optional(),
  zoning: z.string().nullable().optional(),
  permitted_use: z.string().nullable().optional(),
  parking: z.string().nullable().optional(),
  fire_sprinklers: BooleanStatusEnum.optional(),
  fiber: BooleanStatusEnum.optional(),
  phase: PhaseEnum.optional(),
  ll_poc: z.string().nullable().optional(),
  ll_phone: z.string().nullable().optional(),
  ll_email: z.string().email("Invalid email format").nullable().optional(),
  ahj_zoning_confirmation: BooleanStatusEnum.optional(),
  ahj_building_records: z.string().nullable().optional(),
  survey_status: SurveyStatusEnum.optional(),
  test_fit_status: TestFitStatusEnum.optional(),
  loi_status: LeaseStatusEnum.optional(),
  lease_status: LeaseStatusEnum.optional(),
};
