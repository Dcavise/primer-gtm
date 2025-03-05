
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/LoadingState';
import { toast } from 'sonner';
import { ChevronUp, MessageSquare, Send, Trash2, Edit, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  property_id: number;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles: Profile;
  mentions: Array<{ 
    id: string;
    user_id: string;
    profiles: Profile; 
  }>;
}

interface PropertyCommentsProps {
  propertyId: number;
}

export const PropertyComments: React.FC<PropertyCommentsProps> = ({ propertyId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments on initial load
  useEffect(() => {
    fetchComments();
    fetchProfiles();
  }, [propertyId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('property_comments')
        .select(`
          *,
          profiles:user_id(id, email, full_name, avatar_url),
          mentions:comment_mentions(
            id, 
            user_id,
            profiles:user_id(id, email, full_name, avatar_url)
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Check for @ symbol to trigger mentions
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    
    const textBeforeCursor = value.substring(0, cursorPos);
    const atSignIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atSignIndex !== -1 && (atSignIndex === 0 || textBeforeCursor[atSignIndex - 1] === ' ')) {
      const query = textBeforeCursor.substring(atSignIndex + 1);
      setMentionQuery(query);
      
      // Filter profiles based on query
      const filtered = profiles.filter(p => 
        (p.full_name && p.full_name.toLowerCase().includes(query.toLowerCase())) || 
        p.email.toLowerCase().includes(query.toLowerCase())
      );
      
      setFilteredProfiles(filtered);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (profile: Profile) => {
    if (textareaRef.current && cursorPosition !== null) {
      const beforeCursor = newComment.substring(0, cursorPosition);
      const atIndex = beforeCursor.lastIndexOf('@');
      
      if (atIndex !== -1) {
        const start = newComment.substring(0, atIndex);
        const end = newComment.substring(cursorPosition);
        const displayName = profile.full_name || profile.email.split('@')[0];
        const mentionText = `@${displayName} `;
        
        const newValue = start + mentionText + end;
        setNewComment(newValue);
        
        // Focus the textarea and place cursor after the mention
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = atIndex + mentionText.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
    
    setShowMentions(false);
  };

  const parseForMentions = async (comment: string, commentId: string) => {
    // Regular expression to match @username format
    const mentionRegex = /@([a-zA-Z0-9 ]+)/g;
    const matches = comment.match(mentionRegex);
    
    if (!matches) return;
    
    // Extract usernames and find corresponding user IDs
    for (const match of matches) {
      const username = match.substring(1).trim(); // Remove @ symbol
      
      // Find the user ID based on the username (full_name)
      const matchedProfile = profiles.find(p => 
        (p.full_name && p.full_name.toLowerCase() === username.toLowerCase()) || 
        p.email.split('@')[0].toLowerCase() === username.toLowerCase()
      );
      
      if (matchedProfile) {
        // Save the mention
        await supabase.from('comment_mentions').insert({
          comment_id: commentId,
          user_id: matchedProfile.id
        });
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setIsSending(true);
    
    try {
      // Insert the comment
      const { data, error } = await supabase
        .from('property_comments')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          comment: newComment.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Process mentions
      if (data) {
        await parseForMentions(newComment, data.id);
      }
      
      // Clear the input and refresh comments
      setNewComment('');
      fetchComments();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('property_comments')
        .update({ 
          comment: editText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Clear existing mentions
      await supabase
        .from('comment_mentions')
        .delete()
        .eq('comment_id', commentId);
      
      // Process new mentions
      await parseForMentions(editText, commentId);
      
      setEditingCommentId(null);
      fetchComments();
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const { error } = await supabase
        .from('property_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatCommentText = (text: string) => {
    // Replace @username with styled spans
    return text.replace(/@([a-zA-Z0-9 ]+)/g, (match, username) => {
      return `<span class="text-blue-500 font-medium">${match}</span>`;
    });
  };

  const renderAvatarFallback = (fullName: string | null, email: string) => {
    if (fullName) {
      const initials = fullName.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      return initials;
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Add a comment... Use @ to mention users"
                className="min-h-[100px] resize-y"
              />
              
              {showMentions && filteredProfiles.length > 0 && (
                <div className="absolute z-10 bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto w-full">
                  {filteredProfiles.map(profile => (
                    <div 
                      key={profile.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                      onClick={() => insertMention(profile)}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {renderAvatarFallback(profile.full_name, profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{profile.full_name || profile.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment} 
                disabled={isSending || !newComment.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Comment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border rounded-md bg-muted/50">
            <p>Please <a href="/auth" className="text-blue-500 hover:underline">sign in</a> to comment</p>
          </div>
        )}
        
        <Separator className="my-4" />
        
        {isLoading ? (
          <LoadingState message="Loading comments..." />
        ) : comments.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No comments yet</p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {renderAvatarFallback(comment.profiles.full_name, comment.profiles.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="font-medium">
                        {comment.profiles.full_name || comment.profiles.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={!editText.trim()}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formatCommentText(comment.comment) }}
                      />
                    )}
                  </div>
                  
                  {user && user.id === comment.user_id && !editingCommentId && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(comment)}
                        title="Edit comment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(comment.id)}
                        title="Delete comment"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {comment.mentions.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span>Mentioned: </span>
                    {comment.mentions.map((mention, index) => (
                      <span key={mention.id}>
                        {mention.profiles.full_name || mention.profiles.email.split('@')[0]}
                        {index < comment.mentions.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
