import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:traffic_app/providers/conversations_provider.dart';
import 'package:traffic_app/providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:traffic_app/services/api_client.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final Map<String, dynamic>? otherUser;

  const ChatScreen({
    Key? key,
    required this.conversationId,
    this.otherUser,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();
  File? _selectedImage;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadConversation();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    context.read<ConversationsProvider>().stopPolling();
    super.dispose();
  }

  Future<void> _loadConversation() async {
    final conversationsProvider = context.read<ConversationsProvider>();
    conversationsProvider.stopPolling();
    await conversationsProvider.getConversationById(widget.conversationId);
    conversationsProvider.startPolling(widget.conversationId);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking image: $e')),
      );
    }
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty && _selectedImage == null)
      return;

    setState(() {
      _isSending = true;
    });

    final conversationsProvider = context.read<ConversationsProvider>();
    final success = await conversationsProvider.sendMessage(
      conversationId: widget.conversationId,
      content: _messageController.text.trim(),
      imageFile: _selectedImage,
    );

    if (success) {
      _messageController.clear();
      setState(() {
        _selectedImage = null;
      });
      _scrollToBottom();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text(conversationsProvider.error ?? 'Failed to send message'),
          backgroundColor: Colors.red,
        ),
      );
    }

    setState(() {
      _isSending = false;
    });
  }

  Future<void> _deleteMessage(Message message) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Message'),
        content: const Text('Are you sure you want to delete this message?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final conversationsProvider = context.read<ConversationsProvider>();
      final success =
          await conversationsProvider.deleteMessage(message.id.toString());

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Message deleted')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(conversationsProvider.error ?? 'Failed to delete message'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentUser = context.read<AuthProvider>().userData;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: theme.colorScheme.primary,
              backgroundImage: widget.otherUser?['avatar'] != null
                  ? CachedNetworkImageProvider(
                      '${ApiClient.baseUrl}/uploads/${widget.otherUser!['avatar']}')
                  : null,
              child: widget.otherUser?['avatar'] == null
                  ? Text(
                      widget.otherUser?['name']
                              ?.substring(0, 1)
                              .toUpperCase() ??
                          'U',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.otherUser?['name'] ?? 'Unknown User',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    'Online',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: Colors.green),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
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
                        style:
                            TextButton.styleFrom(foregroundColor: Colors.red),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );

                if (confirmed == true) {
                  final conversationsProvider =
                      context.read<ConversationsProvider>();
                  final success = await conversationsProvider
                      .deleteConversation(widget.conversationId);

                  if (success) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Conversation deleted')));
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
                    Text('Delete Conversation',
                        style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Consumer<ConversationsProvider>(
        builder: (context, conversationsProvider, child) {
          if (conversationsProvider.isLoading &&
              conversationsProvider.messages.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return Column(
            children: [
              // Messages
              Expanded(
                child: conversationsProvider.messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline,
                                size: 64,
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.5)),
                            const SizedBox(height: 16),
                            Text('No messages yet',
                                style: theme.textTheme.headlineSmall),
                            const SizedBox(height: 8),
                            Text('Start the conversation!',
                                style: theme.textTheme.bodyMedium),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: conversationsProvider.messages.length,
                        itemBuilder: (context, index) {
                          final message = conversationsProvider.messages[index];
                          final isOwnMessage =
                              message.senderId == (currentUser?['id'] ?? 0);
                          final showDate = index == 0 ||
                              !_isSameDay(
                                  message.createdAt,
                                  conversationsProvider
                                      .messages[index - 1].createdAt);

                          return Column(
                            children: [
                              // Date separator
                              if (showDate) ...[
                                Container(
                                  margin:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: theme.colorScheme.outline),
                                  ),
                                  child: Text(
                                    DateFormat('EEEE, MMMM d, yyyy')
                                        .format(message.createdAt),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurface
                                          .withOpacity(0.6),
                                    ),
                                  ),
                                ),
                              ],

                              // Message
                              _buildMessageBubble(message, isOwnMessage, theme),
                            ],
                          );
                        },
                      ),
              ),

              // Image preview
              if (_selectedImage != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          _selectedImage!,
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedImage = null;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close,
                                color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Input area
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  border: Border(
                    top: BorderSide(color: theme.colorScheme.outline),
                  ),
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.image),
                      color: theme.colorScheme.primary,
                    ),
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: theme.colorScheme.surface,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                        ),
                        maxLines: null,
                        textCapitalization: TextCapitalization.sentences,
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _isSending ? null : _sendMessage,
                      icon: _isSending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send),
                      style: IconButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMessageBubble(
      Message message, bool isOwnMessage, ThemeData theme) {
    return Align(
      alignment: isOwnMessage ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment:
              isOwnMessage ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Message content
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isOwnMessage
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(20).copyWith(
                  bottomLeft: isOwnMessage
                      ? const Radius.circular(20)
                      : const Radius.circular(4),
                  bottomRight: isOwnMessage
                      ? const Radius.circular(4)
                      : const Radius.circular(20),
                ),
                border: !isOwnMessage
                    ? Border.all(color: theme.colorScheme.outline)
                    : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message.content != null &&
                      message.content!.isNotEmpty) ...[
                    Text(
                      message.content!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isOwnMessage ? Colors.white : null,
                      ),
                    ),
                    if (message.image != null) const SizedBox(height: 8),
                  ],
                  if (message.image != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl:
                            '${ApiClient.baseUrl}/uploads/${message.image}',
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          height: 200,
                          color: theme.colorScheme.surface,
                          child:
                              const Center(child: CircularProgressIndicator()),
                        ),
                        errorWidget: (context, url, error) => Container(
                          height: 200,
                          color: theme.colorScheme.surface,
                          child: const Center(child: Icon(Icons.error)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Message info
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 8, right: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormat('h:mm a').format(message.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                  if (isOwnMessage) ...[
                    const SizedBox(width: 4),
                    Icon(
                      Icons.done_all,
                      size: 14,
                      color: theme.colorScheme.primary,
                    ),
                  ],
                  if (message.isOwner) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => _deleteMessage(message),
                      child: Icon(
                        Icons.delete_outline,
                        size: 14,
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }
}
