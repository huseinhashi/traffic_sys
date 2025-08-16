import 'package:flutter/material.dart';
import 'package:traffic_app/services/posts_service.dart';
import 'dart:io';

class JamPost {
  final int id;
  final int userId;
  final double? latitude;
  final double? longitude;
  final String note;
  final String level;
  final String? image;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? user;
  final int commentCount;
  final Map<String, int> reactionCounts;
  final int totalReactions;
  final String? userReaction;
  final bool isOwner;

  JamPost({
    required this.id,
    required this.userId,
    this.latitude,
    this.longitude,
    required this.note,
    required this.level,
    this.image,
    required this.createdAt,
    required this.updatedAt,
    this.user,
    required this.commentCount,
    required this.reactionCounts,
    required this.totalReactions,
    this.userReaction,
    required this.isOwner,
  });

  factory JamPost.fromJson(Map<String, dynamic> json) {
    return JamPost(
      id: json['id'],
      userId: json['user_id'],
      latitude: json['latitude'] != null
          ? double.tryParse(json['latitude'].toString())
          : null,
      longitude: json['longitude'] != null
          ? double.tryParse(json['longitude'].toString())
          : null,
      note: json['note'] ?? '',
      level: json['level'],
      image: json['image'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      user: json['user'],
      commentCount: json['commentCount'] ?? 0,
      reactionCounts: Map<String, int>.from(json['reactionCounts'] ?? {}),
      totalReactions: json['totalReactions'] ?? 0,
      userReaction: json['userReaction'],
      isOwner: json['isOwner'] ?? false,
    );
  }
}

class Comment {
  final int id;
  final int jamPostId;
  final int userId;
  final String content;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? user;
  final bool isOwner;

  Comment({
    required this.id,
    required this.jamPostId,
    required this.userId,
    required this.content,
    required this.createdAt,
    required this.updatedAt,
    this.user,
    required this.isOwner,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'],
      jamPostId: json['jam_post_id'],
      userId: json['user_id'],
      content: json['content'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      user: json['user'],
      isOwner: json['isOwner'] ?? false,
    );
  }
}

class PostsProvider extends ChangeNotifier {
  final PostsService _postsService = PostsService();

  List<JamPost> _jamPosts = [];
  List<Comment> _comments = [];
  bool _isLoading = false;
  String? _error;
  bool _hasMorePosts = true;
  int _currentPage = 1;
  List<JamPost> _nearbyJamPosts = [];
  bool _isNearbyLoading = false;
  String? _nearbyError;
  bool _isVoting = false;
  String? _voteError;

