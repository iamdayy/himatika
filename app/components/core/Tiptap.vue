<template>
    <ClientOnly fallback-tag="span" fallback="Loading player...">
        <div class="overflow-hidden border rounded-md border-accent-2">
            <!-- Editor toolbar -->
            <div class="flex flex-wrap justify-between w-full border-b shadow-md border-accent-2 h-fit">
                <!-- Main editing tools -->
                <UFieldGroup :size="responsiveUISizes.button" orientation="horizontal" v-if="editor && !disabled"
                    :ui="{ rounded: 'rounded-none' }">
                    <UButton icon="i-heroicons-bold" :variant="editor?.isActive('bold') ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleBold().run()"
                        :disabled="!editor?.can().chain().focus().toggleBold().run()" />
                    <UButton icon="i-heroicons-italic" :variant="editor?.isActive('italic') ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleItalic().run()"
                        :disabled="!editor?.can().chain().focus().toggleItalic().run()" />
                    <UButton icon="i-heroicons-strikethrough"
                        :variant="editor?.isActive('strike') ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleStrike().run()"
                        :disabled="!editor?.can().chain().focus().toggleStrike().run()" />
                    <UButton v-for="level in [1, 2, 3, 4, 5]" :key="level" :label="`h${level}`"
                        :variant="editor?.isActive('heading', { level: level as 1 | 2 | 3 | 4 | 5 }) ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 }).run()" />
                    <UButton icon="i-ph-paragraph" @click="editor?.chain().focus().setParagraph().run()" />
                    <UButton icon="i-ph-image" @click="openInput" />
                    <input class="hidden" id="tiptapFileInput" type="file" @input="handleImage" accept="image/*" />
                </UFieldGroup>
                <!-- Undo/Redo buttons -->
                <UFieldGroup :size="responsiveUISizes.button" orientation="horizontal" v-if="editor && !disabled">
                    <UButton icon="i-heroicons-arrow-uturn-left" @click="editor?.chain().focus().undo().run()"
                        :disabled="!editor?.can().chain().focus().undo().run()" />
                    <UButton icon="i-heroicons-arrow-uturn-right" @click="editor?.chain().focus().redo().run()"
                        :disabled="!editor?.can().chain().focus().redo().run()" />
                </UFieldGroup>
            </div>
            <!-- Floating menu for quick formatting -->
            <FloatingMenu :editor="editor" :tippy-options="{ duration: 100 }" v-if="editor && !disabled">
                <UFieldGroup :size="responsiveUISizes.floatingMenu" orientation="horizontal"
                    :ui="{ rounded: 'rounded-full' }">
                    <UButton v-for="level in [1, 2, 3]" :key="level" :label="`h${level}`"
                        :variant="editor?.isActive('heading', { level: level as 1 | 2 | 3 }) ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()" />
                    <UButton icon="i-ph-list-bullets" :variant="editor?.isActive('bulletList') ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleBulletList().run()" />
                    <UButton icon="i-ph-list-numbers" :variant="editor?.isActive('orderedList') ? 'solid' : 'outline'"
                        @click="editor?.chain().focus().toggleOrderedList().run()" />
                    <UButton icon="i-ph-arrow-elbow-down-left" variant="solid"
                        @click="editor?.chain().focus().setHardBreak().run()" />
                </UFieldGroup>
            </FloatingMenu>
            <!-- Main editor content area -->
            <EditorContent :editor="editor" />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { ModalsImageCrop } from "#components";
import type { Content, Editor } from "@tiptap/core";
import { Color } from '@tiptap/extension-color';
import { FileHandler as TiptapFileHandler } from '@tiptap/extension-file-handler';
import { Image as TiptapImage } from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import { Placeholder as TiptapPlaceholder } from "@tiptap/extension-placeholder";
import { TextStyle } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { FloatingMenu } from '@tiptap/vue-3/menus';
import { useWindowSize } from '@vueuse/core';
import imageCompression from 'browser-image-compression';

const overlay = useOverlay();

const ImageCropComp = overlay.create(ModalsImageCrop);

const file = ref<{ blob: string, name: string }>({
    blob: "",
    name: ""
});

// Props definition
const props = defineProps<{
    modelValue: Content,
    disabled?: boolean
}>();
const disabled = computed(() => props.disabled);
// Emits definition
const emit = defineEmits(['update:modelValue']);

/**
 * Opens the file input dialog
 */
