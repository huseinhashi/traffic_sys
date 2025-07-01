import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/conversations_provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:fire_app/screens/chat_screen.dart';
import 'package:fire_app/screens/new_conversation_screen.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:fire_app/services/api_client.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({Key? key}) : super(key: key);

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ConversationsProvider>().loadConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const NewConversationScreen(),
            ),
          );
        },
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
            child: Column(
              children: [
                // Title
                Row(
                  children: [
                    Icon(
                      Icons.chat_bubble,
                      color: theme.colorScheme.primary,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Conversations',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Chat with other users about traffic updates',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),

          // Conversations List
          Expanded(
            child: Consumer<ConversationsProvider>(
              builder: (context, conversationsProvider, child) {
                if (conversationsProvider.isLoading &&
                    conversationsProvider.conversations.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (conversationsProvider.error != null &&
                    conversationsProvider.conversations.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: theme.colorScheme.error),
                        const SizedBox(height: 16),
                        Text('Error loading conversations',
                            style: theme.textTheme.headlineSmall),
                        const SizedBox(height: 8),
                        Text(conversationsProvider.error!,
                            style: theme.textTheme.bodyMedium,
                            textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () =>
                              conversationsProvider.loadConversations(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (conversationsProvider.conversations.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline,
                            size: 64,
                            color:
                                theme.colorScheme.onSurface.withOpacity(0.5)),
                        const SizedBox(height: 16),
                        Text('No conversations yet',
                            style: theme.textTheme.headlineSmall),
                        const SizedBox(height: 8),
                        Text('Start a conversation with another user!',
                            style: theme.textTheme.bodyMedium,
                            textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    const NewConversationScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('New Conversation'),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      await conversationsProvider.loadConversations(),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: conversationsProvider.conversations.length,
                    itemBuilder: (context, index) {
                      final conversation =
                          conversationsProvider.conversations[index];
                      return _buildConversationCard(
                          context, conversation, theme);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationCard(
      BuildContext context, Conversation conversation, ThemeData theme) {
    final currentUser = context.read<AuthProvider>().userData;
    final otherUser = conversation.getOtherUser(currentUser?['id'] ?? 0);
    final lastMessage =
        conversation.messages.isNotEmpty ? conversation.messages.last : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ChatScreen(
                conversationId: conversation.id.toString(),
                otherUser: otherUser,
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: theme.colorScheme.primary,
                backgroundImage: otherUser?['avatar'] != null
                    ? CachedNetworkImageProvider(
                        '${ApiClient.baseUrl}/uploads/${otherUser!['avatar']}')
                    : null,
                child: otherUser?['avatar'] == null
                    ? Text(
                        otherUser?['name']?.substring(0, 1).toUpperCase() ??
                            'U',
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 18),
                      )
                    : null,
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            otherUser?['name'] ?? 'Unknown User',
                            style: theme.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ),
                        Text(
                          DateFormat('MMM d, h:mm a')
                              .format(conversation.updatedAt),
                          style: theme.textTheme.bodySmall?.copyWith(
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.6)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    if (lastMessage != null) ...[
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              lastMessage.content ?? 'Image',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurface
                                      .withOpacity(0.7)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (lastMessage.isOwner)
                            Icon(Icons.done_all,
                                size: 16, color: theme.colorScheme.primary),
                        ],
                      ),
                    ] else ...[
                      Text(
                        'No messages yet',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.5),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Action menu
              PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'delete') {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Delete Conversation'),
                        content: const Text(
                            'Are you sure you want to delete this conversation?'),
                        actions: [
                          TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: const Text('Cancel')),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            style: TextButton.styleFrom(
                                foregroundColor: Colors.red),
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    );

                    if (confirmed == true) {
                      final conversationsProvider =
                          context.read<ConversationsProvider>();
                      final success = await conversationsProvider
                          .deleteConversation(conversation.id.toString());

                      if (success) {
                        ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Conversation deleted')));
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(conversationsProvider.error ??
                                'Failed to delete conversation'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
