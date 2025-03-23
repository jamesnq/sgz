/**
 * Validates if all required form fields have been filled
 * 
 * @param fields - Form fields configuration
 * @param formData - Current form data values
 * @returns boolean - true if all required fields are valid, false otherwise
 */
export function validateRequiredFields(
  fields: Array<any>,
  formData: any
): boolean {
  if (!fields || !fields.length) return true;

  // Check each required field
  return fields.every(field => {
    // Skip if field is not required
    if (!field.required) return true;
    
    const value = formData[field.name];
    
    // Field is required but empty
    if (value === undefined || value === null || value === '') return false;
    
    // Field has a value that needs processing (isProcessRequired)
    if (typeof value === 'object' && value !== null) return false;
    
    return true;
  });
}