const openInput = () => {
    const input = document.getElementById('tiptapFileInput') as HTMLInputElement;
    input?.click();
}

/**
 * Handles the image selection
 * @param {Event} ev - The input event
 */
const handleImage = (ev: Event) => {
    encodeImageFileAsURL((ev.target as HTMLInputElement).files![0]!, openImageCropped);
}

/**
 * Encodes the selected image file as a URL
 * @param {HTMLInputElement} f - The input element containing the file
 */
const encodeImageFileAsURL = async (f: File, fallback: (file: File) => void) => {
    try {
        if (!f) throw new Error("Invalid file provided.");
        const blob = URL.createObjectURL(f);
        ImageCropComp.open({
            img: blob,
            title: f.name,
            stencil: {
                movable: true,
                resizable: true,
            },
            onCropped: (file: File) => {
                fallback(file);
            },
        });
    } catch (error) {
        console.error("Error encoding image file:", error);
    }
}

const processImageFile = (editor: Editor, file: File, pos?: number) => {
    return new Promise<void>((resolve) => {
        encodeImageFileAsURL(file, (f) => {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(f)
            fileReader.onload = () => {
                editor.chain().insertContentAt(pos ? pos : editor.state.selection.anchor, {
                    type: 'image',
                    attrs: {
                        src: fileReader.result,
                    },
                }).focus().run()
                // Only close the crop component when all processing is done
                resolve()
            }
        })
    })
}

/**
 * Handles the cropped image
 * @param {File} file - The cropped image file
 */
const openImageCropped = async (file: File): Promise<void> => {
    const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    }
    const compressedFile = await imageCompression(file, options);
    let reader = new FileReader();
    reader.onloadend = function () {
        unref(editor)?.chain().focus().setImage({ src: reader.result as string }).run()
    }
    reader.readAsDataURL(compressedFile);
    ImageCropComp.close();
}

// Initialize the editor
const editor = useEditor({
    extensions: [
        StarterKit.configure({
            orderedList: {
                HTMLAttributes: {
                    class: 'list-decimal ms-5'
                }
            },
            bulletList: {
                HTMLAttributes: {
                    class: 'list-disc ms-5'
                }
            }
        }),
        TiptapPlaceholder.configure({
            emptyEditorClass: 'is-editor-empty',
            placeholder: 'Write your post content here',
        }),
        TiptapImage.configure({
            allowBase64: true,
            HTMLAttributes: {
                class: 'mx-auto max-w-md'
            }
        }),
        Color.configure({ types: [TextStyle.name, ListItem.name] }),
        Link.configure({
            openOnClick: false,
            defaultProtocol: 'https',
            HTMLAttributes: {
                class: "after:content-['_↗']"
            }
        }),
        TiptapFileHandler.configure({
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            onDrop: async (currentEditor, files, pos) => {
                // Process all files sequentially
                for (const file of files) {
                    await processImageFile(currentEditor, file, pos)
                }
                ImageCropComp.close();
            },
            onPaste: async (currentEditor, files, htmlContent) => {
                // Only return early if there's HTML content but no files
                if (htmlContent && files.length === 0) {
                    return false
                }

                // Process all files sequentially
                for (const file of files) {
                    await processImageFile(currentEditor, file)
                }
                ImageCropComp.close();
            }
        }),
    ],
    editorProps: {
        attributes: {
            class: 'prose p-3 min-w-full min-h-96 dark:prose-invert prose-img:rounded-xl prose-a:text-blue-600'
        }
    },
    content: props.modelValue,
    onUpdate: ({ editor }) => {
        emit('update:modelValue', editor?.getHTML())
    },
});

// Clean up editor on component unmount
onBeforeUnmount(() => {
    unref(editor)?.destroy();
});
// Watch for changes in modelValue and update the editor content
watch(() => props.modelValue, (newValue) => {
    const edit = unref(editor);
    if (editor && newValue !== edit?.getHTML()) {
        edit?.commands.setContent(newValue!);
    }
});
watch(disabled, (value) => {
    if (value) {
        unref(editor)?.setOptions({ editable: false })
    } else {
        unref(editor)?.setOptions({ editable: true })
    }
});
onMounted(() => {
    if (disabled.value) {
        unref(editor)?.setOptions({ editable: false })
    } else {
        unref(editor)?.setOptions({ editable: true })
    }
})
/**
 * Responsive design setup
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    floatingMenu: isMobile.value ? 'xs' : 'md',
}))
</script>

<style>
.tiptap {
    outline: none;
}
</style>