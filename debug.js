// Add this to EnhancedFamilyDetail.tsx after the mergeStudents line
console.log('Family record from Supabase:', {
  id: familyRecord.family_id,
  name: familyRecord.family_name,
  lifetime_value: familyRecord.lifetime_value,
  has_students_array: Array.isArray(familyRecord.students),
  students_length: familyRecord.students?.length || 0,
  opportunity_ids: familyRecord.opportunity_ids?.length,
  opportunity_count: familyRecord.opportunity_count
});
