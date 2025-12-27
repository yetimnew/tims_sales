/**
 * Validation utilities for all application modules
 */

export const truckValidation = {
  plate: (value: string) => {
    if (!value) return 'Plate number is required'
    const ethiopianPlateRegex = /^[A-Z]{2,3}-[0-9]{4,5}$/
    if (!ethiopianPlateRegex.test(value)) {
      return 'Plate must follow Ethiopian format (e.g., AA-1234)'
    }
    return ''
  },

  vehicletype_id: (value: string) => {
    if (!value) return 'Vehicle type is required'
    return ''
  },

  serviceIntervalKM: (value: string) => {
    if (!value) return ''
    const num = parseInt(value, 10)
    if (isNaN(num)) return 'Service interval must be a number'
    if (num < 1000) return 'Service interval must be at least 1,000 KM'
    if (num > 100000) return 'Service interval cannot exceed 100,000 KM'
    return ''
  },

  purchasePrice: (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return 'Purchase price must be a number'
    if (num < 0) return 'Purchase price cannot be negative'
    if (num > 999999999.99) return 'Purchase price is too high'
    return ''
  },

  productionDate: (_value: string) => {
    return ''
  },

  serviceStartDate: (_value: string) => {
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },
}

export const driverValidation = {
  name: (value: string) => {
    if (!value) return 'Driver name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  driverid: (value: string) => {
    if (!value) return 'Driver ID is required'
    if (value.length > 255) return 'Driver ID cannot exceed 255 characters'
    return ''
  },

  sex: (value: string) => {
    if (!value) return 'Gender is required'
    if (!['male', 'female'].includes(value)) return 'Invalid gender selection'
    return ''
  },

  mobile: (value: string) => {
    if (!value) return ''
    if (value.length > 20) return 'Mobile number cannot exceed 20 characters'
    const ethiopianCarrierPattern = /^(?:\+251|251|0)(?:9\d{8}|7\d{8})$/
    if (!ethiopianCarrierPattern.test(value)) {
      return 'Mobile number must be a valid Ethiopian Ethio Telecom or Safaricom number'
    }
    return ''
  },

  hireddate: (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Hired date must be a valid date'
    const todayStr = new Date().toISOString().slice(0, 10)
    if (value > todayStr) return 'Hired date cannot be in the future'
    return ''
  },

  birthdate: (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Birth date must be a valid date'
    const adultCutoff = new Date()
    adultCutoff.setHours(0, 0, 0, 0)
    adultCutoff.setFullYear(adultCutoff.getFullYear() - 18)
    const adultCutoffStr = adultCutoff.toISOString().slice(0, 10)
    if (value > adultCutoffStr) return 'Birth date must show the driver is at least 18 years old'
    if (value <= '1900-01-01') return 'Birth date must be after January 1, 1900'
    return ''
  },

  optionalText: (value: string, label: string) => {
    if (!value) return ''
    if (value.length > 255) return `${label} cannot exceed 255 characters`
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },
}

export const driverTruckValidation = {
  truck_id: (value: string | number) => {
    if (!value) return 'Truck selection is required'
    return ''
  },

  driver_id: (value: string | number) => {
    if (!value) return 'Driver selection is required'
    return ''
  },

  date_recived: (value: string) => {
    if (!value) return 'Assignment date is required'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Assignment date must be a valid date'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(value)
    target.setHours(0, 0, 0, 0)
    if (target > today) return 'Assignment date cannot be in the future'

    const minDate = new Date(today)
    minDate.setDate(today.getDate() - 30)
    if (target < minDate) return 'Assignment date cannot be more than 30 days in the past'

    return ''
  },
}

export const maintenanceValidation = {
  truck_id: (value: string) => {
    if (!value) return 'Truck is required'
    return ''
  },

  maintenance_type_id: (value: string) => {
    if (!value) return 'Maintenance type is required'
    return ''
  },

  scheduled_date: (value: string) => {
    if (!value) return 'Scheduled date is required'
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return 'Scheduled date cannot be in the past'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['scheduled', 'in_progress', 'completed', 'overdue'].includes(value)) return 'Invalid status'
    return ''
  },

  cost: (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return 'Cost must be a number'
    if (num < 0) return 'Cost cannot be negative'
    return ''
  },

  odometer_reading: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Odometer must be a number'
    if (!Number.isInteger(num)) return 'Odometer must be a whole number'
    if (num < 0) return 'Odometer cannot be negative'
    return ''
  },

  assigned_mechanic_id: (value: string) => {
    if (!value) return ''
    return /^\d+$/.test(value) ? '' : 'Select a valid mechanic'
  },

  service_provider: (value: string) => {
    if (!value) return ''
    return value.length <= 255 ? '' : 'Service provider cannot exceed 255 characters'
  },

  work_performed: (value: string) => {
    if (!value) return ''
    return value.length <= 2000 ? '' : 'Work performed cannot exceed 2000 characters'
  },

  parts_replaced: (value: string) => {
    if (!value) return ''
    return value.length <= 2000 ? '' : 'Parts replaced cannot exceed 2000 characters'
  },
}

