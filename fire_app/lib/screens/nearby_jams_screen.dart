import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/posts_provider.dart';
import '../providers/location_provider.dart';

class NearbyJamsScreen extends StatefulWidget {
  const NearbyJamsScreen({Key? key}) : super(key: key);

  @override
  State<NearbyJamsScreen> createState() => _NearbyJamsScreenState();
}

class _NearbyJamsScreenState extends State<NearbyJamsScreen> {
  @override
  void initState() {
    super.initState();
    _fetchNearbyPosts();
  }

  Future<void> _fetchNearbyPosts() async {
    final locationProvider =
        Provider.of<LocationProvider>(context, listen: false);
    final postsProvider = Provider.of<PostsProvider>(context, listen: false);
    if (locationProvider.latitude != null &&
        locationProvider.longitude != null) {
      await postsProvider.loadNearbyJamPosts(
        latitude: locationProvider.latitude!,
        longitude: locationProvider.longitude!,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final postsProvider = Provider.of<PostsProvider>(context);
    final locationProvider = Provider.of<LocationProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Jams'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchNearbyPosts,
          ),
        ],
      ),
      body: locationProvider.latitude == null ||
              locationProvider.longitude == null
          ? const Center(child: Text('Location not available'))
          : postsProvider.isNearbyLoading
              ? const Center(child: CircularProgressIndicator())
              : postsProvider.nearbyError != null
                  ? Center(child: Text(postsProvider.nearbyError!))
                  : postsProvider.nearbyJamPosts.isEmpty
                      ? const Center(child: Text('No nearby jam posts found.'))
                      : Column(
                          children: [
                            if (postsProvider.voteError != null)
                              Container(
                                color: Colors.red.withOpacity(0.1),
                                padding: const EdgeInsets.all(8),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error, color: Colors.red),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        postsProvider.voteError!,
                                        style:
                                            const TextStyle(color: Colors.red),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            Expanded(
                              child: RefreshIndicator(
                                onRefresh: _fetchNearbyPosts,
                                child: ListView.builder(
                                  itemCount:
                                      postsProvider.nearbyJamPosts.length,
                                  itemBuilder: (context, index) {
                                    final post =
                                        postsProvider.nearbyJamPosts[index];
                                    final hasApproved =
                                        post.reactionCounts['like'] != null &&
                                            post.userReaction == 'like';
                                    final hasDisapproved =
                                        post.reactionCounts['dislike'] !=
                                                null &&
                                            post.userReaction == 'dislike';
                                    return Card(
                                      margin: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 8),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              post.note,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16),
                                            ),
                                            const SizedBox(height: 8),
                                            Text('Level: ${post.level}'),
                                            if (post.image != null) ...[
                                              const SizedBox(height: 8),
                                              Image.network(post.image!),
                                            ],
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: ElevatedButton.icon(
                                                    onPressed: hasApproved ||
                                                            hasDisapproved ||
                                                            postsProvider
                                                                .isVoting
                                                        ? null
                                                        : () async {
                                                            await postsProvider
                                                                .approveJamPost(
                                                              post.id,
                                                              latitude:
                                                                  locationProvider
                                                                      .latitude,
                                                              longitude:
                                                                  locationProvider
                                                                      .longitude,
                                                            );
                                                          },
                                                    icon: const Icon(
                                                        Icons.thumb_up),
                                                    label: postsProvider
                                                            .isVoting
                                                        ? const SizedBox(
                                                            width: 16,
                                                            height: 16,
                                                            child:
                                                                CircularProgressIndicator(
                                                                    strokeWidth:
                                                                        2),
                                                          )
                                                        : const Text('Approve'),
                                                    style: ElevatedButton
                                                        .styleFrom(
                                                      backgroundColor:
                                                          hasApproved
                                                              ? Colors.green
                                                              : null,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  child: ElevatedButton.icon(
                                                    onPressed: hasApproved ||
                                                            hasDisapproved ||
                                                            postsProvider
                                                                .isVoting
                                                        ? null
                                                        : () async {
                                                            await postsProvider
                                                                .disapproveJamPost(
                                                              post.id,
                                                              latitude:
                                                                  locationProvider
                                                                      .latitude,
                                                              longitude:
                                                                  locationProvider
                                                                      .longitude,
                                                            );
                                                          },
                                                    icon: const Icon(
                                                        Icons.thumb_down),
                                                    label:
                                                        postsProvider.isVoting
                                                            ? const SizedBox(
                                                                width: 16,
                                                                height: 16,
                                                                child: CircularProgressIndicator(
                                                                    strokeWidth:
                                                                        2),
                                                              )
                                                            : const Text(
                                                                'Disapprove'),
                                                    style: ElevatedButton
                                                        .styleFrom(
                                                      backgroundColor:
                                                          hasDisapproved
                                                              ? Colors.red
                                                              : null,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
    );
  }
}
