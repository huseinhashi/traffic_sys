import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'dart:typed_data';
import 'dart:ui' as ui;

class MultiMapboxWidget extends StatefulWidget {
  final List<Map<String, dynamic>> jamPosts;
  final double zoom;
  final double? bearing;
  final double? pitch;
  final Function(Map<String, dynamic> jamPost)? onMarkerTap;

  const MultiMapboxWidget({
    Key? key,
    required this.jamPosts,
    this.zoom = 12.0,
    this.bearing = 0.0,
    this.pitch = 0.0,
    this.onMarkerTap,
  }) : super(key: key);

  @override
  State<MultiMapboxWidget> createState() => _MultiMapboxWidgetState();
}

class _MultiMapboxWidgetState extends State<MultiMapboxWidget> {
  MapboxMap? _mapboxMap;
  PointAnnotationManager? _pointAnnotationManager;
  bool _mapReady = false;
  String? _errorMessage;
  String _currentStyle = MapboxStyles.MAPBOX_STREETS;
  bool _markersLoaded = false;

  // Map to store custom marker images
  final Map<String, String> _markerImages = {
    'low': 'low-marker',
    'medium': 'medium-marker',
    'high': 'high-marker',
    'critical': 'critical-marker',
  };

  @override
  void initState() {
    super.initState();
  }

  void _onPointAnnotationClick(PointAnnotation annotation) {
    try {
      final pos = annotation.geometry.coordinates;
      final tapped = widget.jamPosts.firstWhere(
        (p) =>
            (p['latitude']?.toDouble() ?? 0.0) == pos.lat &&
            (p['longitude']?.toDouble() ?? 0.0) == pos.lng,
        orElse: () => <String, dynamic>{},
      );
      if (tapped.isNotEmpty && widget.onMarkerTap != null) {
        widget.onMarkerTap!(tapped);
      }
    } catch (e) {
      print('Error handling marker tap: $e');
    }
  }

  @override
  void dispose() {
    _pointAnnotationManager?.deleteAll();
    _pointAnnotationManager = null;
    _mapboxMap = null;
    super.dispose();
  }

  void _onMapCreated(MapboxMap mapboxMap) async {
    try {
      _mapboxMap = mapboxMap;

      // Load custom marker images first
      await _loadCustomMarkerImages();

      // Then add markers
      await _addMarkers();

      setState(() {
        _mapReady = true;
        _markersLoaded = true;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to initialize map: $e';
      });
    }
  }

  Future<void> _loadCustomMarkerImages() async {
    // No longer needed: marker images are handled per annotation
    return;
  }

  Future<void> _loadFallbackMarkers() async {
    // No longer needed: marker images are handled per annotation
    return;
  }

  Future<void> _addMarkers() async {
    if (_mapboxMap == null) return;

    try {
      // Create point annotation manager
      _pointAnnotationManager =
          await _mapboxMap!.annotations.createPointAnnotationManager();

      // Clear existing annotations
      await _pointAnnotationManager!.deleteAll();

      // Add markers for each jam post
      for (final post in widget.jamPosts) {
        final lat = post['latitude']?.toDouble();
        final lng = post['longitude']?.toDouble();
        final level = post['level']?.toString().toLowerCase() ?? 'low';

        if (lat == null || lng == null) {
          print('Skipping post with invalid coordinates: $post');
          continue;
        }

        // Generate marker image for traffic level
        Uint8List markerImage;
        switch (level) {
          case 'low':
            markerImage = await _createMarkerImage(Colors.green);
            break;
          case 'medium':
            markerImage = await _createMarkerImage(Colors.orange);
            break;
          case 'high':
            markerImage = await _createMarkerImage(Colors.red);
            break;
          case 'critical':
            markerImage = await _createMarkerImage(Colors.purple);
            break;
          default:
            markerImage = await _createMarkerImage(Colors.green);
        }

        final options = PointAnnotationOptions(
          geometry: Point(
            coordinates: Position(lng, lat),
          ),
          image: markerImage,
          iconSize: 1.0,
          textField: _getLevelDisplayText(level),
          textOffset: [0, 2.0],
          textAnchor: TextAnchor.TOP,
          textSize: 11.0,
          textColor: _getTextColorForLevel(level).value,
          textHaloColor: Colors.white.value,
          textHaloWidth: 1.5,
        );

        try {
          await _pointAnnotationManager!.create(options);
        } catch (e) {
          print('Error creating annotation for post ${post['id']}: $e');
        }
      }

      // Add click listener
      _pointAnnotationManager!.addOnPointAnnotationClickListener(
        _JamPointAnnotationClickListener(onTap: (annotation) {
          try {
            final pos = annotation.geometry.coordinates;
            final tapped = widget.jamPosts.firstWhere(
              (p) =>
                  (p['latitude']?.toDouble() ?? 0.0) == pos.lat &&
                  (p['longitude']?.toDouble() ?? 0.0) == pos.lng,
              orElse: () => <String, dynamic>{},
            );
            if (tapped.isNotEmpty && widget.onMarkerTap != null) {
              widget.onMarkerTap!(tapped);
            }
          } catch (e) {
            print('Error handling marker tap: $e');
          }
        }),
      );
    } catch (e) {
      print('Error adding markers: $e');
      setState(() {
        _errorMessage = 'Failed to add markers: $e';
      });
    }
  }

