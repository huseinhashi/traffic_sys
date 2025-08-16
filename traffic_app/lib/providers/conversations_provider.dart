import 'package:flutter/material.dart';
import 'package:traffic_app/services/conversations_service.dart';
import 'dart:io';
import 'dart:async';

class Conversation {
  final int id;
  final int user1Id;
  final int user2Id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? user1;
  final Map<String, dynamic>? user2;
  final List<Message> messages;

  Conversation({
    required this.id,
    required this.user1Id,
    required this.user2Id,
    required this.createdAt,
    required this.updatedAt,
    this.user1,
    this.user2,
    this.messages = const [],
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      user1Id: json['user1_id'],
      user2Id: json['user2_id'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      user1: json['user1'],
      user2: json['user2'],
      messages: (json['messages'] as List<dynamic>?)
              ?.map((msg) => Message.fromJson(msg))
              .toList() ??
          [],
    );
  }

  // Get the other user in the conversation
  Map<String, dynamic>? getOtherUser(int currentUserId) {
    if (user1Id == currentUserId) return user2;
    if (user2Id == currentUserId) return user1;
    return null;
  }
}

class Message {
  final int id;
  final int conversationId;
  final int senderId;
  final String? content;
  final String? image;
  final String messageType;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? sender;
  final bool isOwner;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.content,
    this.image,
    required this.messageType,
    required this.createdAt,
    required this.updatedAt,
    this.sender,
    required this.isOwner,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      conversationId: json['conversation_id'],
      senderId: json['sender_id'],
      content: json['content'],
      image: json['image'],
      messageType: json['message_type'] ?? 'text',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      sender: json['sender'],
      isOwner: json['isOwner'] ?? false,
    );
  }
}

class ConversationsProvider extends ChangeNotifier {
  final ConversationsService _conversationsService = ConversationsService();

  List<Conversation> _conversations = [];
  Conversation? _currentConversation;
  List<Message> _messages = [];
  bool _isLoading = false;
  String? _error;
  bool _isPolling = false;
  Timer? _pollingTimer;
  String? _polledConversationId;

  // Getters
  List<Conversation> get conversations => _conversations;
  Conversation? get currentConversation => _currentConversation;
  List<Message> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isPolling => _isPolling;

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

  // Load conversations
  Future<void> loadConversations() async {
    try {
      _setLoading(true);
      clearError();

      final response = await _conversationsService.getConversations();

      if (response['success']) {
        final List<dynamic> conversationsData = response['data'] ?? [];
        _conversations = conversationsData
            .map((conv) => Conversation.fromJson(conv))
            .toList();
      } else {
        _setError(response['message'] ?? 'Failed to load conversations');
      }
    } catch (e) {
      _setError('Error loading conversations: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Get single conversation
  Future<Conversation?> getConversationById(String id) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _conversationsService.getConversationById(id);

      if (response['success']) {
        final conversation = Conversation.fromJson(response['data']);
        _currentConversation = conversation;
        _messages = conversation.messages;
        return conversation;
      } else {
        _setError(response['message'] ?? 'Failed to load conversation');
        return null;
      }
    } catch (e) {
      _setError('Error loading conversation: $e');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // Create conversation
  Future<bool> createConversation(String user2Id) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _conversationsService.createConversation(
        user2Id: user2Id,
      );

      if (response['success']) {
        // Refresh conversations list
        await loadConversations();
        return true;
      } else {
        // Check if conversation already exists
        if (response['message']?.toLowerCase().contains('already exists') ==
            true) {
          // Refresh conversations list to show the existing conversation
          await loadConversations();
          return true;
        }
        _setError(response['message'] ?? 'Failed to create conversation');
        return false;
      }
    } catch (e) {
      _setError('Error creating conversation: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete conversation
  Future<bool> deleteConversation(String id) async {
    try {
      _setLoading(true);
      clearError();

      final response = await _conversationsService.deleteConversation(id);

      if (response['success']) {
        // Remove from list
        _conversations.removeWhere((conv) => conv.id == int.parse(id));
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to delete conversation');
        return false;
      }
    } catch (e) {
      _setError('Error deleting conversation: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Load messages for a conversation
  Future<void> loadMessages(String conversationId) async {
    try {
      clearError();
      if (_polledConversationId != null &&
          _polledConversationId != conversationId) return;
      final response = await _conversationsService.getMessages(conversationId);
      if (response['success']) {
        final List<dynamic> messagesData = response['data'] ?? [];
        if (_polledConversationId == conversationId) {
          _messages = messagesData.map((msg) => Message.fromJson(msg)).toList();
          notifyListeners();
        }
      } else {
        _setError(response['message'] ?? 'Failed to load messages');
      }
    } catch (e) {
      _setError('Error loading messages: $e');
    }
  }

  // Send message
  Future<bool> sendMessage({
    required String conversationId,
    required String content,
    File? imageFile,
  }) async {
    try {
      clearError();

      final response = await _conversationsService.sendMessage(
        conversationId: conversationId,
        content: content,
        imageFile: imageFile,
      );

      if (response['success']) {
        // Add message to list
        final newMessage = Message.fromJson(response['data']);
        _messages.add(newMessage);
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to send message');
        return false;
      }
    } catch (e) {
      _setError('Error sending message: $e');
      return false;
    }
  }

  // Update message
  Future<bool> updateMessage({
    required String messageId,
    required String content,
    File? imageFile,
  }) async {
    try {
      clearError();

      final response = await _conversationsService.updateMessage(
        messageId: messageId,
        content: content,
        imageFile: imageFile,
      );

      if (response['success']) {
        // Update message in list
        final updatedMessage = Message.fromJson(response['data']);
        final index =
            _messages.indexWhere((msg) => msg.id == int.parse(messageId));
        if (index != -1) {
          _messages[index] = updatedMessage;
          notifyListeners();
        }
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update message');
        return false;
      }
    } catch (e) {
      _setError('Error updating message: $e');
      return false;
    }
  }

  // Delete message
  Future<bool> deleteMessage(String messageId) async {
    try {
      clearError();

      final response = await _conversationsService.deleteMessage(messageId);

      if (response['success']) {
        // Remove message from list
        _messages.removeWhere((msg) => msg.id == int.parse(messageId));
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to delete message');
        return false;
      }
    } catch (e) {
      _setError('Error deleting message: $e');
      return false;
    }
  }

  // Start polling for new messages
  void startPolling(String conversationId) {
    stopPolling();
    _isPolling = true;
    _polledConversationId = conversationId;
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_currentConversation != null &&
          _polledConversationId == conversationId) {
        loadMessages(conversationId);
      } else {
        stopPolling();
      }
    });
    notifyListeners();
  }

  // Stop polling
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    _isPolling = false;
    _polledConversationId = null;
    notifyListeners();
  }

  // Clear current conversation
  void clearCurrentConversation() {
    _currentConversation = null;
    _messages.clear();
    stopPolling();
    notifyListeners();
  }

  // Clear messages
  void clearMessages() {
    _messages.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
