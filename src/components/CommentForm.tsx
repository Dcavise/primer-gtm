
import React, { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ComboBox } from './ui/combobox';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
}

interface CommentFormProps {
  propertyId: number;
  onCommentAdded: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ propertyId, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // Fetch user profiles for mentions
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }
      
      if (data) {
        setUserProfiles(data);
      }
    };
    
    fetchProfiles();
  }, []);

  // Handle textarea input to detect @ mentions
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setComment(newValue);
    
    // Check if user is typing a mention (after @)
    const lastAtIndex = newValue.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const afterAt = newValue.substring(lastAtIndex + 1);
      // If there's a space after @, don't show mention menu
      if (!afterAt.includes(' ') && lastAtIndex === newValue.length - afterAt.length - 1) {
        setMentionQuery(afterAt);
        setMentionStartIndex(lastAtIndex);
        setShowMentionMenu(true);
        return;
      }
    }
    
    setShowMentionMenu(false);
  };

  // Filter profiles based on mention query
  const filteredProfiles = userProfiles.filter(profile => {
    const searchTerm = mentionQuery.toLowerCase();
    const fullName = profile.full_name?.toLowerCase() || '';
    const email = profile.email.toLowerCase();
    
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });

  // Insert mention into comment
  const insertMention = (profile: UserProfile) => {
    if (mentionStartIndex >= 0) {
      const beforeMention = comment.substring(0, mentionStartIndex);
      const afterMention = comment.substring(mentionStartIndex + mentionQuery.length + 1);
      const mentionText = `@${profile.full_name || profile.email} `;
      
      setComment(beforeMention + mentionText + afterMention);
      setShowMentionMenu(false);
      
      // Focus back on textarea and place cursor after the inserted mention
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPosition = beforeMention.length + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }
  };

  // Submit the comment
  const handleSubmit = async () => {
    if (!comment.trim() || !user) return;
    
    setIsSending(true);
    
    try {
      // Insert the comment
      const { data: commentData, error: commentError } = await supabase
        .from('property_comments')
        .insert({
          property_id: propertyId,
          comment: comment,
          user_id: user.id
        })
        .select()
        .single();
      
      if (commentError) throw commentError;
      
      // Process mentions
      const mentions: { user_id: string, comment_id: string }[] = [];
      const mentionRegex = /@([\w\s.@]+?)(?:\s|$)/g;
      let match;
      
      while ((match = mentionRegex.exec(comment)) !== null) {
        const mentionText = match[1].trim();
        const mentionedUser = userProfiles.find(profile => 
          (profile.full_name && profile.full_name === mentionText) || 
          profile.email === mentionText
        );
        
        if (mentionedUser) {
          mentions.push({
            user_id: mentionedUser.id,
            comment_id: commentData.id
          });
        }
      }
      
      // Insert mentions if any
      if (mentions.length > 0) {
        const { error: mentionError } = await supabase
          .from('comment_mentions')
          .insert(mentions);
        
        if (mentionError) {
          console.error('Error adding mentions:', mentionError);
        }
      }
      
      setComment('');
      onCommentAdded();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="h-4 w-4 text-slate-600" />
        </div>
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... Use @ to mention others"
            value={comment}
            onChange={handleCommentChange}
            className="resize-none min-h-[100px]"
          />
          
          {showMentionMenu && filteredProfiles.length > 0 && (
            <div className="absolute z-10 bg-white shadow-md border rounded-md mt-1 w-full max-h-60 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                  onClick={() => insertMention(profile)}
                >
                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-slate-600" />
                  </div>
                  <span>{profile.full_name || profile.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!comment.trim() || isSending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" /> 
          {isSending ? 'Sending...' : 'Comment'}
        </Button>
      </div>
    </div>
  );
};

export default CommentForm;
