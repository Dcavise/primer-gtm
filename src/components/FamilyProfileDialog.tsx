import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * FamilyProfileDialog
 *
 * This component is responsible for redirecting to the family profile page when triggered.
 * Instead of displaying a dialog, it navigates to the /family/:familyId route.
 */
const FamilyProfileDialog: React.FC<{
  familyId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ familyId, isOpen, onClose }) => {
  const navigate = useNavigate();

  // Navigate to the family profile page when the dialog is opened
  useEffect(() => {
    if (isOpen && familyId) {
      navigate(`/family/${familyId}`);
      // Close the dialog after navigation
      onClose();
    }
  }, [isOpen, familyId, navigate, onClose]);

  // We don't need to render the dialog anymore as we're navigating to a dedicated page
  return null;
};

export default FamilyProfileDialog;
