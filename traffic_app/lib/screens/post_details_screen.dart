// lib/screens/post_details_screen.dart
import 'package:traffic_app/services/api_client.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:traffic_app/providers/posts_provider.dart';
import 'package:traffic_app/providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:traffic_app/widgets/mapbox_widget.dart';
import 'dart:io';

class PostDetailsScreen extends StatefulWidget {
  final String postId;

  const PostDetailsScreen({
    Key? key,
    required this.postId,
  }) : super(key: key);

  @override
  State<PostDetailsScreen> createState() => _PostDetailsScreenState();
}

class _PostDetailsScreenState extends State<PostDetailsScreen> {
  final TextEditingController _commentController = TextEditingController();
  final TextEditingController _editCommentController = TextEditingController();
  JamPost? _post;
  bool _isLoading = true;
  String? _error;
  Comment? _editingComment;

  @override
  void initState() {
    super.initState();
    _loadPostDetails();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _editCommentController.dispose();
    super.dispose();
  }

  Future<void> _loadPostDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final postsProvider = context.read<PostsProvider>();
      final post = await postsProvider.getJamPostById(widget.postId);

      if (post != null) {
        await postsProvider.loadComments(widget.postId);
        setState(() {
          _post = post;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Post not found';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading post: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty) return;

    final postsProvider = context.read<PostsProvider>();
    final success = await postsProvider.addComment(
      jamPostId: widget.postId,
      content: _commentController.text.trim(),
    );

    if (success) {
      _commentController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Comment added successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(postsProvider.error ?? 'Failed to add comment'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _updateComment(Comment comment) async {
    if (_editCommentController.text.trim().isEmpty) return;

    final postsProvider = context.read<PostsProvider>();
    final success = await postsProvider.updateComment(
      commentId: comment.id.toString(),
      content: _editCommentController.text.trim(),
    );

    if (success) {
      _editCommentController.clear();
      setState(() {
        _editingComment = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Comment updated successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(postsProvider.error ?? 'Failed to update comment'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _deleteComment(Comment comment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Comment'),
        content: const Text('Are you sure you want to delete this comment?'),
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
      final postsProvider = context.read<PostsProvider>();
      final success = await postsProvider.deleteComment(comment.id.toString());

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Comment deleted successfully')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(postsProvider.error ?? 'Failed to delete comment'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _addReaction(String reactionType) async {
    final postsProvider = context.read<PostsProvider>();
    final success = await postsProvider.addReaction(
      jamPostId: widget.postId,
      reactionType: reactionType,
    );

    if (success) {
      // Update the local post data
      final updatedPost = await postsProvider.getJamPostById(widget.postId);
      if (updatedPost != null) {
        setState(() {
          _post = updatedPost;
        });
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(postsProvider.error ?? 'Failed to add reaction'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _removeReaction() async {
    final postsProvider = context.read<PostsProvider>();
    final success = await postsProvider.removeReaction(widget.postId);

    if (success) {
      // Update the local post data
      final updatedPost = await postsProvider.getJamPostById(widget.postId);
      if (updatedPost != null) {
        setState(() {
          _post = updatedPost;
        });
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(postsProvider.error ?? 'Failed to remove reaction'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.red;
      case 'critical':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  String _getLevelText(String level) {
    switch (level) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'critical':
        return 'Critical';
      default:
        return level;
    }
  }

  IconData _getReactionIcon(String type) {
    switch (type) {
      case 'like':
        return Icons.thumb_up;
      case 'dislike':
        return Icons.thumb_down;
      case 'helpful':
        return Icons.help;
      case 'accurate':
        return Icons.check_circle;
      default:
        return Icons.thumb_up;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Post Details'),
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null || _post == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Post Details'),
        ),
        body: Center(
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
                'Error loading post',
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                _error ?? 'Post not found',
                style: theme.textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadPostDetails,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Post #${_post!.id}',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          if (_post!.isOwner)
            PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'edit') {
                  // TODO: Navigate to edit post screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Edit functionality coming soon')),
                  );
                } else if (value == 'delete') {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Delete Post'),
                      content: const Text(
                          'Are you sure you want to delete this post?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Cancel'),
                        ),
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
                    final postsProvider = context.read<PostsProvider>();
                    final success =
                        await postsProvider.deleteJamPost(widget.postId);

                    if (success) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Post deleted successfully')),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              postsProvider.error ?? 'Failed to delete post'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit),
                      SizedBox(width: 8),
                      Text('Edit'),
                    ],
                  ),
                ),
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
      body: Consumer<PostsProvider>(
        builder: (context, postsProvider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Post Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // User info and level
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: theme.colorScheme.primary,
                              child: Text(
                                _post!.user?['name']
                                        ?.substring(0, 1)
                                        .toUpperCase() ??
                                    'U',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _post!.user?['name'] ?? 'Unknown User',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    DateFormat('MMM d, yyyy h:mm a')
                                        .format(_post!.createdAt),
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurface
                                          .withOpacity(0.6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: _getLevelColor(_post!.level)
                                    .withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _getLevelColor(_post!.level),
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                _getLevelText(_post!.level),
                                style: TextStyle(
                                  color: _getLevelColor(_post!.level),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Post content
                        if (_post!.note.isNotEmpty) ...[
                          Text(
                            _post!.note,
                            style: theme.textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Image if available
                        if (_post!.image != null) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl:
                                  '${ApiClient.baseUrl}/uploads/${_post!.image}',
                              height: 200,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                height: 200,
                                color: theme.colorScheme.surface,
                                child: const Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                height: 200,
                                color: theme.colorScheme.surface,
                                child: const Center(
                                  child: Icon(Icons.error),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Reactions
                        if (_post!.reactionCounts.isNotEmpty) ...[
                          Text(
                            'Reactions',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children:
                                _post!.reactionCounts.entries.map((entry) {
                              final isUserReaction =
                                  _post!.userReaction == entry.key;
                              return InkWell(
                                onTap: () {
                                  if (isUserReaction) {
                                    _removeReaction();
                                  } else {
                                    _addReaction(entry.key);
                                  }
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isUserReaction
                                        ? theme.colorScheme.primary
                                        : theme.colorScheme.surface,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: theme.colorScheme.outline,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        _getReactionIcon(entry.key),
                                        size: 16,
                                        color: isUserReaction
                                            ? Colors.white
                                            : theme.colorScheme.onSurface,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${entry.value}',
                                        style: TextStyle(
                                          color: isUserReaction
                                              ? Colors.white
                                              : theme.colorScheme.onSurface,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Location info
                        if (_post!.latitude != null &&
                            _post!.longitude != null) ...[
                          Row(
                            children: [
                              Icon(
                                Icons.location_on,
                                color: theme.colorScheme.primary,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Location',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Latitude: ${_post!.latitude!.toStringAsFixed(6)}',
                            style: theme.textTheme.bodyMedium,
                          ),
                          Text(
                            'Longitude: ${_post!.longitude!.toStringAsFixed(6)}',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Map Section
                if (_post!.latitude != null && _post!.longitude != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.map,
                                color: theme.colorScheme.primary,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Location Map',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) {
                                  return DraggableScrollableSheet(
                                    initialChildSize: 0.7,
                                    minChildSize: 0.5,
                                    maxChildSize: 0.95,
                                    expand: false,
                                    builder: (context, scrollController) {
                                      return Container(
                                        color: Colors.white,
                                        child: MapboxWidget(
                                          latitude: _post!.latitude!,
                                          longitude: _post!.longitude!,
                                          level: _post!.level,
                                        ),
                                      );
                                    },
                                  );
                                },
                              );
                            },
                            child: AbsorbPointer(
                              child: MapboxWidget(
                                latitude: _post!.latitude!,
                                longitude: _post!.longitude!,
                                level: _post!.level,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Comments Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.comment,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Comments (${postsProvider.comments.length})',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Add comment
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _commentController,
                                decoration: InputDecoration(
                                  hintText: 'Add a comment...',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  filled: true,
                                  fillColor: theme.colorScheme.surface,
                                ),
                                maxLines: 3,
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed:
                                  postsProvider.isLoading ? null : _addComment,
                              icon: postsProvider.isLoading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2),
                                    )
                                  : const Icon(Icons.send),
                              style: IconButton.styleFrom(
                                backgroundColor: theme.colorScheme.primary,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Comments list
                        if (postsProvider.comments.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.comment_outlined,
                                    size: 48,
                                    color: theme.colorScheme.onSurface
                                        .withOpacity(0.5),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'No comments yet',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurface
                                          .withOpacity(0.6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: postsProvider.comments.length,
                            itemBuilder: (context, index) {
                              final comment = postsProvider.comments[index];
                              final isEditing =
                                  _editingComment?.id == comment.id;

                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Comment header
                                      Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 16,
                                            backgroundColor:
                                                theme.colorScheme.primary,
                                            child: Text(
                                              comment.user?['name']
                                                      ?.substring(0, 1)
                                                      .toUpperCase() ??
                                                  'U',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  comment.user?['name'] ??
                                                      'Unknown User',
                                                  style: theme
                                                      .textTheme.titleSmall
                                                      ?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                                Text(
                                                  DateFormat(
                                                          'MMM d, yyyy h:mm a')
                                                      .format(
                                                          comment.createdAt),
                                                  style: theme
                                                      .textTheme.bodySmall
                                                      ?.copyWith(
                                                    color: theme
                                                        .colorScheme.onSurface
                                                        .withOpacity(0.6),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          if (comment.isOwner)
                                            PopupMenuButton<String>(
                                              onSelected: (value) {
                                                if (value == 'edit') {
                                                  setState(() {
                                                    _editingComment = comment;
                                                    _editCommentController
                                                        .text = comment.content;
                                                  });
                                                } else if (value == 'delete') {
                                                  _deleteComment(comment);
                                                }
                                              },
                                              itemBuilder: (context) => [
                                                const PopupMenuItem(
                                                  value: 'edit',
                                                  child: Row(
                                                    children: [
                                                      Icon(Icons.edit,
                                                          size: 16),
                                                      SizedBox(width: 8),
                                                      Text('Edit'),
                                                    ],
                                                  ),
                                                ),
                                                const PopupMenuItem(
                                                  value: 'delete',
                                                  child: Row(
                                                    children: [
                                                      Icon(Icons.delete,
                                                          size: 16,
                                                          color: Colors.red),
                                                      SizedBox(width: 8),
                                                      Text('Delete',
                                                          style: TextStyle(
                                                              color:
                                                                  Colors.red)),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                        ],
                                      ),

                                      const SizedBox(height: 8),

                                      // Comment content
                                      if (isEditing) ...[
                                        TextField(
                                          controller: _editCommentController,
                                          decoration: InputDecoration(
                                            hintText: 'Edit comment...',
                                            border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            filled: true,
                                            fillColor:
                                                theme.colorScheme.surface,
                                          ),
                                          maxLines: 3,
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.end,
                                          children: [
                                            TextButton(
                                              onPressed: () {
                                                setState(() {
                                                  _editingComment = null;
                                                  _editCommentController
                                                      .clear();
                                                });
                                              },
                                              child: const Text('Cancel'),
                                            ),
                                            const SizedBox(width: 8),
                                            ElevatedButton(
                                              onPressed: postsProvider.isLoading
                                                  ? null
                                                  : () =>
                                                      _updateComment(comment),
                                              child: postsProvider.isLoading
                                                  ? const SizedBox(
                                                      width: 16,
                                                      height: 16,
                                                      child:
                                                          CircularProgressIndicator(
                                                              strokeWidth: 2),
                                                    )
                                                  : const Text('Update'),
                                            ),
                                          ],
                                        ),
                                      ] else ...[
                                        Text(
                                          comment.content,
                                          style: theme.textTheme.bodyMedium,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
