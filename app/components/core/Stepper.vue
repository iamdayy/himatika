<template>
    <UForm :state="currentStepFormData" @submit.prevent="tryNextOrComplete" :validate="props.validate">
        <UCard class="stepper-card" :class="cardClass" :ui="ui">
            <!-- Tab-style navigation -->
            <div class="border-b">
                <div class="flex flex-row gap-2 max-w-full overflow-x-auto no-scrollbar">
                    <template v-for="(step, index) in steps" :key="index">
                        <div class="relative flex flex-row items-center justify-center w-full py-2 font-medium transition-colors duration-200"
                            :class="{
                                'text-accent-4 dark:text-accent-3 border-b-2 border-primary': modelValue === index,
                                'text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:dark:text-gray-600 cursor-pointer': modelValue !== index && canNavigateToStep(index),
                                'text-gray-400 dark:text-gray-200 cursor-not-allowed': modelValue !== index && !canNavigateToStep(index),
                                '': modelValue < index
                            }" @click="canNavigateToStep(index) ? goToStep(index) : showValidationWarning(index)">
                            <div class="flex flex-row items-center justify-center">
                                <span class="inline-flex items-center justify-center w-6 h-6 mr-2 text-sm rounded-lg"
                                    :class="{
                                        'bg-primary text-white': completedSteps[index],
                                        'border-gray-400 border': !completedSteps[index]
                                    }">
                                    {{ index + 1 }}
                                </span>
                                <h1 class="text-nowrap">{{ step.label }}</h1>
                                <span v-if="stepHasErrors(index) && attemptedSteps[index]!" class="ml-2 text-red-500">
                                    ⚠️
                                </span>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Progress bar -->
            <div v-if="showProgressBar" class="w-full h-1 my-2 bg-gray-200">
                <div class="h-1 transition-all duration-300 bg-primary" :style="{ width: `${progressPercentage}%` }">
                </div>
            </div>

            <div class="p-6">
                <h2 v-if="showStepTitle" class="mb-1 text-xl font-semibold">{{ steps[modelValue]!.title }}</h2>
                <p v-if="showStepDescription && steps[modelValue]!.description"
                    class="mb-6 text-gray-700 dark:text-gray-300">
                    {{ steps[modelValue]!.description }}
                </p>

                <!-- Validation warning message -->
                <UAlert v-if="showValidationAlert" color="error" class="mb-4">
                    <template #title>
                        {{ 'Failed' }}
                    </template>
                    <template #description>
                        <div class="flex items-center">
                            <span class="mr-2">⚠️</span>
                            <span v-if="invalidStepIndex !== null">
                                Please complete Step {{ invalidStepIndex + 1 }}: {{ steps[invalidStepIndex]!.title }}
                                before proceeding.
                            </span>
                            <span v-else>
                                Please fix the validation errors before proceeding.
                            </span>
                        </div>
                    </template>
                </UAlert>

                <!-- Step content using slots -->
                <slot :step="steps[modelValue]" :step-index="modelValue" :errors="getCurrentStepErrors()"
                    :validate-field="validateFieldForCurrentStep" :form-data="currentStepFormData"></slot>
            </div>

            <template #footer>
                <div class="flex justify-between p-4">
                    <slot name="footer-left">
                        <UButton v-if="modelValue > 0" variant="outline" @click="prevStep">
                            {{ prevButtonText }}
                        </UButton>
                        <div v-else></div>
                    </slot>

                    <slot name="footer-right">
                        <UButton v-if="modelValue < steps.length - 1" type="submit" variant="solid" color="primary"
                            :disabled="isStepInvalid(modelValue)">
                            {{ nextButtonText }}
                        </UButton>
                        <UButton v-else type="submit" variant="solid" color="primary"
                            :disabled="isStepInvalid(modelValue)">
                            {{ completeButtonText }}
                        </UButton>
                    </slot>
                </div>
            </template>
        </UCard>
    </UForm>
</template>

