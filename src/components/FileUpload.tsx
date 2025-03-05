
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileX } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  propertyId: number;
  onUploadComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ propertyId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Format file path to include property ID for organization
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `property_${propertyId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('property_documents')
        .upload(filePath, file);
      
      if (error) {
        throw error;
      }
      
      toast.success('File uploaded successfully');
      setFile(null);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          className="flex-1"
          disabled={isUploading}
        />
        {file && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClearFile}
            disabled={isUploading}
            aria-label="Clear selected file"
          >
            <FileX className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {file && (
        <div className="flex justify-between items-center p-2 bg-muted/50 rounded border">
          <span className="text-sm truncate max-w-[250px]">{file.name}</span>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};
