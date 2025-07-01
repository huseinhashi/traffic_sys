import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:flutter/rendering.dart';
import 'dart:typed_data';
import 'dart:ui' as ui;

class MapboxWidget extends StatefulWidget {
  final double latitude;
  final double longitude;
  final double? zoom;
  final double? bearing;
  final double? pitch;
  final String? title;
  final bool showControls;
  final bool showMarker;
  final Color? markerColor;
  final double? markerSize;
  final String? level;

  const MapboxWidget({
    super.key,
    required this.latitude,
    required this.longitude,
    this.zoom = 14.0,
    this.bearing = 0.0,
    this.pitch = 0.0,
    this.title,
    this.showControls = true,
    this.showMarker = true,
    this.markerColor,
    this.markerSize = 12.0,
    this.level,
  });

  @override
  State<MapboxWidget> createState() => _MapboxWidgetState();
}

class _MapboxWidgetState extends State<MapboxWidget> {
  MapboxMap? _mapboxMap;
  PointAnnotationManager? _pointAnnotationManager;
  bool _mapReady = false;
  String? _errorMessage;
  String _currentStyle = MapboxStyles.MAPBOX_STREETS;
  bool _isLoading = true;

  // Map style options
  final Map<String, String> _mapStyles = {
    'streets': MapboxStyles.MAPBOX_STREETS,
    'satellite': MapboxStyles.SATELLITE,
    'satelliteStreets': MapboxStyles.SATELLITE_STREETS,
    'outdoors': MapboxStyles.OUTDOORS,
    'light': MapboxStyles.LIGHT,
    'dark': MapboxStyles.DARK,
    'standard': MapboxStyles.STANDARD,
    'standardSatellite': MapboxStyles.STANDARD_SATELLITE,
  };

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  @override
  void dispose() {
    _mapboxMap?.dispose();
    super.dispose();
  }

  void _initializeMap() {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
  }

  void _onMapCreated(MapboxMap mapboxMap) {
    _mapboxMap = mapboxMap;

    // Set initial camera position
    _setInitialCamera();

    // Initialize annotation manager if marker is needed
    if (widget.showMarker) {
      _initializeAnnotationManager();
    }

    // Configure map settings
    _configureMapSettings();

    setState(() {
      _mapReady = true;
      _isLoading = false;
    });
  }

  void _setInitialCamera() {
    try {
      _mapboxMap?.setCamera(
        CameraOptions(
          center: Point(
            coordinates: Position(
              widget.longitude,
              widget.latitude,
            ),
          ),
          zoom: widget.zoom!,
          bearing: widget.bearing!,
          pitch: widget.pitch!,
        ),
      );
    } catch (e) {
      _handleError('Camera setup error: $e');
    }
  }

  void _initializeAnnotationManager() {
    _mapboxMap?.annotations
        .createPointAnnotationManager()
        .then((manager) async {
      _pointAnnotationManager = manager;
      await _addMarker();
    }).catchError((error) {
      _handleError('Annotation manager error: $error');
    });
  }

  Future<void> _addMarker() async {
    if (_pointAnnotationManager == null) return;
    try {
      // Determine marker color
      Color color = widget.markerColor ?? _getLevelColor(widget.level);
      Uint8List? markerImage;
      if (widget.showMarker) {
        markerImage = await _createMarkerImage(color);
      }
      final options = PointAnnotationOptions(
        geometry: Point(
          coordinates: Position(
            widget.longitude,
            widget.latitude,
          ),
        ),
        iconSize: widget.markerSize! / 8.0, // Scale factor for icon size
        image: markerImage,
        iconOffset: [0, -widget.markerSize! / 2], // Center the marker
        iconAnchor: IconAnchor.BOTTOM,
        textField: widget.title,
        textOffset: [0, 1.5],
        textAnchor: TextAnchor.TOP,
        textSize: 12,
        textColor: Colors.black.value,
        textHaloColor: Colors.white.value,
        textHaloWidth: 1.0,
      );
      await _pointAnnotationManager!.create(options);
    } catch (e) {
      _handleError('Marker creation error: $e');
    }
  }