export const maintenanceTypeValidation = {
  name: (value: string) => {
    if (!value) return 'Maintenance type name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  category: (value: string) => {
    if (!value) return 'Category is required'
    if (!['Preventive', 'Corrective', 'Emergency'].includes(value)) return 'Invalid category'
    return ''
  },

  interval_km: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Interval KM must be a number'
    if (!Number.isInteger(num)) return 'Interval KM must be a whole number'
    if (num <= 0) return 'Interval KM must be greater than zero'
    if (num > 1000000) return 'Interval KM is too large'
    return ''
  },

  interval_months: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Interval months must be a number'
    if (!Number.isInteger(num)) return 'Interval months must be a whole number'
    if (num <= 0) return 'Interval months must be greater than zero'
    if (num > 240) return 'Interval months is too large'
    return ''
  },

  estimated_cost: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Estimated cost must be a number'
    if (num < 0) return 'Estimated cost cannot be negative'
    if (num > 1000000000) return 'Estimated cost is too large'
    return ''
  },

  description: (value: string) => {
    if (!value) return ''
    if (value.length > 1000) return 'Description cannot exceed 1,000 characters'
    return ''
  },

  is_active: (value: boolean | string) => {
    if (value === '' || value === undefined || value === null) return 'Status selection is required'
    if (typeof value === 'boolean') return ''
    if (value === 'true' || value === 'false') return ''
    return 'Invalid status selection'
  },
}

export const fuelValidation = {
  driver_truck_id: (value: string) => {
    if (!value) return 'Driver & truck pairing is required'
    return ''
  },

  fuel_date: (value: string) => {
    if (!value) return 'Fuel date is required'
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) return 'Fuel date cannot be in the future'
    return ''
  },

  fuel_station: (value: string) => {
    if (!value || !value.trim()) return 'Fuel station is required'
    if (value.length > 255) return 'Fuel station cannot exceed 255 characters'
    return ''
  },

  fuel_quantity_liters: (value: string) => {
    if (!value) return 'Fuel quantity is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Quantity must be a number'
    if (num <= 0) return 'Quantity must be greater than 0'
    if (num > 9999.99) return 'Quantity cannot exceed 9,999.99 liters'
    return ''
  },

  fuel_price_per_liter: (value: string) => {
    if (!value) return 'Price per liter is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Price must be a number'
    if (num <= 0) return 'Price must be greater than 0'
    if (num > 999.99) return 'Price cannot exceed 999.99'
    return ''
  },

  fuel_type: (value: string) => {
    if (!value) return 'Fuel type is required'
    if (!['diesel', 'petrol', 'gas'].includes(value)) return 'Invalid fuel type'
    return ''
  },
}

export const financialValidation = {
  truck_id: (value: string) => {
    if (!value) return 'Truck is required'
    return ''
  },

  record_date: (value: string) => {
    if (!value) return 'Record date is required'
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) return 'Record date cannot be in the future'
    return ''
  },

  revenue: (value: string) => {
    if (!value) return 'Revenue is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Revenue must be a number'
    if (num < 0) return 'Revenue cannot be negative'
    return ''
  },

  period_type: (value: string) => {
    if (!value) return 'Period type is required'
    if (!['daily', 'weekly', 'monthly'].includes(value)) return 'Invalid period type'
    return ''
  },

  numericField: (value: string, fieldName: string) => {
    if (!value) return `${fieldName} is required`
    const num = parseFloat(value)
    if (isNaN(num)) return `${fieldName} must be a number`
    if (num < 0) return `${fieldName} cannot be negative`
    return ''
  },
}

export const vehicleTypeValidation = {
  name: (value: string) => {
    if (!value) return 'Vehicle type name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  description: (value: string) => {
    if (!value) return ''
    if (value.length > 1000) return 'Description cannot exceed 1,000 characters'
    return ''
  },
}

// ==================== CARGO TYPE VALIDATION ====================
export const cargoTypeValidation = {
  name: (value: string) => {
    if (!value) return 'Cargo type name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  category: (value: string) => {
    if (!value) return 'Category is required'
    return ''
  },

  weight_per_cubic_meter: (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return 'Weight must be a number'
    if (num < 0) return 'Weight cannot be negative'
    if (num > 9999.99) return 'Weight cannot exceed 9,999.99'
    return ''
  },
}

// ==================== ROUTE PLAN VALIDATION ====================
export const routePlanValidation = {
  operation_id: (value: string) => {
    if (!value) return 'Operation is required'
    return ''
  },

  truck_id: (value: string) => {
    if (!value) return 'Truck is required'
    return ''
  },

  driver_id: (value: string) => {
    if (!value) return 'Driver is required'
    return ''
  },

  planned_date: (value: string) => {
    if (!value) return 'Planned date is required'
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return 'Planned date must be today or in the future'
    return ''
  },

  total_distance_km: (value: string) => {
    if (!value) return 'Total distance is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Distance must be a number'
    if (num <= 0) return 'Distance must be greater than 0'
    return ''
  },

  total_travel_time_minutes: (value: string) => {
    if (!value) return 'Travel time is required'
    const num = parseInt(value, 10)
    if (isNaN(num)) return 'Travel time must be a number'
    if (num < 1) return 'Travel time must be at least 1 minute'
    return ''
  },

  estimated_fuel_cost: (value: string) => {
    if (!value) return 'Estimated fuel cost is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Cost must be a number'
    if (num < 0) return 'Cost cannot be negative'
    return ''
  },
}

