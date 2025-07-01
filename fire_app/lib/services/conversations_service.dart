import 'package:dio/dio.dart';
import 'package:fire_app/services/api_client.dart';
import 'dart:io';
import 'package:http_parser/http_parser.dart';

class ConversationsService {
  final ApiClient _apiClient = ApiClient();

  // Get all conversations for the current user
  Future<Map<String, dynamic>> getConversations() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/conversations',
    );
  }

  // Get a single conversation by ID
  Future<Map<String, dynamic>> getConversationById(String id) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/conversations/$id',
    );
  }

  // Create a new conversation
  Future<Map<String, dynamic>> createConversation({
    required String user2Id,
  }) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/conversations',
      data: {
        'user2_id': user2Id,
      },
    );
  }

  // Delete a conversation
  Future<Map<String, dynamic>> deleteConversation(String id) async {
    return await _apiClient.request(
      method: 'DELETE',
      path: '/conversations/$id',
    );
  }

  // Get messages for a conversation
  Future<Map<String, dynamic>> getMessages(String conversationId) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/conversations/$conversationId/messages',
    );
  }

  // Send a message
  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String content,
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
        'content': content,
        'image': await MultipartFile.fromFile(
          imageFile.path,
          filename: imageFile.path.split('/').last,
          contentType: MediaType.parse(mimeType),
        ),
      });
    } else {
      formData = FormData.fromMap({
        'content': content,
      });
    }

    return await _apiClient.request(
      method: 'POST',
      path: '/conversations/$conversationId/messages',
      formData: formData,
    );
  }

  // Update a message
  Future<Map<String, dynamic>> updateMessage({
    required String messageId,
    required String content,
    File? imageFile,
  }) async {
    FormData? formData;
    final Map<String, dynamic> data = {};

    if (content.isNotEmpty) data['content'] = content;

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
      path: '/messages/$messageId',
      formData: formData,
    );
  }

  // Delete a message
  Future<Map<String, dynamic>> deleteMessage(String messageId) async {
    return await _apiClient.request(
      method: 'DELETE',
      path: '/messages/$messageId',
    );
  }
}
