<script setup lang='ts'>
import { ModalsConfirmation } from '#components';
import { format } from 'date-fns';
import type { IFile, IQuestion } from '~~/types';
import type { IResponse } from '~~/types/IResponse';

const { convert } = useImageToBase64()
const overlay = useOverlay();
const { $ts } = useI18n();
const { $api } = useNuxtApp();
const toast = useToast();
const route = useRoute();
const { id } = route.params as { id: string };
const ConfirmationModal = overlay.create(ModalsConfirmation)
const props = defineProps({
    question: {
        type: Object as PropType<IQuestion>,
        required: true
    },
    isEditing: {
        type: Boolean,
        default: false
    },
    type: {
        type: String as PropType<'committee' | 'participant'>,
        default: 'participant'
    },
    disabled: {
        type: Boolean,
        default: false
    },
})
const model = defineModel<any>()
const emit = defineEmits<{
    (e: 'update'): void;
    (e: 'answer', value?: string | number | boolean | string[] | number[] | Date | null | IFile): void;
}>()

const editedQuestion = ref({ ...props.question });
const questionData = computed({
    get: () => props.question,
    set: (value) => {
        editedQuestion.value = value;
    },
})
const fileInput = ref<File | undefined>(undefined);
const questionTypes = computed(() => [
    { label: $ts('text'), value: 'text' },
    { label: $ts('email'), value: 'email' },
    { label: $ts('long_text'), value: 'LongText' },
    { label: $ts('radio'), value: 'radio' },
    { label: $ts('checkbox'), value: 'checkbox' },
    { label: $ts('select'), value: 'select' },
    { label: $ts('rating'), value: 'rating' },
    { label: $ts('slider'), value: 'slider' },
    { label: $ts('date'), value: 'date' },
    { label: $ts('file'), value: 'file' }
])
const editQuestion = async ({ question, type, required, min, max, maxFileSize, acceptedFileTypes }: IQuestion) => {
    try {
        const response = await $api<IResponse & { data: string }>(`api/agenda/${id}/${props.type}/question/${props.question._id}`, {
            method: 'PUT',
            body: {
                question: question,
                type: type,
                required: required,
                min: min,
                max: max,
                maxFileSize: maxFileSize,
                acceptedFileTypes: acceptedFileTypes,
            },
        });
        if (response.statusCode !== 200) {
            toast.add({ title: $ts('failed'), description: $ts('failed_to_edit_question'), color: 'error' });
            return;
        }
        toast.add({ title: $ts('success'), description: $ts('success_to_edit_question'), color: 'success' });
        emit('update');
    } catch (error) {
        toast.add({ title: $ts('failed'), description: $ts('failed_to_edit_question'), color: 'error' });
    }
}
const deleteQuestion = async () => {
    ConfirmationModal.open({
        title: $ts('delete_question'),
        body: $ts('delete_question_confirmation', {
            question: props.question.question,
        }),
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>(`api/agenda/${id}/${props.type}/question/${props.question._id}`, {
                    method: 'DELETE',
                });
                if (response.statusCode === 200) {
                    toast.add({ title: $ts('success'), description: $ts('success_to_delete_question'), color: 'success' });
                    emit('update');
                } else {
                    toast.add({ title: $ts('failed'), description: $ts('failed_to_delete_question'), color: 'error' });
                }
            } catch (error) {
                toast.add({ title: $ts('failed'), description: $ts('failed_to_delete_question'), color: 'error' });
            }
            ConfirmationModal.close();
        },
        onClose: () => {
            ConfirmationModal.close();
        },
    })
}

function handleTextChange(value: string) {
    if (props.isEditing) {
        const updated = { ...questionData.value, question: value }
        questionData.value = updated
        editQuestion(updated)
    }
}

async function handleOptionChange(optionId: string, value: string) {
    if (props.isEditing) {
        try {
            const response = await $api<IResponse & { data: string }>(`api/agenda/${id}/${props.type}/question/${editedQuestion.value._id}/option/${optionId}`, {
                method: 'PUT',
                body: {
                    value: value,
                },
            });
            if (response.statusCode === 200) {
                toast.add({ title: $ts('success'), description: $ts('success_to_edit_option'), color: 'success' });
                emit('update');
            } else {
                toast.add({ title: $ts('failed'), description: $ts('failed_to_edit_option'), color: 'error' })
            }
        } catch (error) {
            toast.add({ title: $ts('failed'), description: $ts('failed_to_edit_option'), color: 'error' })
        }
    }
}

async function addOption() {
    if (props.isEditing) {
        try {
            const response = await $api<IResponse & { data: string }>(`api/agenda/${id}/${props.type}/question/${editedQuestion.value._id}/option`, {
                method: 'POST',
            });
            if (response.statusCode === 200) {
                toast.add({ title: $ts('success'), description: $ts('success_to_add_option'), color: 'success' });
                emit('update');
            } else {
                toast.add({ title: $ts('failed'), description: $ts('failed_to_add_option'), color: 'error' })
            }
        } catch (error) {
            toast.add({ title: $ts('failed'), description: $ts('failed_to_add_option'), color: 'error' })
        }
    }
}

