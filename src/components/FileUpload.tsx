
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileX } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  propertyId: number;
  onUploadComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ propertyId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Default the display name to the file name (without the extension)
      setDisplayName(selectedFile.name.split('.').slice(0, -1).join('.'));
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setDisplayName('');
    setDescription('');
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Format file path to include property ID for organization
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `property_${propertyId}/${fileName}`;
      
      // Create metadata with display name and description
      const metadata = {
        propertyId: propertyId,
        originalName: file.name,
        displayName: displayName || file.name.split('.').slice(0, -1).join('.'),
        description: description || '',
        uploadedAt: new Date().toISOString(),
      };
      
      // Upload the file with metadata
      const { error: uploadError } = await supabase.storage
        .from('property_documents')
        .upload(filePath, file, {
          metadata
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Make sure metadata is also updated separately (as some storage providers might not handle it correctly during upload)
      const { error: metadataError } = await supabase.storage
        .from('property_documents')
        .updateMetadata(filePath, metadata);
        
      if (metadataError) {
        console.warn('Error updating metadata:', metadataError);
        // We'll continue even if metadata update fails, as the file was uploaded successfully
      }
      
      toast.success('File uploaded successfully');
      setFile(null);
      setDisplayName('');
      setDescription('');
      
      // Call onUploadComplete to refresh the file list
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
        <div className="space-y-3 p-3 bg-muted/50 rounded border">
          <div className="text-sm truncate max-w-full">
            Selected file: <span className="font-medium">{file.name}</span>
          </div>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="display-name">Display Name (optional)</Label>
              <Input 
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter a name for this file"
                disabled={isUploading}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description">Description (optional)</Label>
              <Input 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this document"
                disabled={isUploading}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};
