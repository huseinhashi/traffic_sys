import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:traffic_app/providers/conversations_provider.dart';
import 'package:traffic_app/providers/auth_provider.dart';
import 'package:traffic_app/services/users_service.dart';
import 'package:traffic_app/services/api_client.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';

class NewConversationScreen extends StatefulWidget {
  const NewConversationScreen({Key? key}) : super(key: key);

  @override
  State<NewConversationScreen> createState() => _NewConversationScreenState();
}

class _NewConversationScreenState extends State<NewConversationScreen> {
  final UsersService _usersService = UsersService();
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filteredUsers = [];
  bool _isLoading = true;
  bool _isCreatingConversation = false;
  String? _error;
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Get current user first
      final currentUserResponse = await _usersService.getCurrentUser();
      if (currentUserResponse['success']) {
        _currentUserId = currentUserResponse['data']['id'];
      }

      // Get all users
      final response = await _usersService.getAllUsers();

      if (response['success']) {
        final List<dynamic> usersData = response['data'] ?? [];
        _users =
            usersData.map((user) => Map<String, dynamic>.from(user)).toList();

        // Filter out current user
        _users = _users.where((user) => user['id'] != _currentUserId).toList();
        _filteredUsers = List.from(_users);
      } else {
        setState(() {
          _error = response['message'] ?? 'Failed to load users';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading users: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _filterUsers(String query) {
    if (query.isEmpty) {
      setState(() {
        _filteredUsers = List.from(_users);
      });
    } else {
      setState(() {
        _filteredUsers = _users.where((user) {
          final name = user['name']?.toString().toLowerCase() ?? '';
          final email = user['email']?.toString().toLowerCase() ?? '';
          final searchQuery = query.toLowerCase();
          return name.contains(searchQuery) || email.contains(searchQuery);
        }).toList();
      });
    }
  }

  Future<void> _createConversation(Map<String, dynamic> selectedUser) async {
    setState(() {
      _isCreatingConversation = true;
    });

    final conversationsProvider = context.read<ConversationsProvider>();

    final success = await conversationsProvider.createConversation(
      selectedUser['id'].toString(),
    );

    setState(() {
      _isCreatingConversation = false;
    });

    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Conversation started with ${selectedUser['name']}'),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            conversationsProvider.error ?? 'Failed to create conversation',
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'New Conversation',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: theme.colorScheme.surface,
              ),
              onChanged: _filterUsers,
            ),
          ),

          // Users List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 64,
                              color: theme.colorScheme.error,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Error loading users',
                              style: theme.textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _error!,
                              style: theme.textTheme.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _loadUsers,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _filteredUsers.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.people_outline,
                                  size: 64,
                                  color: theme.colorScheme.onSurface
                                      .withOpacity(0.5),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  _searchController.text.isEmpty
                                      ? 'No users found'
                                      : 'No users match your search',
                                  style: theme.textTheme.headlineSmall,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _searchController.text.isEmpty
                                      ? 'There are no other users to start a conversation with'
                                      : 'Try a different search term',
                                  style: theme.textTheme.bodyMedium,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredUsers.length,
                            itemBuilder: (context, index) {
                              final user = _filteredUsers[index];
                              return _buildUserCard(context, user, theme);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(
      BuildContext context, Map<String, dynamic> user, ThemeData theme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: _isCreatingConversation ? null : () => _createConversation(user),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: theme.colorScheme.primary,
                backgroundImage: user['avatar'] != null
                    ? CachedNetworkImageProvider(
                        '${ApiClient.baseUrl}/uploads/${user['avatar']}',
                      )
                    : null,
                child: user['avatar'] == null
                    ? Text(
                        user['name']?.substring(0, 1).toUpperCase() ?? 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),

              // User info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user['name'] ?? 'Unknown User',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user['email'] ?? '',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                    if (user['role'] != null) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          user['role'],
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Start conversation icon
              _isCreatingConversation
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(
                      Icons.chat_bubble_outline,
                      color: theme.colorScheme.primary,
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