  String _getLevelDisplayText(String level) {
    switch (level.toLowerCase()) {
      case 'low':
        return 'LOW';
      case 'medium':
        return 'MED';
      case 'high':
        return 'HIGH';
      case 'critical':
        return 'CRIT';
      default:
        return 'JAM';
    }
  }

  Color _getTextColorForLevel(String level) {
    switch (level.toLowerCase()) {
      case 'low':
        return Colors.green.shade800;
      case 'medium':
        return Colors.orange.shade800;
      case 'high':
        return Colors.red.shade800;
      case 'critical':
        return Colors.purple.shade800;
      default:
        return Colors.black;
    }
  }

  // Restore the marker image generator for custom markers
  Future<Uint8List> _createMarkerImage(Color color) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final size = 48.0;

    // Draw marker pin shape
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.3)
      ..style = PaintingStyle.fill;

    // Draw shadow
    canvas.drawCircle(
        Offset(size * 0.5 + 2, size * 0.8 + 2), size * 0.35, shadowPaint);

    // Draw main marker
    canvas.drawCircle(Offset(size * 0.5, size * 0.5), size * 0.35, paint);

    // Draw white center dot
    final centerPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(size * 0.5, size * 0.5), size * 0.15, centerPaint);

    final picture = recorder.endRecording();
    final image = await picture.toImage(size.toInt(), size.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return bytes!.buffer.asUint8List();
  }

  @override
  Widget build(BuildContext context) {
    // Calculate center coordinates
    double centerLat = 40.7128; // Default to NYC
    double centerLng = -74.0060;

    if (widget.jamPosts.isNotEmpty) {
      // Find first valid coordinate
      for (final post in widget.jamPosts) {
        final lat = post['latitude']?.toDouble();
        final lng = post['longitude']?.toDouble();
        if (lat != null && lng != null) {
          centerLat = lat;
          centerLng = lng;
          break;
        }
      }
    }

    return Container(
      height: 400,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          children: [
            MapWidget(
              key: ValueKey(_currentStyle),
              styleUri: _currentStyle,
              onMapCreated: _onMapCreated,
              cameraOptions: CameraOptions(
                center: Point(
                  coordinates: Position(centerLng, centerLat),
                ),
                zoom: widget.zoom,
                bearing: widget.bearing,
                pitch: widget.pitch,
              ),
              mapOptions: MapOptions(
                contextMode: ContextMode.UNIQUE,
                constrainMode: ConstrainMode.NONE,
                orientation: NorthOrientation.UPWARDS,
                crossSourceCollisions: true,
                size: Size(
                  width: MediaQuery.of(context).size.width,
                  height: 400,
                ),
                pixelRatio: MediaQuery.of(context).devicePixelRatio,
              ),
            ),

            // Loading indicator
            if (!_mapReady || !_markersLoaded)
              Container(
                color: Colors.white.withOpacity(0.8),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 8),
                      Text('Loading map...'),
                    ],
                  ),
                ),
              ),

            // Error message
            if (_errorMessage != null)
              Container(
                color: Colors.red.withOpacity(0.1),
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error, color: Colors.red, size: 48),
                        const SizedBox(height: 8),
                        Text(
                          'Map Error',
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Legend for traffic levels
            if (_mapReady && _markersLoaded && _errorMessage == null)
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Traffic Levels',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      _buildLegendItem('Low', Colors.green),
                      _buildLegendItem('Medium', Colors.orange),
                      _buildLegendItem('High', Colors.red),
                      _buildLegendItem('Critical', Colors.purple),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 1),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 10),
          ),
        ],
      ),
    );
  }
}

class _JamPointAnnotationClickListener extends OnPointAnnotationClickListener {
  final void Function(PointAnnotation annotation) onTap;
  _JamPointAnnotationClickListener({required this.onTap});
  @override
  void onPointAnnotationClick(PointAnnotation annotation) {
    onTap(annotation);
  }
}