// ==================== OPERATION VALIDATION ====================
export const operationValidation = {
  operationid: (value: string) => {
    if (!value) return 'Operation ID is required'
    if (value.length > 255) return 'Operation ID cannot exceed 255 characters'
    return ''
  },

  customer_id: (value: string) => {
    if (!value) return 'Customer is required'
    return ''
  },

  startdate: (value: string) => {
    if (!value) return 'Start date is required'
    const date = new Date(value)
    if (Number.isNaN(date.valueOf())) return 'Start date must be a valid date'
    return ''
  },

  volume: (value: string) => {
    if (!value) return 'Volume is required'
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return 'Volume must be a number'
    if (numericValue < 0) return 'Volume cannot be negative'
    return ''
  },

  cargo_type_id: (value: string) => {
    if (!value) return 'Cargo type is required'
    if (!/^[0-9]+$/.test(value)) return 'Cargo type selection must be valid'
    return ''
  },

  cargo_service_type: (value: string) => {
    if (!value) return 'Cargo service type is required'
    if (!['relief', 'commercial'].includes(value)) return 'Invalid cargo service type'
    return ''
  },

  km: (value: string) => {
    if (!value) return 'Distance is required'
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return 'Distance must be a number'
    if (numericValue < 0) return 'Distance cannot be negative'
    return ''
  },

  tariff: (value: string) => {
    if (!value) return 'Tariff is required'
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return 'Tariff must be a number'
    if (numericValue < 0) return 'Tariff cannot be negative'
    return ''
  },

  remark: (value: string) => {
    if (!value) return ''
    if (value.length > 1000) return 'Description cannot exceed 1,000 characters'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },

  destination_scope: (value: string) => {
    if (!value) return 'Destination scope is required'
    if (!['region', 'zone', 'woreda', 'place'].includes(value)) return 'Invalid destination scope'
    return ''
  },

  destination_id: (value: string) => {
    if (!value) return 'Destination selection is required'
    if (!/^\d+$/.test(value)) return 'Destination selection must be a valid option'
    return ''
  },
}

// ==================== CUSTOMER VALIDATION ====================
export const customerValidation = {
  name: (value: string) => {
    if (!value) return 'Customer name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  email: (value: string) => {
    if (!value) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Invalid email format'
    return ''
  },

  phone: (value: string) => {
    if (!value) return ''
    const phoneRegex = /^[0-9\s\-\+\(\)]{7,}$/
    if (!phoneRegex.test(value)) return 'Invalid phone number format'
    return ''
  },
}

// ==================== DRIVER PERFORMANCE VALIDATION ====================
export const driverPerformanceValidation = {
  driver_id: (value: string) => {
    if (!value) return 'Driver is required'
    return ''
  },

  truck_id: (value: string) => {
    if (!value) return 'Truck is required'
    return ''
  },

  record_date: (value: string) => {
    if (!value) return 'Record date is required'
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) return 'Record date cannot be in the future'
    return ''
  },

  total_trips: (value: string) => {
    if (!value) return 'Total trips is required'
    const num = parseInt(value, 10)
    if (isNaN(num)) return 'Total trips must be a number'
    if (num < 0) return 'Total trips cannot be negative'
    return ''
  },

  total_distance_km: (value: string) => {
    if (!value) return 'Total distance is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Distance must be a number'
    if (num < 0) return 'Distance cannot be negative'
    return ''
  },

  period_type: (value: string) => {
    if (!value) return 'Period type is required'
    if (!['daily', 'weekly', 'monthly'].includes(value)) return 'Invalid period type'
    return ''
  },
}

// ==================== DRIVER SAFETY VALIDATION ====================
export const driverSafetyValidation = {
  driver_id: (value: string) => {
    if (!value) return 'Driver is required'
    return ''
  },

  incident_date: (value: string) => {
    if (!value) return 'Incident date is required'
    const date = new Date(value)
    if (Number.isNaN(date.valueOf())) return 'Incident date must be a valid date'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) return 'Incident date cannot be in the future'
    return ''
  },

  incident_type: (value: string) => {
    if (!value) return 'Incident type is required'
    const allowed = ['accident', 'violation', 'warning']
    if (!allowed.includes(value)) return 'Select a valid incident type'
    return ''
  },

  description: (value: string) => {
    if (!value || !value.trim()) return 'Description is required'
    if (value.length > 2000) return 'Description cannot exceed 2000 characters'
    return ''
  },

  severity: (value: string) => {
    if (!value) return 'Severity is required'
    const allowed = ['minor', 'major', 'critical']
    if (!allowed.includes(value)) return 'Select a valid severity level'
    return ''
  },

  damage_cost: (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (Number.isNaN(num)) return 'Damage cost must be a number'
    if (num < 0) return 'Damage cost cannot be negative'
    if (num > 999999.99) return 'Damage cost cannot exceed 999,999.99'
    return ''
  },

  location: (value: string) => {
    if (!value) return ''
    if (value.length > 255) return 'Location cannot exceed 255 characters'
    return ''
  },

  resolution: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Corrective action cannot exceed 2000 characters'
    return ''
  },
}

