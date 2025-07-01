// Jam Posts Page

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ErrorComponents";
import { useFormValidation } from "@/utils/errorHandling";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useSocket } from "@/contexts/SocketContext";
import { 
  AlertCircle, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Wifi, 
  WifiOff, 
  Plus, 
  Edit, 
  Trash2,
  MessageSquare,
  ThumbsUp,
  MapPin,
  User,
  Upload,
  X
} from "lucide-react";
import { format } from "date-fns";

export const JamPostsPage = () => {
  const [jamPosts, setJamPosts] = useState([]);
  const [filteredJamPosts, setFilteredJamPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const { isConnected, subscribeToEvent } = useSocket();
  const { validationErrors, setErrors, clearErrors } = useFormValidation();
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJamPost, setSelectedJamPost] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    user_id: "current",
    latitude: "",
    longitude: "",
    note: "",
    level: "medium",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const columns = [
    { 
      accessorKey: "id", 
      header: "ID",
      cell: ({ row }) => {
        return <span>#{row.getValue("id")}</span>;
      }
    },
    { 
      accessorKey: "level", 
      header: "Level",
      cell: ({ row }) => {
        const level = row.getValue("level");
        return getLevelBadge(level);
      }
    },
    { 
      accessorKey: "user.name", 
      header: "Posted By",
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? user.name : "Unknown";
      }
    },
    { 
      accessorKey: "note", 
      header: "Description",
      cell: ({ row }) => {
        const note = row.getValue("note");
        return note ? (
          <div className="max-w-[250px] truncate" title={note}>
            {note}
          </div>
        ) : (
          <span className="text-muted-foreground">No description</span>
        );
      }
    },
    { 
      accessorKey: "image", 
      header: "Image",
      cell: ({ row }) => {
        const image = row.getValue("image");
        return image ? (
          <img 
            src={`${import.meta.env.VITE_API_URL}/uploads/${image}`} 
            alt="Jam post" 
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <span className="text-muted-foreground text-sm">No image</span>
        );
      }
    },
    { 
      accessorKey: "commentCount", 
      header: "Comments",
      cell: ({ row }) => {
        const commentCount = row.getValue("commentCount");
        return (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>{commentCount}</span>
          </div>
        );
      }
    },
    { 
      accessorKey: "totalReactions", 
      header: "Reactions",
      cell: ({ row }) => {
        const totalReactions = row.getValue("totalReactions");
        return (
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            <span>{totalReactions}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "createdAt",
      header: "Posted On",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return format(date, "MMM d, yyyy h:mm a");
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const jamPost = row.original;
        const isOwner = jamPost.isOwner;
        
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleViewDetails(jamPost)}>
              <Eye className="h-4 w-4 mr-1" /> View
            </Button>
              <Button size="sm" variant="outline" onClick={() => handleEditClick(jamPost)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
        
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleDeleteClick(jamPost)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchJamPosts();
    fetchUsers();
    
    // Socket events for real-time updates
    const createUnsubscribe = subscribeToEvent('jam_post:created', (newJamPost) => {
      console.log('New jam post received:', newJamPost);
      setJamPosts(prev => [newJamPost, ...prev]);
    });
    
    const updateUnsubscribe = subscribeToEvent('jam_post:updated', (updatedJamPost) => {
      console.log('Jam post updated:', updatedJamPost);
      setJamPosts(prev => 
        prev.map(jamPost => 
          jamPost.id === updatedJamPost.id ? updatedJamPost : jamPost
        )
      );
    });
    
    const deleteUnsubscribe = subscribeToEvent('jam_post:deleted', (jamPostId) => {
      console.log('Jam post deleted:', jamPostId);
      setJamPosts(prev => 
        prev.filter(jamPost => jamPost.id !== parseInt(jamPostId))
      );
    });
    
    return () => {
      createUnsubscribe();
      updateUnsubscribe();
      deleteUnsubscribe();
    };
  }, []);

  useEffect(() => {
    filterJamPosts();
  }, [searchTerm, levelFilter, jamPosts]);
  
  const fetchJamPosts = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/jam-posts'
      });
      
      setJamPosts(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
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
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterJamPosts = useCallback(() => {
    let filtered = [...jamPosts];
    
    // Apply level filter
    if (levelFilter && levelFilter !== "all") {
      filtered = filtered.filter(jamPost => jamPost.level === levelFilter);
    }
    
    // Apply search filter (on note or user name)
    if (searchTerm) {
      filtered = filtered.filter(jamPost => 
        (jamPost.note && jamPost.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (jamPost.user && jamPost.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredJamPosts(filtered);
  }, [jamPosts, levelFilter, searchTerm]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleViewDetails = (jamPost) => {
    navigate(`/admin/jam-posts/${jamPost.id}`);
  };
  
  const handleCreateClick = () => {
    clearErrors();
    setFormData({
      user_id: "current",
      latitude: "",
      longitude: "",
      note: "",
      level: "medium",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsCreateDialogOpen(true);
  };
  
  const handleEditClick = (jamPost) => {
    clearErrors();
    setSelectedJamPost(jamPost);
    setFormData({
      user_id: jamPost.user_id?.toString() || "current",
      latitude: jamPost.latitude?.toString() || "",
      longitude: jamPost.longitude?.toString() || "",
      note: jamPost.note || "",
      level: jamPost.level,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsUpdateDialogOpen(true);
  };
  
  const handleDeleteClick = (jamPost) => {
    setSelectedJamPost(jamPost);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateJamPost = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('note', formData.note);
      formDataToSend.append('level', formData.level);
      
      if (formData.user_id && formData.user_id !== "current") {
        formDataToSend.append('user_id', formData.user_id);
      }
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      await request(
        {
          method: 'POST',
          url: '/jam-posts',
          data: formDataToSend,
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        },
        {
          successMessage: 'Jam post created successfully',
          onSuccess: () => {
            setIsCreateDialogOpen(false);
            fetchJamPosts();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };
  
  const handleUpdateJamPost = async () => {
    if (!selectedJamPost) return;
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('note', formData.note);
      formDataToSend.append('level', formData.level);
      
      // Include user_id if admin is changing it
      if (formData.user_id && formData.user_id !== "current") {
        formDataToSend.append('user_id', formData.user_id);
      }
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      await request(
        {
          method: 'PUT',
          url: `/jam-posts/${selectedJamPost.id}`,
          data: formDataToSend,
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        },
        {
          successMessage: 'Jam post updated successfully',
          onSuccess: () => {
            setIsUpdateDialogOpen(false);
            fetchJamPosts();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };
  
  const handleDeleteJamPost = async () => {
    if (!selectedJamPost) return;
    
    try {
      await request(
        {
          method: 'DELETE',
          url: `/jam-posts/${selectedJamPost.id}`
        },
        {
          successMessage: 'Jam post deleted successfully',
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            fetchJamPosts();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setLevelFilter("all");
  };

  // Helper function to get level badge
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Traffic Jam Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor traffic jam reports from users
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <Wifi className="h-3 w-3 mr-1" />
              Real-time Updates
            </div>
          )}
          
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-1" />
            New Jam Post
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          placeholder="Search by description or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredJamPosts} 
        isLoading={isLoading} 
        noResultsMessage="No jam posts found"
      />
      
      {/* Create Jam Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Jam Post</DialogTitle>
          </DialogHeader>
          
          <FormError error={validationErrors.general} />
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user_id">User (Optional - will use current user if not selected)</Label>
              <Select 
                value={formData.user_id} 
                onValueChange={(value) => handleSelectChange('user_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Use current user</SelectItem>
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

            <div className="grid gap-2">
              <Label htmlFor="image">Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded border"
                  />
                </div>
              )}
              <FormError error={validationErrors.image} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJamPost} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Jam Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Jam Post Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => {
        setIsUpdateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Jam Post #{selectedJamPost?.id}</DialogTitle>
          </DialogHeader>
          
          <FormError error={validationErrors.general} />
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user_id">User</Label>
              <Select 
                value={formData.user_id} 
                onValueChange={(value) => handleSelectChange('user_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Keep current user</SelectItem>
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

            <div className="grid gap-2">
              <Label htmlFor="image">Image (Optional)</Label>
              {selectedJamPost?.image && !imagePreview && (
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                  <img
                    src={`${import.meta.env.VITE_API_URL}/uploads/${selectedJamPost.image}`}
                    alt="Current"
                    className="w-32 h-32 object-cover rounded border"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded border"
                  />
                </div>
              )}
              <FormError error={validationErrors.image} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateJamPost} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Jam Post"}
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
            <Button 
              variant="destructive" 
              onClick={handleDeleteJamPost}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Jam Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