<script setup lang="ts">
import type { CardProps } from '#ui/types';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type {
    CompleteEvent,
    FieldValidationEvent,
    FormError,
    Step,
    StepChangeEvent,
    StepTracking,
    StepValidationErrors,
    StepValidationEvent,
    ValidationErrorEvent
} from '~~/types/component/stepper';

interface Props {
    // v-model for current step
    modelValue: number;
    // Array of step objects with validation rules and form data
    steps: Step[];
    // UI customization
    showProgressBar?: boolean;
    showStepTitle?: boolean;
    showStepDescription?: boolean;
    cardClass?: string;
    ui?: CardProps["ui"];
    // Button text customization
    prevButtonText?: string;
    nextButtonText?: string;
    completeButtonText?: string;
    // Validation behavior
    validate?: ((state: any) => Promise<FormError[]>) | ((state: any) => FormError[]);
    // Navigation options
    targetStep?: number | string; // Can be index number or step ID
    skipValidation?: boolean; // Whether to skip validation when navigating to target step
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: 0,
    showProgressBar: true,
    showStepTitle: true,
    showStepDescription: true,
    cardClass: 'shadow-lg',
    prevButtonText: 'Previous',
    nextButtonText: 'Next',
    completeButtonText: 'Complete',
    skipValidation: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
    'step-change': [payload: StepChangeEvent];
    'validation-error': [payload: ValidationErrorEvent];
    'complete': [payload: CompleteEvent];
    'validate-step': [payload: StepValidationEvent];
    'validate-field': [payload: FieldValidationEvent];
}>();

const showValidationAlert = ref(false);
const invalidStepIndex = ref<number | null>(null);

// Track which steps have been attempted and completed
const attemptedSteps = reactive<StepTracking>({});
const completedSteps = reactive<StepTracking>({});

// Initialize tracking objects
props.steps.forEach((_, index) => {
    attemptedSteps[index] = false;
    completedSteps[index] = false;
});

// Step-specific validation errors
const stepValidationErrors = reactive<StepValidationErrors>({});

// Get current step's form data
const currentStepFormData = computed(() => {
    return props.steps[props.modelValue]!.formData;
});

// Get current step errors
const getCurrentStepErrors = (): Record<string, FormError | undefined> => {
    const stepId = props.steps[props.modelValue]!.id;
    return stepValidationErrors[stepId] || {};
};

// Validate a specific field for the current step
const validateFieldForCurrentStep = (fieldName: string): void => {
    const stepId = props.steps[props.modelValue]!.id;
    validateField(fieldName, stepId, props.modelValue);
};

// Validate a specific field for a specific step
const validateField = async (fieldName: string, stepId: string, stepIndex: number): Promise<void> => {
    const step = props.steps[stepIndex];
    if (!step || !step.validationRules || !step.validationRules[fieldName]) return;

    const rule = step.validationRules[fieldName];
    const error = rule ? await rule(step.formData[fieldName], step.formData) : null;

    // Initialize step errors object if it doesn't exist
    if (!stepValidationErrors[stepId]) {
        stepValidationErrors[stepId] = {};
    }

    if (error) {
        stepValidationErrors[stepId][fieldName] = error;
    } else {
        delete stepValidationErrors[stepId][fieldName];
        // Remove the step errors object if it's empty
        if (Object.keys(stepValidationErrors[stepId]).length === 0) {
            delete stepValidationErrors[stepId];
        }
    }

    emit('validate-field', {
        field: fieldName,
        error,
        stepId
    });
};

