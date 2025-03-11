import React from "react";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";
import { Badge } from "./ui/badge";

export interface CommentMention {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
}

export interface CommentData {
  id: string;
  property_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user?: {
    full_name?: string;
    email: string;
  };
  mentions?: CommentMention[];
}

interface CommentProps {
  data: CommentData;
}

const Comment: React.FC<CommentProps> = ({ data }) => {
  // Function to replace @mentions with badges
  const renderCommentWithMentions = () => {
    if (!data.mentions || data.mentions.length === 0) {
      return <p>{data.comment}</p>;
    }

    const commentText = data.comment;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort mentions by their position in the comment
    const mentionMatches = data.mentions
      .map((mention) => {
        const mentionText = `@${mention.full_name || mention.email}`;
        const index = commentText.indexOf(mentionText);
        return { mention, index, text: mentionText };
      })
      .filter((match) => match.index !== -1)
      .sort((a, b) => a.index - b.index);

    // Build the comment with mentions highlighted
    mentionMatches.forEach(({ mention, index, text }) => {
      if (index > lastIndex) {
        elements.push(commentText.substring(lastIndex, index));
      }
      elements.push(
        <Badge key={mention.id} variant="secondary" className="mr-1 font-normal">
          @{mention.full_name || mention.email}
        </Badge>
      );
      lastIndex = index + text.length;
    });

    if (lastIndex < commentText.length) {
      elements.push(commentText.substring(lastIndex));
    }

    return <p>{elements}</p>;
  };

  return (
    <div className="border rounded-md p-4 space-y-2 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {data.user?.full_name || data.user?.email || "Unknown User"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="text-sm">{renderCommentWithMentions()}</div>
    </div>
  );
};

export default Comment;
