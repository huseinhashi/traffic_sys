import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/utils/errorHandling";
import { FormError } from "@/components/ErrorComponents";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Send, 
  MessageSquare,
  Users,
  Calendar,
  Clock
} from "lucide-react";

export const ConversationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const { validationErrors, setErrors, clearErrors } = useFormValidation();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [formData, setFormData] = useState({ sender_id: "", content: "", image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
    fetchUsers();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const data = await request({ method: "GET", url: `/conversations/${id}` });
      setConversation(data.data);
    } catch (error) {
      navigate("/admin/conversations");
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await request({ method: "GET", url: `/conversations/${id}/messages` });
      setMessages(data.data || []);
    } catch (error) {}
  };

  const fetchUsers = async () => {
    try {
      const data = await request({ method: "GET", url: "/users" });
      setUsers(data.data || []);
    } catch (error) {}
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAddClick = () => {
    clearErrors();
    setFormData({ sender_id: "", content: "", image: null });
    setImagePreview(null);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (message) => {
    clearErrors();
    setSelectedMessage(message);
    setFormData({
      sender_id: message.sender_id?.toString() || "",
      content: message.content || "",
      image: null,
    });
    setImagePreview(message.image ? `${import.meta.env.VITE_API_URL}/uploads/${message.image}` : null);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (message) => {
    setSelectedMessage(message);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleAddMessage = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("sender_id", formData.sender_id);
      formDataToSend.append("content", formData.content);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }
      await request(
        {
          method: "POST",
          url: `/conversations/${id}/messages`,
          data: formDataToSend,
          headers: { "Content-Type": "multipart/form-data" },
        },
        {
          successMessage: "Message sent successfully",
          onSuccess: () => {
            setIsAddDialogOpen(false);
            setFormData({ sender_id: "", content: "", image: null });
            setImagePreview(null);
            fetchMessages();
          },
          onError: (errors) => setErrors(errors),
        }
      );
    } catch (error) {}
  };

  const handleEditMessage = async () => {
    if (!selectedMessage) return;
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("sender_id", formData.sender_id);
      formDataToSend.append("content", formData.content);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }
      await request(
        {
          method: "PUT",
          url: `/messages/${selectedMessage.id}`,
          data: formDataToSend,
          headers: { "Content-Type": "multipart/form-data" },
        },
        {
          successMessage: "Message updated successfully",
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setFormData({ sender_id: "", content: "", image: null });
            setImagePreview(null);
            setSelectedMessage(null);
            fetchMessages();
          },
          onError: (errors) => setErrors(errors),
        }
      );
    } catch (error) {}
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      await request(
        {
          method: "DELETE",
          url: `/messages/${selectedMessage.id}`,
        },
        {
          successMessage: "Message deleted successfully",
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setSelectedMessage(null);
            fetchMessages();
          },
          onError: (errors) => setErrors(errors),
        }
      );
    } catch (error) {}
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">Conversation not found</h3>
          <Button variant="outline" onClick={() => navigate("/admin/conversations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate("/admin/conversations")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Conversation #{id}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(conversation.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <Button onClick={handleAddClick} className="gap-2">
          <Plus className="h-4 w-4" />
          New Message
        </Button>
      </div>

      {/* Conversation Info Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage 
                  src={conversation.user1?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/${conversation.user1.avatar}` : undefined} 
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {conversation.user1?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{conversation.user1?.name}</div>
                <div className="text-sm text-muted-foreground">{conversation.user1?.email}</div>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {conversation.user1?.role}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage 
                  src={conversation.user2?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/${conversation.user2.avatar}` : undefined} 
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {conversation.user2?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{conversation.user2?.name}</div>
                <div className="text-sm text-muted-foreground">{conversation.user2?.email}</div>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {conversation.user2?.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] overflow-y-auto bg-gradient-to-b from-muted/30 to-background p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground">No messages yet</h3>
                  <p className="text-sm text-muted-foreground">Start the conversation by sending the first message</p>
                </div>
                <Button onClick={handleAddClick} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Send First Message
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isUser1 = msg.sender_id === conversation.user1_id;
                  const isLastMessage = index === messages.length - 1;
                  const showDate = index === 0 || 
                    new Date(msg.createdAt).toDateString() !== 
                    new Date(messages[index - 1].createdAt).toDateString();

                  return (
                    <div key={msg.id} className="space-y-2">
                      {/* Date Separator */}
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(msg.createdAt), "EEEE, MMMM d, yyyy")}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Message */}
                      <div className={`flex ${isUser1 ? "justify-start" : "justify-end"}`}>
                        <div className={`flex gap-3 max-w-[70%] ${isUser1 ? "flex-row" : "flex-row-reverse"}`}>
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage 
                              src={msg.sender?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/${msg.sender.avatar}` : undefined} 
                            />
                            <AvatarFallback className="text-xs">
                              {msg.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Message Content */}
                          <div className={`space-y-1 ${isUser1 ? "items-start" : "items-end"}`}>
                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                              isUser1 
                                ? "bg-white border border-border" 
                                : "bg-primary text-primary-foreground"
                            }`}>
                              {msg.content && (
                                <div className="whitespace-pre-line text-sm leading-relaxed">
                                  {msg.content}
                                </div>
                              )}
                              {msg.image && (
                                <div className="mt-2">
                                  <img 
                                    src={`${import.meta.env.VITE_API_URL}/uploads/${msg.image}`} 
                                    alt="Message" 
                                    className="max-w-xs rounded-lg border shadow-sm" 
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* Message Info */}
                            <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                              isUser1 ? "justify-start" : "justify-end"
                            }`}>
                              <span className="font-medium">{msg.sender?.name || "Unknown"}</span>
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(msg.createdAt), "h:mm a")}</span>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className={`flex gap-1 ${isUser1 ? "justify-start" : "justify-end"}`}>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleEditClick(msg)}
                                className="h-6 px-2 text-xs"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteClick(msg)}
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Message Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          clearErrors();
          setFormData({ sender_id: "", content: "", image: null });
          setImagePreview(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Message
            </DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sender_id">Sender</Label>
              <Select
                value={formData.sender_id}
                onValueChange={(value) => handleSelectChange("sender_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sender" />
                </SelectTrigger>
                <SelectContent>
                  {[conversation.user1, conversation.user2].map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.sender_id} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                name="content"
                rows={3}
                placeholder="Type your message..."
                value={formData.content}
                onChange={handleInputChange}
                className="resize-none"
              />
              <FormError error={validationErrors.content} />
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
                    className="h-10 w-10 p-0"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                  />
                </div>
              )}
              <FormError error={validationErrors.image} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMessage} disabled={isLoading} className="gap-2">
              <Send className="h-4 w-4" />
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          clearErrors();
          setFormData({ sender_id: "", content: "", image: null });
          setImagePreview(null);
          setSelectedMessage(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Message
            </DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sender_id">Sender</Label>
              <Select
                value={formData.sender_id}
                onValueChange={(value) => handleSelectChange("sender_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sender" />
                </SelectTrigger>
                <SelectContent>
                  {[conversation.user1, conversation.user2].map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.sender_id} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                name="content"
                rows={3}
                placeholder="Type your message..."
                value={formData.content}
                onChange={handleInputChange}
                className="resize-none"
              />
              <FormError error={validationErrors.content} />
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
                    className="h-10 w-10 p-0"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                  />
                </div>
              )}
              <FormError error={validationErrors.image} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMessage} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Message Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Are you sure you want to delete this message?</p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          <FormError error={validationErrors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMessage} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 