// ==================== REGION VALIDATION ====================
export const regionValidation = {
  name: (value: string) => {
    if (!value) return 'Region name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  code: (value: string) => {
    if (!value) return ''
    if (value.length > 50) return 'Code cannot exceed 50 characters'
    return ''
  },

  capital: (value: string) => {
    if (!value) return ''
    if (value.length > 255) return 'Capital cannot exceed 255 characters'
    return ''
  },

  numericRange: (value: string | number | null | undefined, { min, max, allowEmpty = true, label }: { min: number; max: number; allowEmpty?: boolean; label: string }) => {
    if (value === null || value === undefined || value === '') {
      return allowEmpty ? '' : `${label} is required`
    }

    const numericValue = typeof value === 'number' ? value : parseFloat(value)
    if (Number.isNaN(numericValue)) return `${label} must be a number`
    if (numericValue < min) return `${label} must be at least ${min}`
    if (numericValue > max) return `${label} cannot exceed ${max}`
    return ''
  },

  latitude: (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (Number.isNaN(num)) return 'Latitude must be a number'
    if (num < -90 || num > 90) return 'Latitude must be between -90 and 90'
    return ''
  },

  longitude: (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (Number.isNaN(num)) return 'Longitude must be a number'
    if (num < -180 || num > 180) return 'Longitude must be between -180 and 180'
    return ''
  },
}

// ==================== ZONE VALIDATION ====================
export const zoneValidation = {
  name: (value: string) => {
    if (!value) return 'Zone name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  region_id: (value: string) => {
    if (!value) return 'Region is required'
    return ''
  },

  code: (value: string) => {
    if (!value) return ''
    if (value.length > 50) return 'Code cannot exceed 50 characters'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },

  administrative_center: (value: string) => {
    if (!value) return ''
    if (value.length > 255) return 'Administrative center cannot exceed 255 characters'
    return ''
  },

  area_km2: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 999999.99, allowEmpty: true, label: 'Area (km²)' }),

  population: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 1000000000, allowEmpty: true, label: 'Population' }),

  latitude: (value: string | number | null | undefined) => regionValidation.latitude(value),

  longitude: (value: string | number | null | undefined) => regionValidation.longitude(value),

  elevation_m: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: -400, max: 9000, allowEmpty: true, label: 'Elevation (m)' }),

  accessibility_score: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 100, allowEmpty: true, label: 'Accessibility score' }),

  description: (value: string) => {
    if (!value) return ''
    if (value.length > 1000) return 'Description cannot exceed 1,000 characters'
    return ''
  },

  infrastructure_notes: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Infrastructure notes cannot exceed 2,000 characters'
    return ''
  },

  climate_profile: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Climate profile cannot exceed 2,000 characters'
    return ''
  },
}

// ==================== WOREDA VALIDATION ====================
export const woredaValidation = {
  name: (value: string) => {
    if (!value) return 'Woreda name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  zone_id: (value: string) => {
    if (!value) return 'Zone is required'
    return ''
  },

  code: (value: string) => {
    if (!value) return ''
    if (value.length > 50) return 'Code cannot exceed 50 characters'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },

  administrative_center: (value: string) => {
    if (!value) return ''
    if (value.length > 255) return 'Administrative center cannot exceed 255 characters'
    return ''
  },

  area_km2: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 999999.99, allowEmpty: true, label: 'Area (km²)' }),

  population: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 1000000000, allowEmpty: true, label: 'Population' }),

  latitude: (value: string | number | null | undefined) => regionValidation.latitude(value),

  longitude: (value: string | number | null | undefined) => regionValidation.longitude(value),

  elevation_m: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: -400, max: 9000, allowEmpty: true, label: 'Elevation (m)' }),

  accessibility_score: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 100, allowEmpty: true, label: 'Accessibility score' }),

  description: (value: string) => {
    if (!value) return ''
    if (value.length > 1000) return 'Description cannot exceed 1,000 characters'
    return ''
  },

  infrastructure_notes: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Infrastructure notes cannot exceed 2,000 characters'
    return ''
  },

  road_quality_notes: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Road quality notes cannot exceed 2,000 characters'
    return ''
  },

    boundary_geojson: (value: string) => {
      if (!value) return ''
      try {
        const parsed = JSON.parse(value)
        if (parsed === null || typeof parsed !== 'object') {
          return 'Boundary GeoJSON must be a valid GeoJSON object'
        }
      } catch (error) {
        return 'Boundary GeoJSON must be valid JSON'
      }

      return ''
    },
}

