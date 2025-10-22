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

  productionDate: (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) return 'Production date cannot be in the future'
    return ''
  },

  serviceStartDate: (value: string) => {
    if (!value) return ''
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive', 'maintenance'].includes(value)) return 'Invalid status'
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
    if (value.length < 3) return 'Driver ID must be at least 3 characters'
    return ''
  },

  mobile: (value: string) => {
    if (!value) return ''
    const phoneRegex = /^[0-9\s\-\+\(\)]{7,}$/
    if (!phoneRegex.test(value)) return 'Invalid phone number format'
    return ''
  },

  hireddate: (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) return 'Hired date cannot be in the future'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
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
}

export const fuelValidation = {
  truck_id: (value: string) => {
    if (!value) return 'Truck is required'
    return ''
  },

  driver_id: (value: string) => {
    if (!value) return 'Driver is required'
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
    if (!['Construction', 'Agricultural', 'Industrial'].includes(value)) return 'Invalid category'
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
  name: (value: string) => {
    if (!value) return 'Operation name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 255) return 'Name cannot exceed 255 characters'
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive', 'completed'].includes(value)) return 'Invalid status'
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

  truck_id: (value: string) => {
    if (!value) return 'Truck is required'
    return ''
  },

  record_date: (value: string) => {
    if (!value) return 'Record date is required'
    return ''
  },

  safety_score: (value: string) => {
    if (!value) return 'Safety score is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Safety score must be a number'
    if (num < 0 || num > 100) return 'Safety score must be between 0 and 100'
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
  errors.status = driverValidation.status(data.status)
  if (data.mobile) errors.mobile = driverValidation.mobile(data.mobile)
  if (data.hireddate) errors.hireddate = driverValidation.hireddate(data.hireddate)
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

export function validateFuel(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.truck_id = fuelValidation.truck_id(data.truck_id)
  errors.driver_id = fuelValidation.driver_id(data.driver_id)
  errors.fuel_date = fuelValidation.fuel_date(data.fuel_date)
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
  errors.name = operationValidation.name(data.name)
  if (data.status) errors.status = operationValidation.status(data.status)
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
  errors.truck_id = driverSafetyValidation.truck_id(data.truck_id)
  errors.record_date = driverSafetyValidation.record_date(data.record_date)
  errors.safety_score = driverSafetyValidation.safety_score(data.safety_score)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateRegion(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = regionValidation.name(data.name)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateZone(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = zoneValidation.name(data.name)
  errors.region_id = zoneValidation.region_id(data.region_id)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateWoreda(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = woredaValidation.name(data.name)
  errors.zone_id = woredaValidation.zone_id(data.zone_id)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validatePlace(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = placeValidation.name(data.name)
  errors.woreda_id = placeValidation.woreda_id(data.woreda_id)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}

export function validateDistance(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.origin_id = distanceValidation.origin_id(data.origin_id)
  errors.destination_id = distanceValidation.destination_id(data.destination_id)
  errors.distance_km = distanceValidation.distance_km(data.distance_km)
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

export function validateUser(data: any): ValidationErrors {
  const errors: ValidationErrors = {}
  errors.name = userValidation.name(data.name)
  errors.email = userValidation.email(data.email)
  if (data.password) errors.password = userValidation.password(data.password)
  if (data.password_confirmation) errors.password_confirmation = userValidation.password_confirmation(data.password, data.password_confirmation)
  Object.keys(errors).forEach(key => { if (!errors[key]) delete errors[key] })
  return errors
}
