import 'package:fire_app/services/api_client.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/posts_provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:fire_app/screens/post_details_screen.dart';
import 'package:fire_app/screens/create_post_screen.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'dart:io';

class PostsScreen extends StatefulWidget {
  const PostsScreen({Key? key}) : super(key: key);

  @override
  State<PostsScreen> createState() => _PostsScreenState();
}

class _PostsScreenState extends State<PostsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedLevel = 'all';
  final ScrollController _scrollController = ScrollController();
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        _selectedLevel = 'all';
        _searchController.clear();
      });
      context.read<PostsProvider>().loadJamPosts(refresh: true);
    });

    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMorePosts();
    }
  }

  void _loadMorePosts() {
    final postsProvider = context.read<PostsProvider>();
    if (!postsProvider.isLoading &&
        !_isLoadingMore &&
        postsProvider.hasMorePosts) {
      setState(() {
        _isLoadingMore = true;
      });

      postsProvider
          .loadJamPosts(
        level: _selectedLevel == 'all' ? null : _selectedLevel,
        search: _searchController.text.isEmpty ? null : _searchController.text,
      )
          .then((_) {
        setState(() {
          _isLoadingMore = false;
        });
      });
    }
  }

  void _onSearchChanged(String value) {
    context.read<PostsProvider>().loadJamPosts(
          refresh: true,
          level: _selectedLevel == 'all' ? null : _selectedLevel,
          search: value.isEmpty ? null : value,
        );
  }

  void _onLevelChanged(String? value) {
    if (value != null) {
      setState(() {
        _selectedLevel = value;
      });
      context.read<PostsProvider>().loadJamPosts(
            refresh: true,
            level: value == 'all' ? null : value,
            search:
                _searchController.text.isEmpty ? null : _searchController.text,
          );
    }
  }

  void _onRefresh() {
    context.read<PostsProvider>().loadJamPosts(
          refresh: true,
          level: _selectedLevel == 'all' ? null : _selectedLevel,
          search:
              _searchController.text.isEmpty ? null : _searchController.text,
        );
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CreatePostScreen(),
            ),
          );
        },
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
            child: Column(
              children: [
                // Title
                Row(
                  children: [
                    Icon(
                      Icons.article,
                      color: theme.colorScheme.primary,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Traffic Posts',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search posts...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: theme.colorScheme.surface,
                  ),
                  onChanged: _onSearchChanged,
                ),
                const SizedBox(height: 12),
                // Level Filter
                DropdownButtonFormField<String>(
                  value: _selectedLevel,
                  decoration: InputDecoration(
                    labelText: 'Filter by Level',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: theme.colorScheme.surface,
                  ),
                  items: [
                    const DropdownMenuItem(
                      value: 'all',
                      child: Text('All Levels'),
                    ),
                    const DropdownMenuItem(
                      value: 'low',
                      child: Text('Low'),
                    ),
                    const DropdownMenuItem(
                      value: 'medium',
                      child: Text('Medium'),
                    ),
                    const DropdownMenuItem(
                      value: 'high',
                      child: Text('High'),
                    ),
                    const DropdownMenuItem(
                      value: 'critical',
                      child: Text('Critical'),
                    ),
                  ],
                  onChanged: _onLevelChanged,
                ),
              ],
            ),
          ),

          // Posts List
          Expanded(
            child: Consumer<PostsProvider>(
              builder: (context, postsProvider, child) {
                if (postsProvider.isLoading && postsProvider.jamPosts.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (postsProvider.error != null &&
                    postsProvider.jamPosts.isEmpty) {
                  return Center(
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
                          'Error loading posts',
                          style: theme.textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          postsProvider.error!,
                          style: theme.textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _onRefresh,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (postsProvider.jamPosts.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.article_outlined,
                          size: 64,
                          color: theme.colorScheme.onSurface.withOpacity(0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No posts found',
                          style: theme.textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Be the first to report a traffic jam!',
                          style: theme.textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const CreatePostScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('Create Post'),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => _onRefresh(),
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: postsProvider.jamPosts.length +
                        (_isLoadingMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == postsProvider.jamPosts.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }

                      final post = postsProvider.jamPosts[index];
                      return _buildPostCard(context, post, theme);
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

  Widget _buildPostCard(BuildContext context, JamPost post, ThemeData theme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  PostDetailsScreen(postId: post.id.toString()),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with user info and level
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: theme.colorScheme.primary,
                    child: Text(
                      post.user?['name']?.substring(0, 1).toUpperCase() ?? 'U',
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
                          post.user?['name'] ?? 'Unknown User',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          DateFormat('MMM d, yyyy h:mm a')
                              .format(post.createdAt),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getLevelColor(post.level).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _getLevelText(post.level),
                      style: TextStyle(
                        color: _getLevelColor(post.level),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
              if (post.note.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  post.note,
                  style: theme.textTheme.bodyLarge,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (post.image != null) ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: '${ApiClient.baseUrl}/uploads/${post.image}',
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      height: 180,
                      color: theme.colorScheme.surface,
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      height: 180,
                      color: theme.colorScheme.surface,
                      child: const Center(child: Icon(Icons.error)),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.comment_outlined,
                      size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 4),
                  Text('${post.commentCount}',
                      style: theme.textTheme.bodySmall),
                  const SizedBox(width: 16),
                  Icon(Icons.thumb_up_outlined,
                      size: 18, color: theme.colorScheme.secondary),
                  const SizedBox(width: 4),
                  Text('${post.totalReactions}',
                      style: theme.textTheme.bodySmall),
                  const Spacer(),
                  if (post.latitude != null && post.longitude != null)
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 18, color: theme.colorScheme.tertiary),
                        const SizedBox(width: 4),
                        Text('Location', style: theme.textTheme.bodySmall),
                      ],
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
