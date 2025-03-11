import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase-client";
import Comment, { CommentData } from "./Comment";
import CommentForm from "./CommentForm";
import { MessageSquare } from "lucide-react";
import { Separator } from "./ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "./LoadingState";

interface CommentsSectionProps {
  propertyId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ propertyId }) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch comments with user profile info
      const { data: commentsData, error: commentsError } = await supabase
        .from("property_comments")
        .select(
          `
          *,
          user:user_id (
            full_name,
            email
          )
        `,
        )
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      // Fetch mentions for all comments
      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map((comment) => comment.id);

        const { data: mentionsData, error: mentionsError } = await supabase
          .from("comment_mentions")
          .select(
            `
            *,
            profile:user_id (
              full_name,
              email
            )
          `,
          )
          .in("comment_id", commentIds);

        if (mentionsError) {
          console.error("Error fetching mentions:", mentionsError);
        }

        // Add mentions to their respective comments
        if (mentionsData) {
          const commentsWithMentions = commentsData.map((comment) => {
            const commentMentions = mentionsData
              .filter((mention) => mention.comment_id === comment.id)
              .map((mention) => ({
                id: mention.id,
                user_id: mention.user_id,
                full_name: mention.profile?.full_name,
                email: mention.profile?.email,
              }));

            return {
              ...comment,
              mentions: commentMentions,
            };
          });

          setComments(commentsWithMentions);
        } else {
          setComments(commentsData);
        }
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
      setError("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [propertyId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 mr-2" />
        <h3 className="text-xl font-medium">Comments</h3>
      </div>

      <Separator />

      {user ? (
        <CommentForm propertyId={propertyId} onCommentAdded={fetchComments} />
      ) : (
        <div className="text-center text-muted-foreground py-4">
          Please sign in to add comments
        </div>
      )}

      <div className="space-y-4 mt-6">
        {isLoading ? (
          <LoadingState message="Loading comments..." />
        ) : error ? (
          <div className="text-center text-destructive py-4">{error}</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => <Comment key={comment.id} data={comment} />)
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
