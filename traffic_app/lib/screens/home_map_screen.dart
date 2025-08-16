import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:traffic_app/providers/posts_provider.dart';
import 'package:traffic_app/screens/post_details_screen.dart';
import 'package:traffic_app/widgets/multi_mapbox_widget.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeMapScreen extends StatefulWidget {
  const HomeMapScreen({Key? key}) : super(key: key);

  @override
  State<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends State<HomeMapScreen> {
  String _selectedFilter = 'lastHour';
  final Map<String, String> _filterLabels = {
    'lastHour': 'Last Hour',
    'last5Hours': 'Last 5 Hours',
    'today': 'Today',
    'thisWeek': 'This Week',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchPosts();
    });
  }

  void _fetchPosts() {
    context.read<PostsProvider>().loadJamPosts(
          refresh: true,
          search: null,
          level: null,
          timeFilter: _selectedFilter,
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Traffic Map',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        centerTitle: true,
        elevation: 0,
        actions: [
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchPosts,
            tooltip: 'Refresh map data',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips with enhanced styling
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filterLabels.entries.map((entry) {
                  final isSelected = _selectedFilter == entry.key;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(
                        entry.value,
                        style: TextStyle(
                          color: isSelected
                              ? theme.colorScheme.onPrimary
                              : theme.colorScheme.onSurface,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedFilter = entry.key;
                          });
                          _fetchPosts();
                        }
                      },
                      backgroundColor: theme.colorScheme.surface,
                      selectedColor: theme.colorScheme.primary,
                      checkmarkColor: theme.colorScheme.onPrimary,
                      side: BorderSide(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outline.withOpacity(0.5),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Map section
          Expanded(
            child: Consumer<PostsProvider>(
              builder: (context, postsProvider, child) {
                // Loading state
                if (postsProvider.isLoading && postsProvider.jamPosts.isEmpty) {
                  return Container(
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.outline.withOpacity(0.2),
                      ),
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Loading traffic data...'),
                        ],
                      ),
                    ),
                  );
                }

                // Error state
                if (postsProvider.error != null &&
                    postsProvider.jamPosts.isEmpty) {
                  return Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.error.withOpacity(0.3),
                      ),
                      color: theme.colorScheme.errorContainer.withOpacity(0.1),
                    ),
                    child: Center(
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
                            'Error loading map',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              color: theme.colorScheme.error,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            postsProvider.error!,
                            style: theme.textTheme.bodyMedium,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _fetchPosts,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: theme.colorScheme.error,
                              foregroundColor: theme.colorScheme.onError,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Empty state
                if (postsProvider.jamPosts.isEmpty) {
                  return Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.outline.withOpacity(0.2),
                      ),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.map_outlined,
                            size: 64,
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No traffic jams found',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.7),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'No jam posts for the ${_filterLabels[_selectedFilter]?.toLowerCase()} period.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            onPressed: _fetchPosts,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Refresh'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Success state - Convert JamPost objects to Map for MultiMapboxWidget
                final jamPosts = postsProvider.jamPosts.map((jp) {
                  return <String, dynamic>{
                    'id': jp.id,
                    'latitude': jp.latitude,
                    'longitude': jp.longitude,
                    'level': jp.level,
                    'note': jp.note,
                    'user': jp.user,
                    // Add any other fields you might need
                  };
                }).where((post) {
                  // Filter out posts with invalid coordinates
                  final lat = post['latitude'];
                  final lng = post['longitude'];
                  return lat != null &&
                      lng != null &&
                      lat is num &&
                      lng is num &&
                      lat.isFinite &&
                      lng.isFinite;
                }).toList();

                // Show error if no valid coordinates found
                if (jamPosts.isEmpty) {
                  return Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.outline.withOpacity(0.2),
                      ),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.location_off,
                            size: 64,
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No valid locations found',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.7),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Posts found but none have valid coordinates.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // Map stats info
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color:
                              theme.colorScheme.surfaceVariant.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${jamPosts.length} traffic jam${jamPosts.length == 1 ? '' : 's'} found for ${_filterLabels[_selectedFilter]?.toLowerCase()}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),

                      // Map widget
                      Expanded(
                        child: MultiMapboxWidget(
                          jamPosts: jamPosts,
                          zoom: 12.0,
                          bearing: 0.0,
                          pitch: 0.0,
                          onMarkerTap: (jamPost) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => PostDetailsScreen(
                                  postId: jamPost['id'].toString(),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
