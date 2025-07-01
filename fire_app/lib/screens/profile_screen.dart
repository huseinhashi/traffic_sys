import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:fire_app/services/api_client.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  File? _avatarFile;
  String? _avatarPreviewPath;
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().userData;
    _nameController = TextEditingController(text: user?['name'] ?? '');
    _emailController = TextEditingController(text: user?['email'] ?? '');
    _avatarPreviewPath = null;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final XFile? picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (picked != null) {
      setState(() {
        _avatarFile = File(picked.path);
        _avatarPreviewPath = picked.path;
      });
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) return;
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.updateProfile(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      avatarFile: _avatarFile,
    );
    if (mounted) {
      if (success) {
        setState(() {
          _isEditing = false;
          _avatarFile = null;
          _avatarPreviewPath = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: Colors.green),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(authProvider.error ?? 'Failed to update profile'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.userData;
    final isLoading = authProvider.isLoading;

    return Scaffold(
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Header
                  Row(
                    children: [
                      Expanded(
                        child: Card(
                          elevation: 2,
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Stack(
                                  children: [
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundColor:
                                          theme.colorScheme.primary,
                                      backgroundImage: _avatarPreviewPath !=
                                              null
                                          ? FileImage(File(_avatarPreviewPath!))
                                          : (user['avatar'] != null
                                              ? CachedNetworkImageProvider(
                                                  '${ApiClient.baseUrl}/uploads/${user['avatar']}')
                                              : null) as ImageProvider<Object>?,
                                      child: (_avatarPreviewPath == null &&
                                              user['avatar'] == null)
                                          ? Text(
                                              user['name']
                                                      ?.substring(0, 1)
                                                      .toUpperCase() ??
                                                  'U',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 36,
                                              ),
                                            )
                                          : null,
                                    ),
                                    if (_isEditing)
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: InkWell(
                                          onTap: isLoading ? null : _pickAvatar,
                                          borderRadius:
                                              BorderRadius.circular(24),
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              color: theme.colorScheme.primary,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(Icons.camera_alt,
                                                color: Colors.white, size: 20),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  user['name'] ?? 'Unknown User',
                                  style: GoogleFonts.poppins(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  user['email'] ?? '',
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: theme.colorScheme.onSurface
                                        .withOpacity(0.7),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                OutlinedButton.icon(
                                  icon: Icon(
                                      _isEditing ? Icons.close : Icons.edit),
                                  label: Text(_isEditing
                                      ? 'Cancel Editing'
                                      : 'Edit Profile'),
                                  onPressed: isLoading
                                      ? null
                                      : () {
                                          setState(() {
                                            _isEditing = !_isEditing;
                                            if (!_isEditing) {
                                              // Reset controllers and avatar if canceling
                                              _nameController.text =
                                                  user['name'] ?? '';
                                              _emailController.text =
                                                  user['email'] ?? '';
                                              _avatarFile = null;
                                              _avatarPreviewPath = null;
                                            }
                                          });
                                        },
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Profile Form (for editing) or Profile Info (for viewing)
                  _isEditing
                      ? _buildProfileForm(isLoading)
                      : _buildProfileInfo(user, theme),
                  const SizedBox(height: 24),
                  // Logout
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.logout, color: Colors.red),
                      title: Text('Logout',
                          style: GoogleFonts.poppins(color: Colors.red)),
                      onTap: isLoading
                          ? null
                          : () async {
                              final confirmed = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Logout'),
                                  content: const Text(
                                      'Are you sure you want to logout?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context, false),
                                      child: const Text('Cancel'),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context, true),
                                      style: TextButton.styleFrom(
                                          foregroundColor: Colors.red),
                                      child: const Text('Logout'),
                                    ),
                                  ],
                                ),
                              );
                              if (confirmed == true) {
                                final success = await authProvider.logout();
                                if (success && context.mounted) {
                                  Navigator.of(context).pushNamedAndRemoveUntil(
                                      '/login', (route) => false);
                                }
                              }
                            },
                    ),
                  ),
                  if (authProvider.error != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      authProvider.error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ],
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileInfo(Map<String, dynamic> user, ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Personal Information',
                style: GoogleFonts.poppins(
                    fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildInfoRow(
                'Name', user['name'] ?? 'Not set', Icons.person_outline, theme),
            const Divider(),
            _buildInfoRow('Email', user['email'] ?? 'Not set',
                Icons.email_outlined, theme),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
      String label, String value, IconData icon, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.poppins(
                        fontSize: 14, color: Colors.grey[600])),
                const SizedBox(height: 4),
                Text(value, style: GoogleFonts.poppins(fontSize: 16)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileForm(bool isLoading) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Edit Profile',
                  style: GoogleFonts.poppins(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              // Name field
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: 'Name',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              // Email field
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value)) {
                    return 'Please enter a valid email address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : _updateProfile,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16.0),
                    child: isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child:
                                CircularProgressIndicator(color: Colors.white),
                          )
                        : const Text('SAVE CHANGES'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
