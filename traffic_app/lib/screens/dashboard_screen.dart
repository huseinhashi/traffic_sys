import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:traffic_app/screens/posts_screen.dart';
import 'package:traffic_app/screens/conversations_screen.dart';
import 'package:traffic_app/screens/profile_screen.dart';
import 'package:traffic_app/screens/home_map_screen.dart';
import 'package:traffic_app/screens/nearby_jams_screen.dart';
import 'package:traffic_app/widgets/notification_badge.dart';
import 'package:traffic_app/providers/notification_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  static final List<Widget> _pages = <Widget>[
    const NearbyJamsScreen(),
    const HomeMapScreen(),
    const PostsScreen(),
    const ConversationsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: theme.colorScheme.surface,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Icon(
              Icons.traffic,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Text(
              'Traffic Jam',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        actions: [
          NotificationBadge(
            child: IconButton(
              icon: Icon(
                Icons.notifications_outlined,
                color: theme.colorScheme.primary,
              ),
              onPressed: () {
                Navigator.pushNamed(context, '/notifications');
              },
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: _pages,
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: theme.colorScheme.surface,
        elevation: 0,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.location_on_outlined),
            selectedIcon: Icon(Icons.location_on),
            label: "Nearby",
          ),
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: "Home",
          ),
          NavigationDestination(
            icon: Icon(Icons.article_outlined),
            selectedIcon: Icon(Icons.article),
            label: "Posts",
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: "Chats",
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}
