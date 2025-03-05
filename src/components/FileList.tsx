
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { FileText, Image, FileIcon, Download, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

// Fix type definition to match what Supabase returns
interface FileObject {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>; // This matches Supabase's type
}

interface FileListProps {
  propertyId: number;
  onFileDeleted?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ propertyId, onFileDeleted }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fileDetailsOpen, setFileDetailsOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);

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

      // Fetch the metadata for each file
      const filesWithMetadata = await Promise.all((data || []).map(async (file) => {
        try {
          const { data: metadata } = await supabase.storage
            .from('property_documents')
            .getMetadata(`property_${propertyId}/${file.name}`);
          
          return {
            ...file,
            metadata: metadata || {}
          };
        } catch (err) {
          console.error(`Error fetching metadata for ${file.name}:`, err);
          return file;
        }
      }));

      setFiles(filesWithMetadata);
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

  const handleViewDetails = (file: FileObject) => {
    setSelectedFile(file);
    setFileDetailsOpen(true);
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
  const getDisplayName = (file: FileObject) => {
    // Check if we have custom metadata with a display name
    if (file.metadata && file.metadata.displayName) {
      return file.metadata.displayName;
    }
    
    // Fall back to the original filename without timestamp prefix
    return file.name.replace(/^\d+_/, '').split('.').slice(0, -1).join('.');
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
                    <span className="text-sm truncate" title={getDisplayName(file)}>
                      {getDisplayName(file)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(file)}
                      aria-label="View file details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
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
                
                {file.metadata && file.metadata.description && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {file.metadata.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Details Dialog */}
      <Dialog open={fileDetailsOpen} onOpenChange={setFileDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
            <DialogDescription>
              View information about this file
            </DialogDescription>
          </DialogHeader>
          
          {selectedFile && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">File Name</div>
                <div className="font-medium break-all">{selectedFile.name.replace(/^\d+_/, '')}</div>
              </div>
              
              {selectedFile.metadata && selectedFile.metadata.displayName && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Display Name</div>
                  <div className="font-medium break-all">{selectedFile.metadata.displayName}</div>
                </div>
              )}
              
              {selectedFile.metadata && selectedFile.metadata.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div className="break-all">{selectedFile.metadata.description}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Uploaded</div>
                <div>
                  {selectedFile.metadata && selectedFile.metadata.uploadedAt 
                    ? new Date(selectedFile.metadata.uploadedAt).toLocaleString() 
                    : new Date(selectedFile.created_at).toLocaleString()}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button 
                  onClick={() => {
                    handleDownload(selectedFile.name);
                    setFileDetailsOpen(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
