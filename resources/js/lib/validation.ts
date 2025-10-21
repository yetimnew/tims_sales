/**
 * Validation utilities for truck forms
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

  productionDate: (value: string, serviceStartDate?: string) => {
    if (!value) return ''
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date > today) return 'Production date cannot be in the future'

    if (serviceStartDate) {
      const serviceDate = new Date(serviceStartDate)
      if (serviceDate < date) return 'Service start date must be after production date'
    }
    return ''
  },

  serviceStartDate: (value: string, productionDate?: string) => {
    if (!value) return ''
    const date = new Date(value)

    if (productionDate) {
      const prodDate = new Date(productionDate)
      if (date < prodDate) return 'Service start date must be after production date'
    }
    return ''
  },

  status: (value: string) => {
    if (!value) return 'Status is required'
    if (!['active', 'inactive'].includes(value)) return 'Invalid status'
    return ''
  },
}

export type ValidationErrors = {
  [key: string]: string
}

export function validateTruck(data: {
  plate: string
  vehicletype_id: string
  serviceIntervalKM?: string
  purchasePrice?: string
  productionDate?: string
  serviceStartDate?: string
  status: string
}): ValidationErrors {
  const errors: ValidationErrors = {}

  // Required field validations
  errors.plate = truckValidation.plate(data.plate)
  errors.vehicletype_id = truckValidation.vehicletype_id(data.vehicletype_id)
  errors.status = truckValidation.status(data.status)

  // Optional field validations
  if (data.serviceIntervalKM) {
    errors.serviceIntervalKM = truckValidation.serviceIntervalKM(data.serviceIntervalKM)
  }
  if (data.purchasePrice) {
    errors.purchasePrice = truckValidation.purchasePrice(data.purchasePrice)
  }
  if (data.productionDate) {
    errors.productionDate = truckValidation.productionDate(data.productionDate, data.serviceStartDate)
  }
  if (data.serviceStartDate) {
    errors.serviceStartDate = truckValidation.serviceStartDate(data.serviceStartDate, data.productionDate)
  }

  // Remove empty errors
  Object.keys(errors).forEach(key => {
    if (!errors[key]) delete errors[key]
  })

  return errors
}
