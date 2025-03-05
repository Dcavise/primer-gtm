
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Image, FileIcon, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileObject {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

interface FileListProps {
  propertyId: number;
  onFileDeleted?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ propertyId, onFileDeleted }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      // List files with the property prefix
      const { data, error } = await supabase.storage
        .from('property_documents')
        .list(`property_${propertyId}`, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const filePath = `property_${propertyId}/${fileName}`;
      const { data, error } = await supabase.storage
        .from('property_documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const filePath = `property_${propertyId}/${fileName}`;
      const { error } = await supabase.storage
        .from('property_documents')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast.success('File deleted successfully');
      fetchFiles();
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format file name for display
  const formatFileName = (fileName: string) => {
    // Remove timestamp prefix if present (e.g., 1631234567_filename.pdf)
    return fileName.replace(/^\d+_/, '');
  };

  useEffect(() => {
    fetchFiles();
  }, [propertyId]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading files...</div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center p-4 bg-muted/20 rounded-md">
          <p className="text-muted-foreground">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="hover:bg-accent/5 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {getFileIcon(file.name)}
                    <span className="text-sm truncate" title={formatFileName(file.name)}>
                      {formatFileName(file.name)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file.name)}
                      aria-label="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(file.name)}
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
