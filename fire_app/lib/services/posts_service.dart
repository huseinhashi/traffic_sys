import 'package:dio/dio.dart';
import 'package:fire_app/services/api_client.dart';
import 'dart:io';
import 'package:http_parser/http_parser.dart';

class PostsService {
  final ApiClient _apiClient = ApiClient();

  // Get all jam posts for the current user
  Future<Map<String, dynamic>> getJamPosts({
    int page = 1,
    int limit = 10,
    String? level,
    String? search,
    String? timeFilter,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (level != null && level != 'all') {
      queryParams['level'] = level;
    }

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }

    if (timeFilter != null && timeFilter.isNotEmpty) {
      queryParams['timeFilter'] = timeFilter;
    }

    return await _apiClient.request(
      method: 'GET',
      path: '/jam-posts',
      queryParameters: queryParams,
    );
  }

  // Get a single jam post by ID
  Future<Map<String, dynamic>> getJamPostById(String id) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/jam-posts/$id',
    );
  }

  // Create a new jam post
  Future<Map<String, dynamic>> createJamPost({
    required double latitude,
    required double longitude,
    required String note,
    required String level,
    File? imageFile,
  }) async {
    FormData? formData;

    if (imageFile != null) {
      // Get the file extension to determine MIME type
      final extension = imageFile.path.split('.').last.toLowerCase();
      String mimeType;

      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        default:
          mimeType = 'image/jpeg'; // Default fallback
      }

      formData = FormData.fromMap({
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'note': note,
        'level': level,
        'image': await MultipartFile.fromFile(
          imageFile.path,
          filename: imageFile.path.split('/').last,
          contentType: MediaType.parse(mimeType),
        ),
      });
    } else {
      formData = FormData.fromMap({
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'note': note,
        'level': level,
      });
    }

    return await _apiClient.request(
      method: 'POST',
      path: '/jam-posts',
      formData: formData,
    );
  }

  // Update a jam post
  Future<Map<String, dynamic>> updateJamPost({
    required String id,
    double? latitude,
    double? longitude,
    String? note,
    String? level,
    File? imageFile,
  }) async {
    FormData? formData;
    final Map<String, dynamic> data = {};

    if (latitude != null) data['latitude'] = latitude.toString();
    if (longitude != null) data['longitude'] = longitude.toString();
    if (note != null) data['note'] = note;
    if (level != null) data['level'] = level;

    if (imageFile != null) {
      // Get the file extension to determine MIME type
      final extension = imageFile.path.split('.').last.toLowerCase();
      String mimeType;

      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        default:
          mimeType = 'image/jpeg'; // Default fallback
      }

      data['image'] = await MultipartFile.fromFile(
        imageFile.path,
        filename: imageFile.path.split('/').last,
        contentType: MediaType.parse(mimeType),
      );
      formData = FormData.fromMap(data);
    } else {
      formData = FormData.fromMap(data);
    }

    return await _apiClient.request(
      method: 'PUT',
      path: '/jam-posts/$id',
      formData: formData,
    );
  }

  // Delete a jam post
  Future<Map<String, dynamic>> deleteJamPost(String id) async {
    return await _apiClient.request(
      method: 'DELETE',
      path: '/jam-posts/$id',
    );
  }

  // Get comments for a jam post
  Future<Map<String, dynamic>> getComments(String jamPostId) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/jam-posts/$jamPostId/comments',
    );
  }

  // Add a comment to a jam post
  Future<Map<String, dynamic>> addComment({
    required String jamPostId,
    required String content,
  }) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/jam-posts/$jamPostId/comments',
      data: {
        'content': content,
      },
    );
  }

  // Update a comment
  Future<Map<String, dynamic>> updateComment({
    required String commentId,
    required String content,
  }) async {
    return await _apiClient.request(
      method: 'PUT',
      path: '/comments/$commentId',
      data: {
        'content': content,
      },
    );
  }

  // Delete a comment
  Future<Map<String, dynamic>> deleteComment(String commentId) async {
    return await _apiClient.request(
      method: 'DELETE',
      path: '/comments/$commentId',
    );
  }

  // Add a reaction to a jam post
  Future<Map<String, dynamic>> addReaction({
    required String jamPostId,
    required String reactionType,
  }) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/jam-posts/$jamPostId/reactions',
      data: {
        'reaction_type': reactionType,
      },
    );
  }

  // Remove a reaction from a jam post
  Future<Map<String, dynamic>> removeReaction(String jamPostId) async {
    return await _apiClient.request(
      method: 'DELETE',
      path: '/jam-posts/$jamPostId/reactions',
    );
  }
}
