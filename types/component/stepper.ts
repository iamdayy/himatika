export interface FormError {
  path: string;
  message: string;
}

// Validation rule function type
export type ValidationRule = (
  value: any,
  formData: Record<string, any>
) => FormError | Promise<FormError | null> | null;

// Field validation rules
export type FieldValidationRules<T = Record<string, any>> = {
  [FieldName in keyof T]?: ValidationRule;
};

// Step definition with validation rules and form data
export interface Step<T = Record<string, any>> {
  id: string;
  label: string;
  title: string;
  description?: string;
  validationRules?: FieldValidationRules<T>;
  formData: T;
  onNext?: (formData: T) => Promise<boolean | FormError | void>;
}

// Validation errors by step ID
export interface StepValidationErrors {
  [stepId: string]: {
    [fieldName: string]: FormError;
  };
}

// Step validation event payload
export interface StepValidationEvent {
  stepIndex: number;
  stepId: string;
  isValid: boolean;
  errors: Record<string, FormError>;
  formData: Record<string, any>;
}

// Field validation event payload
export interface FieldValidationEvent {
  field: string;
  error: FormError | null;
  stepId: string;
}

// Validation error event payload
export interface ValidationErrorEvent {
  stepIndex: number;
  stepId: string;
  errors: Record<string, FormError>;
}

// Step change event payload
export interface StepChangeEvent {
  previousStep: number;
  currentStep: number;
  stepId: string;
}

// Step tracking
export interface StepTracking {
  [index: number]: boolean;
}

// Complete event payload with all step data
export interface CompleteEvent {
  [stepId: string]: Record<string, any>;
  allData: Record<string, any>; // Flattened data from all steps
}