  Color _getLevelColor(String? level) {
    switch (level?.toLowerCase()) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.red;
      case 'critical':
        return Colors.purple;
      default:
        return Colors.blue;
    }
  }

  // Custom marker image generator (copied from multi_mapbox_widget.dart)
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

  void _configureMapSettings() {
    try {
      // Configure gestures
      _mapboxMap?.gestures.updateSettings(
        GesturesSettings(
          rotateEnabled: true,
          pitchEnabled: true,
          scrollEnabled: true,
          simultaneousRotateAndPinchToZoomEnabled: true,
          doubleTapToZoomInEnabled: true,
          doubleTouchToZoomOutEnabled: true,
          quickZoomEnabled: true,
          pinchToZoomEnabled: true,
          scrollMode: ScrollMode.HORIZONTAL_AND_VERTICAL,
        ),
      );

      // Configure location component if needed
      _mapboxMap?.location.updateSettings(
        LocationComponentSettings(
          enabled: false, // We don't need user location for this widget
          pulsingEnabled: false,
          pulsingColor: Colors.blue.value,
          pulsingMaxRadius: 5.0,
        ),
      );
    } catch (e) {
      _handleError('Map configuration error: $e');
    }
  }

  void _handleError(String error) {
    setState(() {
      _errorMessage = error;
      _isLoading = false;
    });
    debugPrint('MapboxWidget Error: $error');
  }

  void _changeMapStyle(String styleKey) {
    if (_mapStyles.containsKey(styleKey)) {
      setState(() {
        _currentStyle = _mapStyles[styleKey]!;
        _mapReady = false;
      });
    }
  }

  void _centerMap() {
    if (_mapboxMap != null) {
      _mapboxMap!.flyTo(
        CameraOptions(
          center: Point(
            coordinates: Position(
              widget.longitude,
              widget.latitude,
            ),
          ),
          zoom: widget.zoom!,
          bearing: widget.bearing!,
          pitch: widget.pitch!,
        ),
        MapAnimationOptions(
          duration: 1000,
        ),
      );
    }
  }

  String _getStyleDisplayName(String styleKey) {
    final styleNames = {
      'streets': 'Streets',
      'satellite': 'Satellite',
      'satelliteStreets': 'Satellite Streets',
      'outdoors': 'Outdoors',
      'light': 'Light',
      'dark': 'Dark',
      'standard': 'Standard',
      'standardSatellite': 'Standard Satellite',
    };
    return styleNames[styleKey] ?? styleKey;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragStart: (_) {}, // Prevent scroll view from intercepting
      onHorizontalDragStart: (_) {},
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 300,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            children: [
              // Error message display
              if (_errorMessage != null)
                Container(
                  width: double.infinity,
                  height: double.infinity,
                  color: Colors.red.withOpacity(0.1),
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.error_outline,
                            color: Theme.of(context).colorScheme.error,
                            size: 32,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Map Error',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  color: Theme.of(context).colorScheme.error,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _errorMessage!,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // Loading indicator
              if (_isLoading && _errorMessage == null)
                Container(
                  width: double.infinity,
                  height: double.infinity,
                  color: Theme.of(context).colorScheme.surface,
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 12),
                        Text('Loading map...'),
                      ],
                    ),
                  ),
                ),

              // Map widget
              if (_errorMessage == null)
                MapWidget(
                  key: ValueKey(_currentStyle),
                  styleUri: _currentStyle,
                  onMapCreated: _onMapCreated,
                  cameraOptions: CameraOptions(
                    center: Point(
                      coordinates: Position(
                        widget.longitude,
                        widget.latitude,
                      ),
                    ),
                    zoom: widget.zoom!,
                    bearing: widget.bearing!,
                    pitch: widget.pitch!,
                  ),
                  mapOptions: MapOptions(
                    contextMode: ContextMode.UNIQUE,
                    constrainMode: ConstrainMode.NONE,
                    orientation: NorthOrientation.UPWARDS,
                    crossSourceCollisions: true,
                    size: Size(
                      width: MediaQuery.of(context).size.width,
                      height: 300,
                    ),
                    pixelRatio: MediaQuery.of(context).devicePixelRatio,
                  ),
                ),

              // Map style selector
              if (widget.showControls && _mapReady && _errorMessage == null)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: DropdownButton<String>(
                      value: _mapStyles.entries
                          .firstWhere((entry) => entry.value == _currentStyle)
                          .key,
                      underline: const SizedBox(),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      icon: Icon(
                        Icons.layers,
                        size: 16,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      items: _mapStyles.keys.map((String style) {
                        return DropdownMenuItem<String>(
                          value: style,
                          child: Text(
                            _getStyleDisplayName(style),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          _changeMapStyle(newValue);
                        }
                      },
                    ),
                  ),
                ),

              // Center button
              if (widget.showControls && _mapReady && _errorMessage == null)
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: FloatingActionButton.small(
                    onPressed: _centerMap,
                    backgroundColor: Theme.of(context).colorScheme.surface,
                    foregroundColor: Theme.of(context).colorScheme.onSurface,
                    elevation: 2,
                    child: const Icon(Icons.my_location, size: 18),
                  ),
                ),

              // Title overlay
              if (widget.title != null && _mapReady && _errorMessage == null)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context)
                          .colorScheme
                          .surface
                          .withOpacity(0.9),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Text(
                      widget.title!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
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
