import { supabase } from "@/integrations/supabase-client";

interface FileMetadata {
  propertyId: number;
  filePath: string;
  fileName: string;
  displayName: string;
  description: string;
  uploadedAt: string;
}

export const storeFileMetadata = async (metadata: FileMetadata) => {
  try {
    const { error } = await supabase.from("property_file_metadata").insert({
      property_id: metadata.propertyId,
      file_path: metadata.filePath,
      file_name: metadata.fileName,
      display_name: metadata.displayName,
      description: metadata.description,
      uploaded_at: metadata.uploadedAt,
    });

    if (error) {
      console.error("Error storing file metadata:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception storing file metadata:", err);
    return false;
  }
};

export const getFileMetadata = async (propertyId: number, filePath: string) => {
  try {
    const { data, error } = await supabase
      .from("property_file_metadata")
      .select("*")
      .eq("property_id", propertyId)
      .eq("file_path", filePath)
      .single();

    if (error) {
      console.error("Error retrieving file metadata:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception retrieving file metadata:", err);
    return null;
  }
};

export const getAllFileMetadata = async (propertyId: number) => {
  try {
    const { data, error } = await supabase
      .from("property_file_metadata")
      .select("*")
      .eq("property_id", propertyId);

    if (error) {
      console.error("Error retrieving all file metadata:", error);
      return [];
    }

    return data;
  } catch (err) {
    console.error("Exception retrieving all file metadata:", err);
    return [];
  }
};

export const deleteFileMetadata = async (propertyId: number, filePath: string) => {
  try {
    const { error } = await supabase
      .from("property_file_metadata")
      .delete()
      .eq("property_id", propertyId)
      .eq("file_path", filePath);

    if (error) {
      console.error("Error deleting file metadata:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception deleting file metadata:", err);
    return false;
  }
};