// ==================== PLACE VALIDATION ====================
export const placeValidation = {
  name: (value: string) => {
    if (!value) return 'Place name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  woreda_id: (value: string) => {
    if (!value) return 'Woreda is required'
    return ''
  },

  code: (value: string) => {
    if (!value) return ''
    if (value.length > 50) return 'Code cannot exceed 50 characters'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },

  latitude: (value: string | number | null | undefined) => regionValidation.latitude(value),

  longitude: (value: string | number | null | undefined) => regionValidation.longitude(value),

  elevation_m: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: -400, max: 9000, allowEmpty: true, label: 'Elevation (m)' }),

  population: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 1000000000, allowEmpty: true, label: 'Population' }),

  accessibility_score: (value: string | number | null | undefined) =>
    regionValidation.numericRange(value, { min: 0, max: 100, allowEmpty: true, label: 'Accessibility score' }),

  description: (value: string) => {
    if (!value) return ''
    if (value.length > 1000) return 'Description cannot exceed 1,000 characters'
    return ''
  },

  infrastructure_notes: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Infrastructure notes cannot exceed 2,000 characters'
    return ''
  },

  road_quality_notes: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Road quality notes cannot exceed 2,000 characters'
    return ''
  },
}

// ==================== DISTANCE VALIDATION ====================
export const distanceValidation = {
  origin_id: (value: string) => {
    if (!value) return 'Origin is required'
    return ''
  },

  destination_id: (value: string) => {
    if (!value) return 'Destination is required'
    return ''
  },

  distance_km: (value: string) => {
    if (!value) return 'Distance is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Distance must be a number'
    if (num <= 0) return 'Distance must be greater than 0'
    return ''
  },

  average_speed_kmph: (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return 'Average speed must be a number'
    if (num < 0) return 'Average speed must be at least 0'
    if (num > 200) return 'Average speed cannot exceed 200'
    return ''
  },

  road_quality_index: (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return 'Road quality index must be a number'
    if (num < 0) return 'Road quality index must be at least 0'
    if (num > 10) return 'Road quality index cannot exceed 10'
    return ''
  },
}

// ==================== STATUS TYPE VALIDATION ====================
export const statusTypeValidation = {
  name: (value: string) => {
    if (!value) return 'Status type name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },
}

// ==================== STATUS VALIDATION ====================
export const statusValidation = {
  name: (value: string) => {
    if (!value) return 'Status name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  status_type_id: (value: string) => {
    if (!value) return 'Status type is required'
    return ''
  },
}

// ==================== OUTSOURCE VALIDATION ====================
export const outsourceValidation = {
  name: (value: string) => {
    if (!value) return 'Outsource name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  contact_person: (value: string) => {
    if (!value) return 'Contact person is required'
    if (value.length < 2) return 'Contact person must be at least 2 characters'
    return ''
  },

  phone: (value: string) => {
    if (!value) return ''
    const phoneRegex = /^[0-9\s\-\+\(\)]{7,}$/
    if (!phoneRegex.test(value)) return 'Invalid phone number format'
    return ''
  },
}

// ==================== OUTSOURCE PERFORMANCE VALIDATION ====================
export const outsourcePerformanceValidation = {
  outsource_id: (value: string) => {
    if (!value) return 'Vendor is required'
    return ''
  },

  operation_id: (value: string) => {
    if (!value) return 'Operation is required'
    return ''
  },

  trip_number: (value: string) => {
    if (!value) return 'Trip number is required'
    if (value.length > 255) return 'Trip number cannot exceed 255 characters'
    return ''
  },

  dispatch_date: (value: string) => {
    if (!value) return 'Dispatch date is required'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Dispatch date must be a valid date'
    return ''
  },

  from_place_id: (value: string) => {
    if (!value) return 'Origin is required'
    return ''
  },

  to_place_id: (value: string) => {
    if (!value) return 'Destination is required'
    return ''
  },

  distance_km: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Distance must be a number'
    if (num < 0) return 'Distance cannot be negative'
    return ''
  },

  cargo_volume_mt: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Cargo volume must be a number'
    if (num < 0) return 'Cargo volume cannot be negative'
    return ''
  },

  tonkm: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Ton-km must be a number'
    if (num < 0) return 'Ton-km cannot be negative'
    return ''
  },

  cost: (value: string) => {
    if (!value) return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Cost must be a number'
    if (num < 0) return 'Cost cannot be negative'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (value.length > 100) return 'Status cannot exceed 100 characters'
    return ''
  },

  remarks: (value: string) => {
    if (!value) return ''
    if (value.length > 2000) return 'Remarks cannot exceed 2,000 characters'
    return ''
  },
}

export type ValidationErrors = {
  [key: string]: string
}

// ==================== VALIDATE FUNCTIONS ====================

