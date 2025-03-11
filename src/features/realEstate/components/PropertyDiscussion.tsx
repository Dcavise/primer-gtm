import React from "react";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommentsSection from "@/components/CommentsSection";

interface PropertyDiscussionProps {
  propertyId: number;
}

const PropertyDiscussion: React.FC<PropertyDiscussionProps> = ({ propertyId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CommentsSection propertyId={propertyId} />
      </CardContent>
    </Card>
  );
};

export default PropertyDiscussion;
