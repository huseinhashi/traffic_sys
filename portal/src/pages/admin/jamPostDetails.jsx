import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/utils/errorHandling";
import { FormError } from "@/components/ErrorComponents";
import { MapSection } from "@/components/MapSection";
import { 
  AlertCircle, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle, 
  XCircle,
  MapPin, 
  User, 
  Clock, 
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  CheckSquare,
  Plus,
  Reply,
  Image as ImageIcon,
  Map
} from "lucide-react";
import { format } from "date-fns";
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your MapBox access token here
mapboxgl.accessToken = mapboxToken; // Replace with your actual MapBox access token
export const JamPostDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const { validationErrors, setErrors, clearErrors } = useFormValidation();
  const [jamPost, setJamPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddCommentDialogOpen, setIsAddCommentDialogOpen] = useState(false);
  const [isEditCommentDialogOpen, setIsEditCommentDialogOpen] = useState(false);
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    note: "",
    level: "medium",
  });
  const [commentFormData, setCommentFormData] = useState({
    user_id: "",
    content: "",
  });

  useEffect(() => {
    fetchJamPostDetails();
    fetchComments();
    fetchUsers();
  }, [id]);

  const fetchJamPostDetails = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: `/jam-posts/${id}`
      });
      console.log("Fetched jam post details:", data.data);
      setJamPost(data.data);
      if (data.data) {
        setFormData({
          latitude: data.data.latitude?.toString() || "",
          longitude: data.data.longitude?.toString() || "",
          note: data.data.note || "",
          level: data.data.level,
        });
      }
      console.log("post:", jamPost);
    } catch (error) {
      // Error handled by useApiRequest
      navigate('/admin/jams');
    }
  };

  const fetchComments = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: `/jam-posts/${id}/comments`
      });
      setComments(data.data || []);
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/users'
      });
      
      // Filter for regular users only
      const regularUsers = data.data.filter(user => user.role === 'user');
      setUsers(regularUsers);
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleUpdateJamPost = async () => {
    try {
      await request(
        {
          method: 'PUT',
          url: `/jam-posts/${id}`,
          data: formData
        },
        {
          successMessage: 'Jam post updated successfully',
          onSuccess: () => {
            setIsUpdateDialogOpen(false);
            fetchJamPostDetails();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleDeleteJamPost = async () => {
    try {
      await request(
        {
          method: 'DELETE',
          url: `/jam-posts/${id}`
        },
        {
          successMessage: 'Jam post deleted successfully',
          onSuccess: () => {
            navigate('/admin/jams');
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleAddComment = async () => {
    try {
      await request(
        {
          method: 'POST',
          url: `/jam-posts/${id}/comments`,
          data: commentFormData
        },
        {
          successMessage: 'Comment added successfully',
          onSuccess: () => {
            setIsAddCommentDialogOpen(false);
            setCommentFormData({ user_id: "", content: "" });
            fetchComments();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleEditComment = async () => {
    if (!selectedComment) return;
    
    try {
      await request(
        {
          method: 'PUT',
          url: `/comments/${selectedComment.id}`,
          data: commentFormData
        },
        {
          successMessage: 'Comment updated successfully',
          onSuccess: () => {
            setIsEditCommentDialogOpen(false);
            setCommentFormData({ user_id: "", content: "" });
            setSelectedComment(null);
            fetchComments();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;
    
    try {
      await request(
        {
          method: 'DELETE',
          url: `/comments/${selectedComment.id}`
        },
        {
          successMessage: 'Comment deleted successfully',
          onSuccess: () => {
            setIsDeleteCommentDialogOpen(false);
            setSelectedComment(null);
            fetchComments();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommentInputChange = (e) => {
    const { name, value } = e.target;
    setCommentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommentSelectChange = (name, value) => {
    setCommentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCommentClick = (comment) => {
    setSelectedComment(comment);
    setCommentFormData({ 
      user_id: comment.user_id?.toString() || "", 
      content: comment.content 
    });
    setIsEditCommentDialogOpen(true);
  };

  const handleDeleteCommentClick = (comment) => {
    setSelectedComment(comment);
    setIsDeleteCommentDialogOpen(true);
  };

  const handleReaction = async (reactionType) => {
    try {
      await request(
        {
          method: 'POST',
          url: `/jam-posts/${id}/reactions`,
          data: { reaction_type: reactionType }
        },
        {
          successMessage: 'Reaction added successfully',
          onSuccess: () => {
            fetchJamPostDetails();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  // Helper functions for badges
  const getLevelBadge = (level) => {
    switch (level) {
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200">
            High
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            Critical
          </Badge>
        );
      default:
        return <Badge>{level}</Badge>;
    }
  };

  const getReactionIcon = (type) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="h-4 w-4" />;
      case "dislike":
        return <ThumbsDown className="h-4 w-4" />;
      case "helpful":
        return <HelpCircle className="h-4 w-4" />;
      case "accurate":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <ThumbsUp className="h-4 w-4" />;
    }
  };

  if (isLoading && !jamPost) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4 mx-auto animate-pulse" />
          <h3 className="text-lg font-medium">Loading jam post details...</h3>
        </div>
      </div>
    );
  }

  if (!jamPost) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 mx-auto" />
          <h3 className="text-lg font-medium">Jam post not found</h3>
          <p className="text-muted-foreground mt-1">
            The jam post you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/admin/jams')}
          >
            Back to Jam Posts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/admin/jams')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Jam Post #{id}</h2>
        </div>
        
        <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsUpdateDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Jam Post Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Jam Post Details</span>
              <div className="flex gap-2">
                {getLevelBadge(jamPost.level)}
              </div>
            </CardTitle>
            <CardDescription>
              Posted on {format(new Date(jamPost.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Description</Label>
              <div className="mt-1 text-sm rounded-md bg-muted p-3">
                {jamPost.note || "No description provided"}
              </div>
            </div>
            
            {/* Image Section */}
            {jamPost.image && (
              <>
                <Separator />
                <div>
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </Label>
                  <div className="mt-2">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/${jamPost.image}`}
                      alt="Jam post"
                      className="max-w-full h-auto rounded-lg border"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            
            <div>
              <Label>Location</Label>
              <div className="mt-1 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="text-sm">
                  {jamPost.latitude && jamPost.longitude && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Coordinates: {jamPost.latitude}, {jamPost.longitude}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reactions Section */}
            <Separator />
            <div>
              <Label>Reactions</Label>
              <div className="mt-2 flex gap-2">
                {Object.entries(jamPost.reactionCounts || {}).map(([type, count]) => (
                  <Button
                    key={type}
                    variant={jamPost.userReaction === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleReaction(type)}
                    disabled={jamPost.userReaction === type}
                  >
                    {getReactionIcon(type)}
                    <span className="ml-1">{count}</span>
                  </Button>
                ))}
              </div>
            </div>
            {/* {jamPost.latitude && jamPost.longitude && <MapSection jamPost={jamPost} />} */}
          </CardContent>
        </Card>

        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle>Posted By</CardTitle>
            <CardDescription>
              User who reported the traffic jam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jamPost.user ? (
              <>
                <div>
                  <Label>Name</Label>
                  <div className="mt-1 text-sm font-medium">
                    {jamPost.user.name}
                  </div>
                </div>
                
                <div>
                  <Label>Email</Label>
                  <div className="mt-1 text-sm">
                    {jamPost.user.email}
                  </div>
                </div>
                
                <div>
                  <Label>Role</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{jamPost.user.role}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                User information not available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Map Section - Outside the grid to prevent overlap */}
      {jamPost.latitude && jamPost.longitude && ( 
        <Card>
        
          <CardContent>
            <MapSection 
              jamPost={jamPost}
            />
          </CardContent>
        </Card>
       )}
      
      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Comments ({comments.length})</span>
            <Button onClick={() => setIsAddCommentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/${comment.user.avatar}` : undefined} />
                        <AvatarFallback>
                          {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{comment.user?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                        </div>
                      </div>
                    </div>
                   
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCommentClick(comment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCommentClick(comment)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                
                  </div>
                  <div className="mt-3 text-sm">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No comments yet</p>
              <Button 
                className="mt-4" 
                onClick={() => setIsAddCommentDialogOpen(true)}
              >
                Add First Comment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Jam Post Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => {
        setIsUpdateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Jam Post #{id}</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="level">Jam Level</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => handleSelectChange('level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <FormError error={validationErrors.level} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="note">Description</Label>
              <Textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Describe the traffic jam situation"
                value={formData.note}
                onChange={handleInputChange}
              />
              <FormError error={validationErrors.note} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  placeholder="e.g. 40.7128"
                  value={formData.latitude}
                  onChange={handleInputChange}
                />
                <FormError error={validationErrors.latitude} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  placeholder="e.g. -74.0060"
                  value={formData.longitude}
                  onChange={handleInputChange}
                />
                <FormError error={validationErrors.longitude} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateJamPost} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Jam Post Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Jam Post</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this jam post?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. All comments and reactions will also be deleted.
          </p>
          <FormError error={validationErrors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteJamPost} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={isAddCommentDialogOpen} onOpenChange={(open) => {
        setIsAddCommentDialogOpen(open);
        if (!open) {
          clearErrors();
          setCommentFormData({ user_id: "", content: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user_id">User</Label>
              <Select 
                value={commentFormData.user_id} 
                onValueChange={(value) => handleCommentSelectChange('user_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.user_id} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Comment</Label>
              <Textarea
                id="content"
                name="content"
                rows={4}
                placeholder="Write your comment..."
                value={commentFormData.content}
                onChange={handleCommentInputChange}
              />
              <FormError error={validationErrors.content} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Comment Dialog */}
      <Dialog open={isEditCommentDialogOpen} onOpenChange={(open) => {
        setIsEditCommentDialogOpen(open);
        if (!open) {
          clearErrors();
          setCommentFormData({ user_id: "", content: "" });
          setSelectedComment(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user_id">User</Label>
              <Select 
                value={commentFormData.user_id} 
                onValueChange={(value) => handleCommentSelectChange('user_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.user_id} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Comment</Label>
              <Textarea
                id="content"
                name="content"
                rows={4}
                placeholder="Write your comment..."
                value={commentFormData.content}
                onChange={handleCommentInputChange}
              />
              <FormError error={validationErrors.content} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditComment} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Dialog */}
      <Dialog open={isDeleteCommentDialogOpen} onOpenChange={setIsDeleteCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this comment?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone.
          </p>
          <FormError error={validationErrors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};