export function validateTruck(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.plate = truckValidation.plate(data.plate)
  errors.vehicletype_id = truckValidation.vehicletype_id(data.vehicletype_id)
  errors.status = truckValidation.status(data.status)
  if (data.serviceIntervalKM) errors.serviceIntervalKM = truckValidation.serviceIntervalKM(data.serviceIntervalKM)
  if (data.purchasePrice) errors.purchasePrice = truckValidation.purchasePrice(data.purchasePrice)
  if (data.productionDate) errors.productionDate = truckValidation.productionDate(data.productionDate)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateDriver(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = driverValidation.name(data.name)
  errors.driverid = driverValidation.driverid(data.driverid)
  errors.sex = driverValidation.sex(data.sex)
  errors.status = driverValidation.status(data.status)
  if (data.mobile) errors.mobile = driverValidation.mobile(data.mobile)
  if (data.hireddate) errors.hireddate = driverValidation.hireddate(data.hireddate)
  if (data.birthdate) errors.birthdate = driverValidation.birthdate(data.birthdate)
  if (data.zone) errors.zone = driverValidation.optionalText(data.zone, 'Zone')
  if (data.woreda) errors.woreda = driverValidation.optionalText(data.woreda, 'Woreda')
  if (data.kebele) errors.kebele = driverValidation.optionalText(data.kebele, 'Kebele')
  if (data.housenumber) errors.housenumber = driverValidation.optionalText(data.housenumber, 'House number')
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateDriverTruck(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.truck_id = driverTruckValidation.truck_id(data.truck_id)
  errors.driver_id = driverTruckValidation.driver_id(data.driver_id)
  errors.date_recived = driverTruckValidation.date_recived(data.date_recived)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateMaintenance(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.truck_id = maintenanceValidation.truck_id(data.truck_id)
  errors.maintenance_type_id = maintenanceValidation.maintenance_type_id(data.maintenance_type_id)
  errors.scheduled_date = maintenanceValidation.scheduled_date(data.scheduled_date)
  errors.status = maintenanceValidation.status(data.status)
  if (data.cost) errors.cost = maintenanceValidation.cost(data.cost)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateMaintenanceType(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = maintenanceTypeValidation.name(data.name)
  errors.category = maintenanceTypeValidation.category(data.category)
  errors.interval_km = maintenanceTypeValidation.interval_km(data.interval_km)
  errors.interval_months = maintenanceTypeValidation.interval_months(data.interval_months)
  errors.estimated_cost = maintenanceTypeValidation.estimated_cost(data.estimated_cost)
  errors.description = maintenanceTypeValidation.description(data.description)
  errors.is_active = maintenanceTypeValidation.is_active(data.is_active)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateFuel(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.driver_truck_id = fuelValidation.driver_truck_id(data.driver_truck_id)
  errors.fuel_date = fuelValidation.fuel_date(data.fuel_date)
  errors.fuel_station = fuelValidation.fuel_station(data.fuel_station)
  errors.fuel_quantity_liters = fuelValidation.fuel_quantity_liters(data.fuel_quantity_liters)
  errors.fuel_price_per_liter = fuelValidation.fuel_price_per_liter(data.fuel_price_per_liter)
  errors.fuel_type = fuelValidation.fuel_type(data.fuel_type)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateFinancial(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.truck_id = financialValidation.truck_id(data.truck_id)
  errors.record_date = financialValidation.record_date(data.record_date)
  errors.revenue = financialValidation.revenue(data.revenue)
  errors.period_type = financialValidation.period_type(data.period_type)
  errors.fuel_cost = financialValidation.numericField(data.fuel_cost, 'Fuel cost')
  errors.maintenance_cost = financialValidation.numericField(data.maintenance_cost, 'Maintenance cost')
  errors.driver_salary = financialValidation.numericField(data.driver_salary, 'Driver salary')
  errors.insurance_cost = financialValidation.numericField(data.insurance_cost, 'Insurance cost')
  errors.depreciation = financialValidation.numericField(data.depreciation, 'Depreciation')
  errors.other_costs = financialValidation.numericField(data.other_costs, 'Other costs')
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateVehicleType(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = vehicleTypeValidation.name(data.name)
  if (data.description) errors.description = vehicleTypeValidation.description(data.description)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateCargoType(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = cargoTypeValidation.name(data.name)
  errors.category = cargoTypeValidation.category(data.category)
  if (data.weight_per_cubic_meter) errors.weight_per_cubic_meter = cargoTypeValidation.weight_per_cubic_meter(data.weight_per_cubic_meter)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateRoutePlan(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.operation_id = routePlanValidation.operation_id(data.operation_id)
  errors.truck_id = routePlanValidation.truck_id(data.truck_id)
  errors.driver_id = routePlanValidation.driver_id(data.driver_id)
  errors.planned_date = routePlanValidation.planned_date(data.planned_date)
  errors.total_distance_km = routePlanValidation.total_distance_km(data.total_distance_km)
  errors.total_travel_time_minutes = routePlanValidation.total_travel_time_minutes(data.total_travel_time_minutes)
  errors.estimated_fuel_cost = routePlanValidation.estimated_fuel_cost(data.estimated_fuel_cost)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateOperation(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.operationid = operationValidation.operationid(data.operationid)
  errors.customer_id = operationValidation.customer_id(data.customer_id)
  errors.startdate = operationValidation.startdate(data.startdate)
  errors.volume = operationValidation.volume(data.volume)
  errors.cargo_type_id = operationValidation.cargo_type_id(data.cargo_type_id)
  errors.cargo_service_type = operationValidation.cargo_service_type(data.cargo_service_type)
  errors.km = operationValidation.km(data.km)
  errors.tariff = operationValidation.tariff(data.tariff)
  errors.status = operationValidation.status(data.status)
  errors.destination_scope = operationValidation.destination_scope(data.destination_scope)
  errors.destination_id = operationValidation.destination_id(data.destination_id)
  if (data.remark) errors.remark = operationValidation.remark(data.remark)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateCustomer(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = customerValidation.name(data.name)
  if (data.email) errors.email = customerValidation.email(data.email)
  if (data.phone) errors.phone = customerValidation.phone(data.phone)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateDriverPerformance(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.driver_id = driverPerformanceValidation.driver_id(data.driver_id)
  errors.truck_id = driverPerformanceValidation.truck_id(data.truck_id)
  errors.record_date = driverPerformanceValidation.record_date(data.record_date)
  errors.total_trips = driverPerformanceValidation.total_trips(data.total_trips)
  errors.total_distance_km = driverPerformanceValidation.total_distance_km(data.total_distance_km)
  errors.period_type = driverPerformanceValidation.period_type(data.period_type)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateDriverSafety(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.driver_id = driverSafetyValidation.driver_id(data.driver_id)
  errors.incident_date = driverSafetyValidation.incident_date(data.incident_date)
  errors.incident_type = driverSafetyValidation.incident_type(data.incident_type)
  errors.description = driverSafetyValidation.description(data.description)
  errors.severity = driverSafetyValidation.severity(data.severity)
  errors.damage_cost = driverSafetyValidation.damage_cost(data.damage_cost)
  errors.location = driverSafetyValidation.location(data.location)
  errors.resolution = driverSafetyValidation.resolution(data.resolution)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateRegion(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = regionValidation.name(data.name)
  if (data.code) errors.code = regionValidation.code(data.code)
  if (data.capital) errors.capital = regionValidation.capital(data.capital)
  if (data.area_km2 !== undefined) errors.area_km2 = regionValidation.numericRange(data.area_km2, { min: 0, max: 999999.99, allowEmpty: true, label: 'Area (km²)' })
  if (data.population !== undefined) errors.population = regionValidation.numericRange(data.population, { min: 0, max: 1000000000, allowEmpty: true, label: 'Population' })
  if (data.latitude !== undefined) errors.latitude = regionValidation.latitude(data.latitude)
  if (data.longitude !== undefined) errors.longitude = regionValidation.longitude(data.longitude)
  if (data.elevation_m !== undefined) errors.elevation_m = regionValidation.numericRange(data.elevation_m, { min: -400, max: 9000, allowEmpty: true, label: 'Elevation (m)' })
  if (data.accessibility_score !== undefined) errors.accessibility_score = regionValidation.numericRange(data.accessibility_score, { min: 0, max: 100, allowEmpty: true, label: 'Accessibility score' })
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateZone(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = zoneValidation.name(data.name)
  errors.region_id = zoneValidation.region_id(data.region_id)
  errors.status = zoneValidation.status(data.status)
  if (data.code) errors.code = zoneValidation.code(data.code)
  if (data.administrative_center !== undefined) errors.administrative_center = zoneValidation.administrative_center(data.administrative_center)
  if (data.area_km2 !== undefined) errors.area_km2 = zoneValidation.area_km2(data.area_km2)
  if (data.population !== undefined) errors.population = zoneValidation.population(data.population)
  if (data.latitude !== undefined) errors.latitude = zoneValidation.latitude(data.latitude)
  if (data.longitude !== undefined) errors.longitude = zoneValidation.longitude(data.longitude)
  if (data.elevation_m !== undefined) errors.elevation_m = zoneValidation.elevation_m(data.elevation_m)
  if (data.accessibility_score !== undefined) errors.accessibility_score = zoneValidation.accessibility_score(data.accessibility_score)
  if (data.description !== undefined) errors.description = zoneValidation.description(data.description)
  if (data.infrastructure_notes !== undefined) errors.infrastructure_notes = zoneValidation.infrastructure_notes(data.infrastructure_notes)
  if (data.climate_profile !== undefined) errors.climate_profile = zoneValidation.climate_profile(data.climate_profile)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateWoreda(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = woredaValidation.name(data.name)
  errors.zone_id = woredaValidation.zone_id(data.zone_id)
  errors.status = woredaValidation.status(data.status)
  if (data.code) errors.code = woredaValidation.code(data.code)
  if (data.administrative_center !== undefined) errors.administrative_center = woredaValidation.administrative_center(data.administrative_center)
  if (data.area_km2 !== undefined) errors.area_km2 = woredaValidation.area_km2(data.area_km2)
  if (data.population !== undefined) errors.population = woredaValidation.population(data.population)
  if (data.latitude !== undefined) errors.latitude = woredaValidation.latitude(data.latitude)
  if (data.longitude !== undefined) errors.longitude = woredaValidation.longitude(data.longitude)
  if (data.elevation_m !== undefined) errors.elevation_m = woredaValidation.elevation_m(data.elevation_m)
  if (data.accessibility_score !== undefined) errors.accessibility_score = woredaValidation.accessibility_score(data.accessibility_score)
  if (data.description !== undefined) errors.description = woredaValidation.description(data.description)
  if (data.infrastructure_notes !== undefined) errors.infrastructure_notes = woredaValidation.infrastructure_notes(data.infrastructure_notes)
  if (data.road_quality_notes !== undefined) errors.road_quality_notes = woredaValidation.road_quality_notes(data.road_quality_notes)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validatePlace(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = placeValidation.name(data.name)
  errors.woreda_id = placeValidation.woreda_id(data.woreda_id)
  errors.status = placeValidation.status(data.status)
  if (data.code) errors.code = placeValidation.code(data.code)
  if (data.latitude !== undefined) errors.latitude = placeValidation.latitude(data.latitude)
  if (data.longitude !== undefined) errors.longitude = placeValidation.longitude(data.longitude)
  if (data.elevation_m !== undefined) errors.elevation_m = placeValidation.elevation_m(data.elevation_m)
  if (data.population !== undefined) errors.population = placeValidation.population(data.population)
  if (data.accessibility_score !== undefined) errors.accessibility_score = placeValidation.accessibility_score(data.accessibility_score)
  if (data.description !== undefined) errors.description = placeValidation.description(data.description)
  if (data.infrastructure_notes !== undefined) errors.infrastructure_notes = placeValidation.infrastructure_notes(data.infrastructure_notes)
  if (data.road_quality_notes !== undefined) errors.road_quality_notes = placeValidation.road_quality_notes(data.road_quality_notes)
    if (data.boundary_geojson !== undefined) errors.boundary_geojson = placeValidation.boundary_geojson(data.boundary_geojson)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateDistance(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.origin_id = distanceValidation.origin_id(data.origin_id)
  errors.destination_id = distanceValidation.destination_id(data.destination_id)
  errors.distance_km = distanceValidation.distance_km(data.distance_km)
  if (data.average_speed_kmph) errors.average_speed_kmph = distanceValidation.average_speed_kmph(data.average_speed_kmph)
  if (data.road_quality_index) errors.road_quality_index = distanceValidation.road_quality_index(data.road_quality_index)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateStatusType(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = statusTypeValidation.name(data.name)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateStatus(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = statusValidation.name(data.name)
  errors.status_type_id = statusValidation.status_type_id(data.status_type_id)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateOutsource(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = outsourceValidation.name(data.name)
  errors.contact_person = outsourceValidation.contact_person(data.contact_person)
  if (data.phone) errors.phone = outsourceValidation.phone(data.phone)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateOutsourcePerformance(data: any): ValidationErrors {
  const errors: ValidationErrors = {}

  errors.outsource_id = outsourcePerformanceValidation.outsource_id(data.outsource_id)
  errors.operation_id = outsourcePerformanceValidation.operation_id(data.operation_id)
  errors.trip_number = outsourcePerformanceValidation.trip_number(data.trip_number)
  errors.dispatch_date = outsourcePerformanceValidation.dispatch_date(data.dispatch_date)
  errors.from_place_id = outsourcePerformanceValidation.from_place_id(data.from_place_id)
  errors.to_place_id = outsourcePerformanceValidation.to_place_id(data.to_place_id)
  errors.status = outsourcePerformanceValidation.status(data.status)

  const distanceError = outsourcePerformanceValidation.distance_km(data.distance_km)
  if (distanceError) errors.distance_km = distanceError

  const cargoError = outsourcePerformanceValidation.cargo_volume_mt(data.cargo_volume_mt)
  if (cargoError) errors.cargo_volume_mt = cargoError

  const tonkmError = outsourcePerformanceValidation.tonkm(data.tonkm)
  if (tonkmError) errors.tonkm = tonkmError

  const costError = outsourcePerformanceValidation.cost(data.cost)
  if (costError) errors.cost = costError

  if (data.remarks) {
    const remarksError = outsourcePerformanceValidation.remarks(data.remarks)
    if (remarksError) errors.remarks = remarksError
  }

  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

// ==================== ROLE VALIDATION ====================
export const roleValidation = {
  name: (value: string) => {
    if (!value) return 'Role name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },
}

export function validateRole(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = roleValidation.name(data.name)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

// ==================== USER VALIDATION ====================
export const userValidation = {
  name: (name: string) => {
    if (!name) return 'Name is required'
    if (name.length < 2) return 'Name must be at least 2 characters'
    return ''
  },
  email: (email: string) => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  },
  password: (password: string) => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    return ''
  },
  password_confirmation: (password: string, confirmation: string) => {
    if (!confirmation) return 'Password confirmation is required'
    if (password !== confirmation) return 'Passwords do not match'
    return ''
  },
}

export function validateUser(data: any, isEdit: boolean = false): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = userValidation.name(data.name)
  errors.email = userValidation.email(data.email)

  // Only validate password if it's provided or it's a create action
  if (!isEdit || data.password) {
    if (data.password) errors.password = userValidation.password(data.password)
    if (data.password_confirmation) errors.password_confirmation = userValidation.password_confirmation(data.password, data.password_confirmation)
  }

  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}
