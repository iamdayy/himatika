<script setup lang='ts'>
import type { IMessage } from '~/types';
import type { IConfigResponse, IResponse, ITagsResponse } from '~/types/IResponse';

const { width } = useWindowSize(); // Get the window width
const isMobile = computed(() => width.value < 768); // Define mobile breakpoint as 768px
const { data } = useFetch<IConfigResponse>('/api/config');
const toast = useToast();
const { $ts } = useI18n();

const config = computed(() => data.value?.data);

const { data: tagsData } = useLazyAsyncData(() => $fetch<ITagsResponse>('/api/message/tags'));

const form = reactive<IMessage>({
    name: {
        first: '',
        last: '',
    },
    email: '',
    phone: '',
    subject: '',
    message: '',
    tags: []
});
const tagsSelected = ref<{ id: number, label: string }[]>([]);
const sendMessage = async () => {
    try {
        const response = await useFetch<IResponse>('/api/message', {
            method: 'POST',
            body: form

        });
        if (response.data.value?.statusCode === 200) {
            toast.add({ title: $ts('success'), description: $ts('contact_message_success'), color: "success" });
        }
    } catch (error) {
        toast.add({ title: $ts('failed'), description: $ts('contact_message_failed'), color: "warning" })
    }
}
const tagsOptions = computed({
    get: () => {
        return tagsData.value?.data?.tags.map((tag, i) => ({
            id: i + 1,
            label: tag
        })) || [];
    },
    set: (value) => {
        tagsOptions.value = value;
    }
});
const tags = computed({
    get: () => tagsSelected.value || [],
    set: async (labels) => {
        const promises = labels.map(async (label) => {
            if (label.id) {
                return label
            }
            if (tagsOptions.value.find(tag => tag.label === label.label)) {
                return label;
            }

            // In a real app, you would make an API call to create the label
            const response = {
                id: tagsOptions.value.length + 1,
                label: label.label
            }
            tagsOptions.value.push(response);

            return response
        })
        tagsSelected.value = await Promise.all(promises);
    }
});
/**
 * Delete category
 * @param {number} i - Index of category to delete
 */
const deleteTag = (i: number) => {
    tagsSelected.value.splice(i, 1);
}
/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'lg' | 'md' }>(() => ({
    button: isMobile.value ? 'md' : 'lg',
    input: isMobile.value ? 'md' : 'lg',
}));
// onMounted({

// })
</script>
<template>
    <div class="flex items-center justify-center">
        <div class="text-center">
            <!-- <NuxtImg provider="localProvider" src="/img/handshake.png" alt="Working" width="300" height="300"
                class="object-cover w-full mx-auto mb-8 rounded-full shadow-lg max-w-48" /> -->
            <h1 class="mb-8 text-2xl font-semibold text-gray-800 md:text-4xl md:font-bold dark:text-gray-200">
                {{ $ts('contact_message') }}
            </h1>
            <div class="space-x-4">
                <UButton variant="solid" :size="responsiveUISizes.button" icon="i-heroicons-envelope" target="_blank"
                    :to="`mailto:${config?.contact.email}`">
                    {{ $ts('email_me') }}
                </UButton>
                <UButton color="neutral" variant="outline" :size="responsiveUISizes.button" icon="i-heroicons-phone"
                    target="_blank" :to="`https://wa.me/${config?.contact.phone}`">
                    WhatsApp
                </UButton>
            </div>
        </div>
    </div>
    <USeparator :label="$ts('or')" class="my-8" :ui="{ label: 'text-lg' }" />
    <UCard>
        <UForm :state="form" @submit="sendMessage">
            <div class="grid grid-cols-2 gap-2 mb-2 md:gap-4 md:mb-4">
                <UFormField label="First name" name="firstName">
                    <UInput v-model="form.name.first" :size="responsiveUISizes.input" placeholder="First name" />
                </UFormField>
                <UFormField label="Last name" name="lastName">
                    <UInput v-model="form.name.last" :size="responsiveUISizes.input" placeholder="Last name" />
                </UFormField>
            </div>

            <UFormField label="Email" name="email" class="mb-2 md:mb-4">
                <UInput v-model="form.email" type="email" :size="responsiveUISizes.input"
                    placeholder="you@company.com" />
            </UFormField>

            <UFormField label="Phone number" name="phone" class="mb-2 md:mb-4">
                <UInput v-model="form.phone" type="tel" :size="responsiveUISizes.input" placeholder="(+62) 000-0000"
                    class="flex-grow" />
            </UFormField>
            <UFormField label="Subject" name="phone" class="mb-2 md:mb-4">
                <UInput v-model="form.subject" type="text" :size="responsiveUISizes.input" placeholder="Subject"
                    class="flex-grow" />
            </UFormField>

            <UFormField label="Message" name="message" class="mb-4 md:mb-6">
                <UTextarea v-model="form.message" :size="responsiveUISizes.input" placeholder="Your message here..."
                    :rows="4" />
            </UFormField>
            <!-- Tags input -->
            <UFormField label="Tags">
                <USelectMenu v-model="tags" :options="tagsOptions" multiple searchable creatable by="id"
                    :size="responsiveUISizes.input" class="mb-2">
                    <template #item-label>
                        <span v-if="form.tags">
                            {{ tagsSelected.length }} Tags
                        </span>
                        <span v-else>
                            Select tags
                        </span>
                    </template>
                    <!-- <template #option-create="{ option }">
                                <div class="flex items-center gap-2">
                                    <span class="block truncate">{{ option.title }}</span>
                                    <UInput type="text" v-model="option.description" autofocus />
                                </div>
                            </template> -->
                </USelectMenu>
                <UBadge size="xs" variant="soft" v-for="tag, i in tagsSelected" :key="i">
                    {{ tag.label }}
                    <UButton @click="deleteTag(i)" icon="i-heroicons-x-mark" size="xs"
                        class="text-red-500 dark:text-red-600 hover:text-red-400 dark:hover:text-red-400"
                        variant="link" />
                </UBadge>
            </UFormField>

            <UButton type="submit" block class="my-4" :size="responsiveUISizes.button">

                {{ $ts('send_message') }}
            </UButton>
        </UForm>
    </UCard>

</template>
<style scoped></style>