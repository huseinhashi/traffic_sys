import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ErrorComponents";
import { useFormValidation } from "@/utils/errorHandling";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { Eye, Edit, Trash2, Plus, Users } from "lucide-react";

export const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const { validationErrors, setErrors, clearErrors } = useFormValidation();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    user1_id: "",
    user2_id: "",
  });

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span>#{row.getValue("id")}</span>,
    },
    {
      accessorKey: "user1",
      header: "User 1",
      cell: ({ row }) => {
        const user = row.original.user1;
        return user ? user.name : "Unknown";
      },
    },
    {
      accessorKey: "user2",
      header: "User 2",
      cell: ({ row }) => {
        const user = row.original.user2;
        return user ? user.name : "Unknown";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.getValue("createdAt")), "MMM d, yyyy h:mm a"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const conversation = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleViewDetails(conversation)}>
              <Eye className="h-4 w-4 mr-1" /> View
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEditClick(conversation)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(conversation)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchTerm, conversations]);

  const fetchConversations = async () => {
    try {
      const data = await request({ method: "GET", url: "/conversations" });
      setConversations(data.data || []);
    } catch (error) {}
  };

  const fetchUsers = async () => {
    try {
      const data = await request({ method: "GET", url: "/users" });
      setUsers(data.data || []);
    } catch (error) {}
  };

  const filterConversations = useCallback(() => {
    let filtered = [...conversations];
    if (searchTerm) {
      filtered = filtered.filter((conv) => {
        const user1 = conv.user1?.name?.toLowerCase() || "";
        const user2 = conv.user2?.name?.toLowerCase() || "";
        return (
          user1.includes(searchTerm.toLowerCase()) ||
          user2.includes(searchTerm.toLowerCase())
        );
      });
    }
    setFilteredConversations(filtered);
  }, [conversations, searchTerm]);

  const handleViewDetails = (conversation) => {
    navigate(`/admin/conversations/${conversation.id}`);
  };

  const handleCreateClick = () => {
    clearErrors();
    setFormData({ user1_id: "", user2_id: "" });
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (conversation) => {
    clearErrors();
    setSelectedConversation(conversation);
    setFormData({
      user1_id: conversation.user1_id?.toString() || "",
      user2_id: conversation.user2_id?.toString() || "",
    });
    setIsUpdateDialogOpen(true);
  };

  const handleDeleteClick = (conversation) => {
    setSelectedConversation(conversation);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateConversation = async () => {
    try {
      await request(
        {
          method: "POST",
          url: "/conversations",
          data: {
            user1_id: formData.user1_id,
            user2_id: formData.user2_id,
          },
        },
        {
          successMessage: "Conversation created successfully",
          onSuccess: () => {
            setIsCreateDialogOpen(false);
            fetchConversations();
          },
          onError: (errors) => setErrors(errors),
        }
      );
    } catch (error) {}
  };

  const handleUpdateConversation = async () => {
    if (!selectedConversation) return;
    try {
      await request(
        {
          method: "PUT",
          url: `/conversations/${selectedConversation.id}`,
          data: {
            user1_id: formData.user1_id,
            user2_id: formData.user2_id,
          },
        },
        {
          successMessage: "Conversation updated successfully",
          onSuccess: () => {
            setIsUpdateDialogOpen(false);
            fetchConversations();
          },
          onError: (errors) => setErrors(errors),
        }
      );
    } catch (error) {}
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    try {
      await request(
        {
          method: "DELETE",
          url: `/conversations/${selectedConversation.id}`,
        },
        {
          successMessage: "Conversation deleted successfully",
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            fetchConversations();
          },
          onError: (errors) => setErrors(errors),
        }
      );
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user-to-user conversations
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-1" /> New Conversation
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          placeholder="Search by user name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={filteredConversations}
        isLoading={isLoading}
        noResultsMessage="No conversations found"
      />
      {/* Create Conversation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Conversation</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user1_id">User 1</Label>
              <Select
                value={formData.user1_id}
                onValueChange={(value) => handleInputChange("user1_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user 1" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.user1_id} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user2_id">User 2</Label>
              <Select
                value={formData.user2_id}
                onValueChange={(value) => handleInputChange("user2_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user 2" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.user2_id} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Conversation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Update Conversation Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => {
        setIsUpdateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Conversation</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user1_id">User 1</Label>
              <Select
                value={formData.user1_id}
                onValueChange={(value) => handleInputChange("user1_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user 1" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.user1_id} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user2_id">User 2</Label>
              <Select
                value={formData.user2_id}
                onValueChange={(value) => handleInputChange("user2_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user 2" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.user2_id} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateConversation} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Conversation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Conversation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this conversation?</p>
          <FormError error={validationErrors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConversation} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Conversation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 