async function deleteOption(optionId: string) {
    if (props.isEditing) {
        ConfirmationModal.open({
            title: $ts('delete_option'),
            body: $ts('delete_option_confirmation', {
                question: props.question.question,
            }),
            onConfirm: async () => {
                try {
                    const response = await $api<IResponse>(`api/agenda/${id}/${props.type}/question/${editedQuestion.value._id}/option/${optionId}`, {
                        method: 'DELETE',
                    });
                    if (response.statusCode === 200) {
                        toast.add({ title: $ts('success'), description: $ts('success_to_delete_option'), color: 'success' });
                        emit('update');
                    } else {
                        toast.add({ title: $ts('failed'), description: $ts('failed_to_delete_option'), color: 'error' })
                    }
                } catch (error) {
                    toast.add({ title: $ts('failed'), description: $ts('failed_to_delete_option'), color: 'error' })
                }
                ConfirmationModal.close();
            },
            onClose: () => {
                ConfirmationModal.close();
            },
        })
    }
}

function toggleRequired(value: boolean | "indeterminate") {
    if (value === "indeterminate") return
    if (props.isEditing) {
        const updated = { ...questionData.value, required: value }
        questionData.value = updated
        editQuestion(updated)
    }
}

function handleAnswer(value?: string | number | boolean | string[] | number[] | Date | null | IFile) {
    emit('answer', value)
}
async function handleFileInput(file?: File) {
    if (file) {
        model.value = file;
    } else {
        model.value = undefined;
    }
}
function handleDownload() {
    if (fileInput.value) {
        const file = fileInput.value!;
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
const AcceptedFileTypesOptions = computed(() => [
    { label: 'JPG', value: '.jpg' },
    { label: 'JPEG', value: '.jpeg' },
    { label: 'PNG', value: '.png' },
    { label: 'PDF', value: '.pdf' },
    { label: 'DOCX', value: '.docx' },
    { label: 'XLSX', value: '.xlsx' },
    { label: 'PPTX', value: '.pptx' },
    { label: 'TXT', value: '.txt' },
    { label: 'ZIP', value: '.zip' },
    { label: 'RAR', value: '.rar' },
    { label: 'MP4', value: '.mp4' },
    { label: 'AVI', value: '.avi' },
    { label: 'MOV', value: '.mov' },
    { label: 'MKV', value: '.mkv' },
    { label: 'MP3', value: '.mp3' },
    { label: 'WAV', value: '.wav' },
    { label: 'FLAC', value: '.flac' },
    { label: 'AAC', value: '.aac' },
    { label: 'OGG', value: '.ogg' },
    { label: 'WMA', value: '.wma' },
    { label: 'WEBM', value: '.webm' },
    { label: 'FLV', value: '.flv' },
    { label: 'M4A', value: '.m4a' },
    { label: '3GP', value: '.3gp' },
    { label: 'WMV', value: '.wmv' },
]);
</script>

<template>
    <div v-if="isEditing" class="space-y-4">
        <div class="flex items-center gap-2">
            <UInput v-model="questionData.question" placeholder="Enter question"
                @change="(value) => handleTextChange((value.target as HTMLInputElement).value)" class="flex-1">
            </UInput>
            <USelect v-model="questionData.type" :items="questionTypes"
                @update:model-value="(value) => editQuestion({ ...questionData, type: value as string })"
                class="w-32" />
            <UButton variant="subtle" @click="deleteQuestion" icon="i-heroicons-trash"></UButton>
        </div>
        <div class="flex items-center gap-2" v-if="['rating', 'slider', 'file'].includes(question.type)">
            <UInputNumber v-model="questionData.max" placeholder="Max value"
                @update:model-value="(value) => editQuestion({ ...questionData, max: value })" orientation="vertical" />
            <UInputNumber v-model="questionData.min" placeholder="Min value"
                @update:model-value="(value) => editQuestion({ ...questionData, min: value })" orientation="vertical" />
            <div class="flex items-center gap-2 w-full" v-if="['file'].includes(question.type)">
                <USelect v-model="questionData.acceptedFileTypes" multiple :items="AcceptedFileTypesOptions"
                    placeholder="Accepted file types (e.g. .jpg, .png)" label-key="label" value-key="value"
                    @update:model-value="(value) => editQuestion({ ...questionData, acceptedFileTypes: value })" />
                <UInputNumber v-model="questionData.maxFileSize" placeholder="Max file size (MB)"
                    @update:model-value="(value) => editQuestion({ ...questionData, maxFileSize: value })"
                    orientation="vertical" :format-options="{
                        style: 'unit',
                        unit: 'megabyte',
                        unitDisplay: 'short',
                        notation: 'compact',
                        compactDisplay: 'short',

                    }" />
            </div>
        </div>


        <div v-if="['radio', 'checkbox', 'select'].includes(question.type)" class="space-y-2 px-4">
            <div class="flex items-center space-x-2" v-for="(option, index) in questionData.options" :key="index">
                <UInput v-model="option.value" :placeholder="`Option ${index + 1}`"
                    @change="(value) => handleOptionChange((option._id as string), (value.target as HTMLInputElement).value)"
                    class="flex-1" />
                <UButton variant="subtle" @click="deleteOption(option._id as string)" icon="i-heroicons-trash" />
            </div>
            <UButton @click="addOption" block>Add Option</UButton>
        </div>

        <div class="flex items-center space-x-2">
            <UCheckbox :id="`required-${question._id}`" v-model="questionData.required"
                @update:model-value="value => toggleRequired(value)" :label="$ts('required')" />
        </div>
    </div>

    <div v-else class="space-y-4">
        <h3 class="text-lg font-semibold">
            {{ question.question }}
            <span v-if="question.required" class="text-red-500 ml-1">*</span>
        </h3>

        <!-- Text input -->
        <UInput v-if="['text', 'email'].includes(question.type)" :type="question.type" :required="question.required"
            @change="event => handleAnswer((event.target as HTMLInputElement).value)" v-model="model"
            :disabled="disabled" />
        <!-- File Input -->
        <div class="flex items-center space-x-2" v-else-if="question.type === 'file'" type="file">
            <UFileUpload v-model="fileInput" :disabled="disabled" :accept="question.acceptedFileTypes?.join(',')">
            </UFileUpload>
            <div class="flex-col flex gap-2 items-center">
                <UButton variant="solid" icon="i-heroicons-arrow-down-tray" @click="handleDownload()"></UButton>
                <UButton variant="subtle" @click="handleFileInput()" icon="i-heroicons-x-mark"></UButton>
            </div>
        </div>

        <!-- Long text -->
        <UTextarea v-else-if="question.type === 'LongText'" :required="question.required" v-model="model"
            @change="event => handleAnswer((event.target as HTMLInputElement).value)" :disabled="disabled" />

        <!-- Radio buttons -->
        <URadioGroup v-else-if="question.type === 'radio'" @update:model-value="handleAnswer"
            :items="question.options.map(o => ({ label: o.value, value: o.value }))" :value="question.answer"
            v-model="model" :required="question.required" class="space-y-2" :disabled="disabled">
            <template #label="{ item }">
                <span>{{ item.label }}</span>
            </template>
        </URadioGroup>

        <!-- Checkboxes -->
        <div v-else-if="question.type === 'checkbox'" class="space-y-2">
            <div v-for="(option, index) in question.options" :key="index" class="flex items-center space-x-2">
                <UCheckbox :value="option.value" @update:model-value="(checked) => {
                    const currentAnswers = Array.isArray(model) ? model : []
                    if (checked) {
                        handleAnswer([...currentAnswers, option.value])
                    } else {
                        handleAnswer(currentAnswers.filter(a => a !== option.value))
                    }
                }" :disabled="disabled" />
                <span>{{ option.value }}</span>
            </div>
        </div>

        <!-- Select dropdown -->
        <USelect v-else-if="question.type === 'select'"
            :items="question.options.map(o => ({ label: o.value, value: o.value }))" @update:model-value="handleAnswer"
            v-model="model" :disabled="disabled" />

        <!-- Rating -->
        <div v-else-if="question.type === 'rating'" class="flex items-center space-x-2">
            <UButton v-for="(_, index) in Array(question.max || 5)" :key="index" variant="ghost" size="lg"
                class="p-1 hover:bg-transparent" :class="index < model ? 'text-yellow-400' : 'text-gray-300'"
                @click="handleAnswer(index + 1)" :disabled="disabled">
                <UIcon name="i-heroicons-star" class="w-8 h-8"
                    :class="index < question.answer ? 'fill-yellow-400' : 'fill-transparent'" />
            </UButton>
        </div>

        <!-- Slider -->
        <div v-else-if="question.type === 'slider'" class="space-y-4">
            <div class="flex justify-between items-center">
                <label :for="`slider-${question._id}`">Value: {{ model }}</label>
            </div>
            <USlider :id="`slider-${question._id}`" v-model="model" :min="1" :max="question.max || 5" :step="1"
                @update:model-value="handleAnswer" />
            <div class="flex justify-between text-sm text-muted-foreground">
                <span>1</span>
                <span>{{ question.max || 5 }}</span>
            </div>
        </div>

        <!-- Date picker -->
        <UPopover v-else-if="question.type === 'date'">
            <UButton variant="outline" class="w-full justify-start text-left">
                <UIcon name="i-heroicons-calendar" class="mr-2 h-4 w-4" />
                <span v-if="model">{{ format(model, 'd MMM yyy') }}</span>
                <span v-else>Pick a date</span>
            </UButton>

            <template #content>
                <DatePicker v-model="model" :disabled="disabled" @update:model-value="handleAnswer"
                    :required="question.required" />
            </template>
        </UPopover>
        <!-- File upload -->
    </div>
</template>