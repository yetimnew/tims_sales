import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/fuel_service.dart';

class AddFuelRecordScreen extends StatefulWidget {
  const AddFuelRecordScreen({super.key});

  @override
  State<AddFuelRecordScreen> createState() => _AddFuelRecordScreenState();
}

class _AddFuelRecordScreenState extends State<AddFuelRecordScreen> {
  final _formKey = GlobalKey<FormState>();
  final FuelService _fuelService = FuelService();

  DateTime _selectedDate = DateTime.now();
  final _fuelQuantityController = TextEditingController();
  final _fuelPriceController = TextEditingController();
  final _totalCostController = TextEditingController();
  final _fuelStationController = TextEditingController();
  final _odometerController = TextEditingController();
  final _receiptNumberController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedFuelType = 'diesel';
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _fuelQuantityController.dispose();
    _fuelPriceController.dispose();
    _totalCostController.dispose();
    _fuelStationController.dispose();
    _odometerController.dispose();
    _receiptNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _calculateTotalCost() {
    final quantity = double.tryParse(_fuelQuantityController.text) ?? 0;
    final price = double.tryParse(_fuelPriceController.text) ?? 0;
    final total = quantity * price;
    _totalCostController.text = total.toStringAsFixed(2);
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _fuelService.createFuelRecord(
        fuelDate: _selectedDate.toIso8601String().split('T')[0],
        fuelQuantityLiters: double.parse(_fuelQuantityController.text),
        fuelPricePerLiter: double.parse(_fuelPriceController.text),
        totalCost: double.parse(_totalCostController.text),
        fuelStation: _fuelStationController.text.trim(),
        fuelType: _selectedFuelType,
        odometerReading: _odometerController.text.isNotEmpty
            ? int.tryParse(_odometerController.text)
            : null,
        receiptNumber: _receiptNumberController.text.trim().isNotEmpty
            ? _receiptNumberController.text.trim()
            : null,
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
      );

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Fuel record added successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Fuel Record')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Date Selection
              InkWell(
                onTap: _selectDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Fuel Date *',
                    prefixIcon: Icon(Icons.calendar_today),
                    border: OutlineInputBorder(),
                  ),
                  child: Text(
                    DateFormat('MMM d, y').format(_selectedDate),
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Fuel Station
              TextFormField(
                controller: _fuelStationController,
                decoration: const InputDecoration(
                  labelText: 'Fuel Station *',
                  prefixIcon: Icon(Icons.local_gas_station),
                  border: OutlineInputBorder(),
                  hintText: 'Enter fuel station name',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Fuel station is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Fuel Type
              DropdownButtonFormField<String>(
                value: _selectedFuelType,
                decoration: const InputDecoration(
                  labelText: 'Fuel Type *',
                  prefixIcon: Icon(Icons.oil_barrel),
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'diesel', child: Text('Diesel')),
                  DropdownMenuItem(value: 'petrol', child: Text('Petrol')),
                  DropdownMenuItem(value: 'gas', child: Text('Gas')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedFuelType = value;
                    });
                  }
                },
              ),
              const SizedBox(height: 16),

              // Fuel Quantity
              TextFormField(
                controller: _fuelQuantityController,
                decoration: const InputDecoration(
                  labelText: 'Quantity (Liters) *',
                  prefixIcon: Icon(Icons.water_drop),
                  border: OutlineInputBorder(),
                  hintText: '0.00',
                  suffixText: 'L',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => _calculateTotalCost(),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Quantity is required';
                  }
                  final quantity = double.tryParse(value);
                  if (quantity == null || quantity <= 0) {
                    return 'Enter a valid quantity';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Price Per Liter
              TextFormField(
                controller: _fuelPriceController,
                decoration: const InputDecoration(
                  labelText: 'Price Per Liter *',
                  prefixIcon: Icon(Icons.attach_money),
                  border: OutlineInputBorder(),
                  hintText: '0.00',
                  suffixText: 'ETB/L',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => _calculateTotalCost(),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Price per liter is required';
                  }
                  final price = double.tryParse(value);
                  if (price == null || price <= 0) {
                    return 'Enter a valid price';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Total Cost
              TextFormField(
                controller: _totalCostController,
                decoration: const InputDecoration(
                  labelText: 'Total Cost *',
                  prefixIcon: Icon(Icons.calculate),
                  border: OutlineInputBorder(),
                  hintText: '0.00',
                  suffixText: 'ETB',
                  filled: true,
                  fillColor: Colors.grey,
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                readOnly: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Total cost is required';
                  }
                  final total = double.tryParse(value);
                  if (total == null || total <= 0) {
                    return 'Enter a valid total cost';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Odometer Reading
              TextFormField(
                controller: _odometerController,
                decoration: const InputDecoration(
                  labelText: 'Odometer Reading (Optional)',
                  prefixIcon: Icon(Icons.speed),
                  border: OutlineInputBorder(),
                  hintText: '0',
                  suffixText: 'km',
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    final odometer = int.tryParse(value);
                    if (odometer == null || odometer < 0) {
                      return 'Enter a valid odometer reading';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Receipt Number
              TextFormField(
                controller: _receiptNumberController,
                decoration: const InputDecoration(
                  labelText: 'Receipt Number (Optional)',
                  prefixIcon: Icon(Icons.receipt),
                  border: OutlineInputBorder(),
                  hintText: 'Enter receipt number',
                ),
              ),
              const SizedBox(height: 16),

              // Notes
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes (Optional)',
                  prefixIcon: Icon(Icons.note),
                  border: OutlineInputBorder(),
                  hintText: 'Additional notes...',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 24),

              // Error Message
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red.withAlpha(25),
                    border: Border.all(color: Colors.red.withAlpha(76)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),

              // Submit Button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'Add Fuel Record',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