// Validate a specific step
const validateStep = async (stepIndex: number): Promise<boolean> => {
    const step = props.steps[stepIndex]!;
    const stepId = step.id;
    let isValid = true;
    const stepErrors: Record<string, FormError> = {};

    try {
        if (step.validationRules) {
            for (const fieldName in step.validationRules) {
                const rule = step.validationRules[fieldName];
                const error = rule ? await rule(step.formData[fieldName], step.formData) : null;

                if (error) {
                    // Initialize step errors object if it doesn't exist
                    if (!stepValidationErrors[stepId]) {
                        stepValidationErrors[stepId] = {};
                    }

                    stepValidationErrors[stepId][fieldName] = error;
                    stepErrors[fieldName] = error;
                    isValid = false;
                } else {
                    if (stepValidationErrors[stepId]) {
                        delete stepValidationErrors[stepId][fieldName];
                        // Remove the step errors object if it's empty
                        if (Object.keys(stepValidationErrors[stepId]).length === 0) {
                            delete stepValidationErrors[stepId];
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error during step validation:", error);
        isValid = false;
    }

    attemptedSteps[stepIndex] = true;

    emit('validate-step', {
        stepIndex,
        stepId,
        isValid,
        errors: stepErrors,
        formData: step.formData
    });

    return isValid;
};

// Execute onNext function for a specific step
const executeOnNext = async (stepIndex: number): Promise<{ success: boolean; error?: FormError }> => {
    const step = props.steps[stepIndex]!;
    const stepId = step.id;

    try {
        // Execute onNext function if provided
        if (step.onNext && typeof step.onNext === 'function') {
            const result = await step.onNext(step.formData);

            if (result === false) {
                return { success: false };
            } else if (result && typeof result === 'object') {
                // Handle FormError result
                if (result.path) {
                    // Initialize step errors object if it doesn't exist
                    if (!stepValidationErrors[stepId]) {
                        stepValidationErrors[stepId] = {};
                    }
                    stepValidationErrors[stepId][result.path] = result;
                    return { success: false, error: result };
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error executing onNext function:", error);
        return { success: false };
    }
};

// Validate all steps up to and including the specified step
const validateStepsUpTo = async (targetStepIndex: number): Promise<{ allValid: boolean; firstInvalidStep: number | null }> => {
    let allValid = true;
    let firstInvalidStep: number | null = null;

    for (let i = 0; i <= targetStepIndex; i++) {
        const isStepValid = await validateStep(i);
        if (!isStepValid && firstInvalidStep === null) {
            firstInvalidStep = i;
            allValid = false;
        }
    }

    return { allValid, firstInvalidStep };
};

// Validate current step
const validateCurrentStep = async (): Promise<boolean> => {
    return await validateStep(props.modelValue);
};

// Handle form submission - try next step or complete based on current step
const tryNextOrComplete = (): void => {
    if (props.modelValue < props.steps.length - 1) {
        tryNextStep();
    } else {
        tryComplete();
    }
};

// Check if a step has validation errors
const isStepInvalid = (stepIndex: number): boolean => {
    if (!attemptedSteps[stepIndex]) return false;

    const stepId = props.steps[stepIndex]!.id;
    return !!stepValidationErrors[stepId] && Object.keys(stepValidationErrors[stepId]).length > 0;
};

// Check if a step has errors (for displaying warning icon)
const stepHasErrors = (stepIndex: number): boolean => {
    const stepId = props.steps[stepIndex]!.id;
    return !!stepValidationErrors[stepId] && Object.keys(stepValidationErrors[stepId]).length > 0;
};

// Try to proceed to the next step with validation
const tryNextStep = async (): Promise<void> => {

    // First validate the step
    const isValid = await validateCurrentStep();

    if (!isValid) {
        showValidationAlert.value = true;
        invalidStepIndex.value = props.modelValue;

        const stepId = props.steps[props.modelValue]!.id;
        emit('validation-error', {
            stepIndex: props.modelValue,
            stepId,
            errors: stepValidationErrors[stepId] || {}
        });
        return;
    }

    // Then execute onNext if validation passed
    const { success, error } = await executeOnNext(props.modelValue);

    if (success) {
        completedSteps[props.modelValue] = true;
        nextStep();
        showValidationAlert.value = false;
    } else {
        showValidationAlert.value = true;
        invalidStepIndex.value = props.modelValue;

        if (error) {
            const stepId = props.steps[props.modelValue]!.id;
            emit('validation-error', {
                stepIndex: props.modelValue,
                stepId,
                errors: { ...stepValidationErrors[stepId], [error.path || 'general']: error }
            });
        }
    }
};

// Collect all form data from all steps
const collectAllFormData = (): CompleteEvent => {
    const result: CompleteEvent = {
        allData: {}
    };

    // Add each step's form data to the result
    props.steps.forEach(step => {
        result[step.id] = step.formData;

        // Also add to flattened allData
        // If there are duplicate keys, the later steps will override earlier ones
        Object.assign(result.allData, step.formData);
    });

    return result;
};

// Try to complete the form with validation
const tryComplete = async (): Promise<void> => {
    // If skipValidation is true, skip validation of previous steps
    if (props.skipValidation) {
        // Only validate the current step
        const isValid = await validateCurrentStep();

        if (!isValid) {
            showValidationAlert.value = true;
            invalidStepIndex.value = props.modelValue;

            const stepId = props.steps[props.modelValue]!.id;
            emit('validation-error', {
                stepIndex: props.modelValue,
                stepId,
                errors: stepValidationErrors[stepId] || {}
            });
            return;
        }

        // Execute onNext for the final step if validation passed
        const { success, error } = await executeOnNext(props.modelValue);

        if (success) {
            completedSteps[props.modelValue] = true;
            const allFormData = collectAllFormData();
            emit('complete', allFormData);
            showValidationAlert.value = false;
        } else {
            showValidationAlert.value = true;
            invalidStepIndex.value = props.modelValue;

            if (error) {
                const stepId = props.steps[props.modelValue]!.id;
                emit('validation-error', {
                    stepIndex: props.modelValue,
                    stepId,
                    errors: { ...stepValidationErrors[stepId], [error.path || 'general']: error }
                });
            }
        }
        return;
    }

    // If not skipping validation, validate all steps before completion
    const { allValid, firstInvalidStep } = await validateStepsUpTo(props.steps.length - 1);

    if (!allValid) {
        showValidationAlert.value = true;
        invalidStepIndex.value = firstInvalidStep;

        // Navigate to the first invalid step
        if (firstInvalidStep !== null && firstInvalidStep !== props.modelValue) {
            goToStep(firstInvalidStep);
        }

        if (firstInvalidStep !== null) {
            const stepId = props.steps[firstInvalidStep]!.id;
            emit('validation-error', {
                stepIndex: firstInvalidStep,
                stepId,
                errors: stepValidationErrors[stepId] || {}
            });
        }
        return;
    }

    // Execute onNext for the final step if validation passed
    const { success, error } = await executeOnNext(props.modelValue);

    if (success) {
        completedSteps[props.modelValue] = true;
        const allFormData = collectAllFormData();
        emit('complete', allFormData);
        showValidationAlert.value = false;
    } else {
        showValidationAlert.value = true;
        invalidStepIndex.value = props.modelValue;

        if (error) {
            const stepId = props.steps[props.modelValue]!.id;
            emit('validation-error', {
                stepIndex: props.modelValue,
                stepId,
                errors: { ...stepValidationErrors[stepId], [error.path || 'general']: error }
            });
        }
    }
};

// Show validation warning when trying to navigate to an inaccessible step
const showValidationWarning = (targetStepIndex: number): void => {
    // Find the first invalid step before the target
    let firstInvalidStep: number | null = null;

    for (let i = 0; i < targetStepIndex; i++) {
        if (!completedSteps[i] || stepHasErrors(i)) {
            firstInvalidStep = i;
            break;
        }
    }

    // Set the invalid step for the alert message
    invalidStepIndex.value = firstInvalidStep;

    // If we found an invalid step, validate it to show the errors
    if (firstInvalidStep !== null) {
        validateStep(firstInvalidStep);
        // Navigate to the first invalid step
        goToStep(firstInvalidStep);

        const stepId = props.steps[firstInvalidStep]!.id;
        emit('validation-error', {
            stepIndex: firstInvalidStep,
            stepId,
            errors: stepValidationErrors[stepId] || {}
        });
    }

    showValidationAlert.value = true;

    // Hide the alert after 3 seconds
    setTimeout(() => {
        showValidationAlert.value = false;
    }, 3000);
};

// Check if user can navigate to a specific step
const canNavigateToStep = (stepIndex: number): boolean => {
    // Can always navigate to current or previous steps
    if (stepIndex <= props.modelValue) return true;

    // Can only navigate to future steps if all previous steps are valid
    for (let i = 0; i < stepIndex; i++) {
        // Check if the step has been completed, or if it's the current step and is valid
        if (!completedSteps[i]) {
            return false;
        }
    }

    return true;
};

// Calculate progress percentage based on completed steps
const progressPercentage = computed((): number => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return (completedCount / props.steps.length) * 100;
});

const nextStep = (): void => {
    if (props.modelValue < props.steps.length - 1) {
        goToStep(props.modelValue + 1);
    }
};

const prevStep = (): void => {
    if (props.modelValue > 0) {
        goToStep(props.modelValue - 1);
    }
};

const goToStep = (index: number): void => {
    emit('update:modelValue', index);
    emit('step-change', {
        previousStep: props.modelValue,
        currentStep: index,
        stepId: props.steps[index]!.id
    });
};

// Navigate to a specific step by index or ID
const navigateToStep = async (target: number | string, skipValidation = false): Promise<boolean> => {
    let targetIndex: number;

    // If target is a string, find the step with matching ID
    if (typeof target === 'string') {
        const stepIndex = props.steps.findIndex(step => step.id === target);
        if (stepIndex === -1) {
            console.error(`Step with ID "${target}" not found`);
            return false;
        }
        targetIndex = stepIndex;
    } else {
        // If target is a number, use it directly
        targetIndex = target;
    }

    // Check if target index is valid
    if (targetIndex < 0 || targetIndex >= props.steps.length) {
        console.error(`Invalid step index: ${targetIndex}`);
        return false;
    }

    // If skipping validation or navigating to a previous step, go directly
    if (skipValidation || targetIndex <= props.modelValue) {
        goToStep(targetIndex);
        return true;
    }

    // Otherwise, validate all steps up to the target
    const { allValid, firstInvalidStep } = await validateStepsUpTo(targetIndex - 1);

    if (allValid) {
        // Mark all previous steps as completed
        for (let i = 0; i <= targetIndex - 1; i++) {
            completedSteps[i] = true;
        }
        goToStep(targetIndex);
        return true;
    } else {
        // Show validation error and navigate to the first invalid step
        showValidationAlert.value = true;
        invalidStepIndex.value = firstInvalidStep;

        if (firstInvalidStep !== null) {
            goToStep(firstInvalidStep);

            const stepId = props.steps[firstInvalidStep]!.id;
            emit('validation-error', {
                stepIndex: firstInvalidStep,
                stepId,
                errors: stepValidationErrors[stepId] || {}
            });
        }
        return false;
    }
};

// Reset validation for a specific step
const resetStepValidation = (stepIndex: number): void => {
    const stepId = props.steps[stepIndex]!.id;
    delete stepValidationErrors[stepId];
    attemptedSteps[stepIndex] = false;
    completedSteps[stepIndex] = false;
};

// Reset all validation
const resetAllValidation = (): void => {
    Object.keys(stepValidationErrors).forEach(key => {
        delete stepValidationErrors[key];
    });

    props.steps.forEach((_, index) => {
        attemptedSteps[index] = false;
        completedSteps[index] = false;
    });
};

// Watch for targetStep prop changes
watch(() => props.targetStep, async (newTarget) => {
    if (newTarget !== undefined) {
        await navigateToStep(newTarget, props.skipValidation);
    }
}, { immediate: true });

watch(() => props.steps, () => {
    resetAllValidation();
}, { deep: true });

onMounted(() => {
    // Reset all validation when the component is mounted
    resetAllValidation();

    // Navigate to target step if provided
    if (props.targetStep !== undefined) {
        navigateToStep(props.targetStep, props.skipValidation);
    }
});

// Expose methods for parent components
defineExpose({
    validateField,
    validateStep,
    validateCurrentStep,
    validateStepsUpTo,
    executeOnNext,
    nextStep,
    prevStep,
    goToStep,
    navigateToStep,
    isStepInvalid,
    stepHasErrors,
    resetStepValidation,
    resetAllValidation,
    collectAllFormData
});
</script>