import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  ConnectivityResult _currentConnectivity = ConnectivityResult.none;
  bool _isInitialized = false;

  // Stream controller for connectivity changes
  final _connectivityController = StreamController<bool>.broadcast();
  Stream<bool> get connectivityStream => _connectivityController.stream;

  // Get current connectivity status
  bool get isConnected => _isWeb ? true : _hasConnection(_currentConnectivity);

  bool get _isWeb => kIsWeb;

  bool _hasConnection(ConnectivityResult result) {
    // Consider connected if result is not none
    return result != ConnectivityResult.none;
  }

  Future<void> initialize() async {
    if (_isInitialized) return;

    if (_isWeb) {
      _connectivityController.add(true);
      _isInitialized = true;
      return;
    }

    try {
      // Get initial connectivity status
      _currentConnectivity = await _connectivity.checkConnectivity();
      _connectivityController.add(_hasConnection(_currentConnectivity));

      // Listen for connectivity changes
      _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
        (ConnectivityResult result) {
          _currentConnectivity = result;
          final connected = _hasConnection(result);
          _connectivityController.add(connected);
        },
      );

      _isInitialized = true;
    } catch (e) {
      // If connectivity check fails, assume connected
      _connectivityController.add(true);
      _isInitialized = true;
    }
  }

  Future<bool> checkConnectivity() async {
    if (_isWeb) return true;

    try {
      final result = await _connectivity.checkConnectivity();
      _currentConnectivity = result;
      final connected = _hasConnection(result);
      _connectivityController.add(connected);
      return connected;
    } catch (e) {
      // If check fails, assume connected to avoid blocking operations
      return true;
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
    _connectivityController.close();
  }
}

