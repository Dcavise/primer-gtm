
import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';

interface PropertyDocumentsProps {
  propertyId: number;
  fileRefreshKey: number;
  onUploadComplete: () => void;
}

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({
  propertyId,
  fileRefreshKey,
  onUploadComplete
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FolderOpen className="h-5 w-5 mr-2" />
          Document Repository
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload 
          propertyId={propertyId} 
          onUploadComplete={onUploadComplete} 
        />
        
        <div className="border-t pt-4">
          <h3 className="font-medium text-sm mb-3">Uploaded Documents</h3>
          <FileList 
            key={fileRefreshKey}
            propertyId={propertyId} 
            onFileDeleted={onUploadComplete}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyDocuments;