  // Getters
  List<JamPost> get jamPosts => _jamPosts;
  List<Comment> get comments => _comments;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMorePosts => _hasMorePosts;
  int get currentPage => _currentPage;
  List<JamPost> get nearbyJamPosts => _nearbyJamPosts;
  bool get isNearbyLoading => _isNearbyLoading;
  String? get nearbyError => _nearbyError;
  bool get isVoting => _isVoting;
  String? get voteError => _voteError;

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Set error
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  // Load jam posts
  Future<void> loadJamPosts({
    bool refresh = false,
    String? level,
    String? search,
    String? timeFilter,
  }) async {
    try {
      if (refresh) {
        _jamPosts.clear();
        _currentPage = 1;
        _hasMorePosts = true;
      }

      if (!_hasMorePosts && !refresh) return;

      _setLoading(true);
      clearError();

      final response = await _postsService.getJamPosts(
        page: _currentPage,
        level: level,
        search: search,
        timeFilter: timeFilter,
      );

      if (response['success']) {
        final List<dynamic> postsData = response['data'] ?? [];
        final List<JamPost> newPosts =
            postsData.map((post) => JamPost.fromJson(post)).toList();

        if (refresh) {
          _jamPosts = newPosts;
        } else {
          _jamPosts.addAll(newPosts);
        }

        _hasMorePosts = newPosts.length >= 10; // Assuming 10 is the limit
        if (_hasMorePosts) {
          _currentPage++;
        }
      } else {
        _setError(response['message'] ?? 'Failed to load posts');
      }
    } catch (e) {
      _setError('Error loading posts: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Get single jam post
  Future<JamPost?> getJamPostById(String id) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.getJamPostById(id);

      if (response['success']) {
        return JamPost.fromJson(response['data']);
      } else {
        _setError(response['message'] ?? 'Failed to load post');
        return null;
      }
    } catch (e) {
      _setError('Error loading post: $e');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // Create jam post
  Future<bool> createJamPost({
    required double latitude,
    required double longitude,
    required String note,
    required String level,
    File? imageFile,
  }) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.createJamPost(
        latitude: latitude,
        longitude: longitude,
        note: note,
        level: level,
        imageFile: imageFile,
      );

      if (response['success']) {
        // Refresh the posts list
        await loadJamPosts(refresh: true);
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to create post');
        return false;
      }
    } catch (e) {
      _setError('Error creating post: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update jam post
  Future<bool> updateJamPost({
    required String id,
    double? latitude,
    double? longitude,
    String? note,
    String? level,
    File? imageFile,
  }) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.updateJamPost(
        id: id,
        latitude: latitude,
        longitude: longitude,
        note: note,
        level: level,
        imageFile: imageFile,
      );

      if (response['success']) {
        // Update the post in the list
        final updatedPost = JamPost.fromJson(response['data']);
        final index = _jamPosts.indexWhere((post) => post.id == int.parse(id));
        if (index != -1) {
          _jamPosts[index] = updatedPost;
          notifyListeners();
        }
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update post');
        return false;
      }
    } catch (e) {
      _setError('Error updating post: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete jam post
  Future<bool> deleteJamPost(String id) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.deleteJamPost(id);

      if (response['success']) {
        // Remove the post from the list
        _jamPosts.removeWhere((post) => post.id == int.parse(id));
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to delete post');
        return false;
      }
    } catch (e) {
      _setError('Error deleting post: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Load comments for a jam post
  Future<void> loadComments(String jamPostId) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.getComments(jamPostId);

      if (response['success']) {
        final List<dynamic> commentsData = response['data'] ?? [];
        _comments =
            commentsData.map((comment) => Comment.fromJson(comment)).toList();
      } else {
        _setError(response['message'] ?? 'Failed to load comments');
      }
    } catch (e) {
      _setError('Error loading comments: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Add comment
  Future<bool> addComment({
    required String jamPostId,
    required String content,
  }) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.addComment(
        jamPostId: jamPostId,
        content: content,
      );

      if (response['success']) {
        // Reload comments
        await loadComments(jamPostId);
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to add comment');
        return false;
      }
    } catch (e) {
      _setError('Error adding comment: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update comment
  Future<bool> updateComment({
    required String commentId,
    required String content,
  }) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.updateComment(
        commentId: commentId,
        content: content,
      );

      if (response['success']) {
        // Update the comment in the list
        final updatedComment = Comment.fromJson(response['data']);
        final index = _comments
            .indexWhere((comment) => comment.id == int.parse(commentId));
        if (index != -1) {
          _comments[index] = updatedComment;
          notifyListeners();
        }
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update comment');
        return false;
      }
    } catch (e) {
      _setError('Error updating comment: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete comment
  Future<bool> deleteComment(String commentId) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _postsService.deleteComment(commentId);

      if (response['success']) {
        // Remove the comment from the list
        _comments.removeWhere((comment) => comment.id == int.parse(commentId));
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to delete comment');
        return false;
      }
    } catch (e) {
      _setError('Error deleting comment: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Add reaction
  Future<bool> addReaction({
    required String jamPostId,
    required String reactionType,
  }) async {
    try {
      clearError();

      final response = await _postsService.addReaction(
        jamPostId: jamPostId,
        reactionType: reactionType,
      );

      if (response['success']) {
        // Update the post's reaction data
        final reactionData = response['data'];
        final index =
            _jamPosts.indexWhere((post) => post.id == int.parse(jamPostId));
        if (index != -1) {
          final post = _jamPosts[index];
          final updatedPost = JamPost(
            id: post.id,
            userId: post.userId,
            latitude: post.latitude,
            longitude: post.longitude,
            note: post.note,
            level: post.level,
            image: post.image,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            user: post.user,
            commentCount: post.commentCount,
            reactionCounts:
                Map<String, int>.from(reactionData['reactionCounts'] ?? {}),
            totalReactions:
                (reactionData['reactionCounts'] as Map<String, dynamic>)
                    .values
                    .fold(0, (sum, count) => sum + (count as int)),
            userReaction: reactionData['userReaction'],
            isOwner: post.isOwner,
          );
          _jamPosts[index] = updatedPost;
          notifyListeners();
        }
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to add reaction');
        return false;
      }
    } catch (e) {
      _setError('Error adding reaction: $e');
      return false;
    }
  }

  // Remove reaction
  Future<bool> removeReaction(String jamPostId) async {
    try {
      clearError();

      final response = await _postsService.removeReaction(jamPostId);

      if (response['success']) {
        // Update the post's reaction data
        final reactionData = response['data'];
        final index =
            _jamPosts.indexWhere((post) => post.id == int.parse(jamPostId));
        if (index != -1) {
          final post = _jamPosts[index];
          final updatedPost = JamPost(
            id: post.id,
            userId: post.userId,
            latitude: post.latitude,
            longitude: post.longitude,
            note: post.note,
            level: post.level,
            image: post.image,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            user: post.user,
            commentCount: post.commentCount,
            reactionCounts:
                Map<String, int>.from(reactionData['reactionCounts'] ?? {}),
            totalReactions:
                (reactionData['reactionCounts'] as Map<String, dynamic>)
                    .values
                    .fold(0, (sum, count) => sum + (count as int)),
            userReaction: null,
            isOwner: post.isOwner,
          );
          _jamPosts[index] = updatedPost;
          notifyListeners();
        }
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to remove reaction');
        return false;
      }
    } catch (e) {
      _setError('Error removing reaction: $e');
      return false;
    }
  }

  // Clear comments
  void clearComments() {
    _comments.clear();
    notifyListeners();
  }

  Future<void> loadNearbyJamPosts({
    required double latitude,
    required double longitude,
    double radius = 2.0,
  }) async {
    _isNearbyLoading = true;
    _nearbyError = null;
    notifyListeners();
    try {
      final postsData = await _postsService.getNearbyJamPosts(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      _nearbyJamPosts =
          postsData.map((post) => JamPost.fromJson(post)).toList();
    } catch (e) {
      _nearbyError = 'Error loading nearby posts: $e';
    } finally {
      _isNearbyLoading = false;
      notifyListeners();
    }
  }

  Future<void> approveJamPost(int postId,
      {double? latitude, double? longitude}) async {
    _isVoting = true;
    _voteError = null;
    notifyListeners();
    try {
      await _postsService.approveJamPost(postId: postId);
      // Optionally reload nearby posts if coordinates provided
      if (latitude != null && longitude != null) {
        await loadNearbyJamPosts(latitude: latitude, longitude: longitude);
      }
    } catch (e) {
      _voteError = 'Error approving post: $e';
    } finally {
      _isVoting = false;
      notifyListeners();
    }
  }

  Future<void> disapproveJamPost(int postId,
      {double? latitude, double? longitude}) async {
    _isVoting = true;
    _voteError = null;
    notifyListeners();
    try {
      await _postsService.disapproveJamPost(postId: postId);
      if (latitude != null && longitude != null) {
        await loadNearbyJamPosts(latitude: latitude, longitude: longitude);
      }
    } catch (e) {
      _voteError = 'Error disapproving post: $e';
    } finally {
      _isVoting = false;
      notifyListeners();
    }
  }
}
