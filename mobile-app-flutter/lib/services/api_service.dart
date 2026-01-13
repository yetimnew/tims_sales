import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import 'api_config_service.dart';

class ApiService {
  late Dio _dio;
  final ApiConfigService _apiConfigService = ApiConfigService();
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal() {
    _initializeDio();
  }

  Future<void> _initializeDio() async {
    final baseUrl = await _apiConfigService.getApiBaseUrl();
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: AppConfig.apiTimeout,
      receiveTimeout: AppConfig.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token if available
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // Handle errors globally
        if (error.response?.statusCode == 401) {
          // Token expired, logout user
          _clearAuth();
        }
        return handler.next(error);
      },
    ));
  }

  Future<void> _clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
  }

  Future<Response> get(String endpoint, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(endpoint, queryParameters: queryParameters);
      return response;
    } on DioException catch (e) {
      throw await _handleError(e);
    }
  }

  Future<Response> post(String endpoint, {dynamic data}) async {
    try {
      final response = await _dio.post(endpoint, data: data);
      return response;
    } on DioException catch (e) {
      throw await _handleError(e);
    }
  }

  Future<Response> put(String endpoint, {dynamic data}) async {
    try {
      final response = await _dio.put(endpoint, data: data);
      return response;
    } on DioException catch (e) {
      throw await _handleError(e);
    }
  }

  Future<Response> patch(String endpoint, {dynamic data}) async {
    try {
      final response = await _dio.patch(endpoint, data: data);
      return response;
    } on DioException catch (e) {
      throw await _handleError(e);
    }
  }

  Future<Response> delete(String endpoint) async {
    try {
      final response = await _dio.delete(endpoint);
      return response;
    } on DioException catch (e) {
      throw await _handleError(e);
    }
  }

  Future<Response> uploadFile(
    String endpoint,
    XFile file,
    String fieldName, {
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      // Read file as bytes (works on both web and mobile)
      final bytes = await file.readAsBytes();
      
      // Get filename - try name first, then path, then default
      String fileName = 'image.jpg';
      if (file.name.isNotEmpty) {
        fileName = file.name;
      } else if (file.path.isNotEmpty) {
        final pathParts = file.path.split('/');
        if (pathParts.isNotEmpty && pathParts.last.isNotEmpty) {
          fileName = pathParts.last;
        }
      }
      
      // Ensure filename has extension (default to .jpg if missing)
      if (!fileName.contains('.')) {
        fileName = '$fileName.jpg';
      }

      final formDataMap = <String, dynamic>{
        fieldName: MultipartFile.fromBytes(
          bytes,
          filename: fileName,
        ),
      };

      // Add additional form fields if provided
      if (additionalData != null) {
        formDataMap.addAll(additionalData);
      }

      final formData = FormData.fromMap(formDataMap);

      final response = await _dio.post(
        endpoint,
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
      return response;
    } on DioException catch (e) {
      throw await _handleError(e);
    }
  }

  /// Reinitialize Dio with new base URL (call after changing API URL in settings)
  Future<void> reinitialize() async {
    await _initializeDio();
  }

  Future<Exception> _handleError(DioException error) async {
    if (error.response != null) {
      final data = error.response?.data;
      final message = data is Map && data.containsKey('message')
          ? data['message']
          : 'An error occurred';
      return Exception(message);
    } else if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      final baseUrl = await _apiConfigService.getApiBaseUrl();
      return Exception('Connection timeout. Please check your internet connection.\n\nCurrent API URL: $baseUrl\n\nFor physical devices, ensure:\n1. Phone and computer are on same Wi-Fi\n2. API URL is set correctly in Settings\n3. Laravel server is running: php artisan serve --host=0.0.0.0');
    } else if (error.type == DioExceptionType.connectionError) {
      // More detailed connection error message with instructions
      final baseUrl = await _apiConfigService.getApiBaseUrl();
      return Exception('Cannot connect to server at $baseUrl.\n\nFor physical devices:\n1. Find your computer\'s IP (ipconfig on Windows)\n2. Go to Settings → API Configuration\n3. Set URL: http://YOUR_IP:8000/api\n4. Ensure server is running: php artisan serve --host=0.0.0.0');
    } else {
      // More detailed error message
      final baseUrl = await _apiConfigService.getApiBaseUrl();
      return Exception('Network error: ${error.message ?? "Unknown error"}. Server: $baseUrl');
    }
  }
}

