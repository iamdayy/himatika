<script setup lang='ts'>
useHead({
    title: "Dashboard | Himatika"
});
</script>
<template>
    <div class=" justify-center items-center mb-24">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Agenda
            </h2>
            <div class="mt-4">
                <button
                    class="inline-flex items-center text-lg font-medium text-gray-100 bg-green-500 hover:bg-green-400 px-4 rounded-full py-2">
                    Add Agenda
                </button>
            </div>
        </div>
        <div class="flex py-4 px-8 gap-3 w-full">
            <VCalendar class="shadow-lg" />
            <div class="w-full bg-gray-100 border border-gray-400 rounded-lg shadow-lg p-2 py-4">
                <div class="flow-root mx-auto">
                    <div class="-my-4 divide-y divide-gray-200 dark:divide-gray-700">
                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                08:00 - 09:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Opening remarks</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                09:00 - 10:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Bergside LLC: Controlling the video traffic
                                    flows</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                10:00 - 11:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Flowbite - An Open Framework for Forensic
                                    Watermarking</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                11:00 - 12:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Coffee Break</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                12:00 - 13:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Scaling your brand from €0 to multimillion euros</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                13:00 - 14:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Updates from the Open Source Multimedia
                                    community</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                14:00 - 15:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Exploring the balance between customer acquisition
                                    and
                                    retention</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                15:00 - 16:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Flowbite - An Open Framework for Forensic
                                    Watermarking</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                16:00 - 14:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Scaling your brand from €0 to multimillion euros</a>
                            </h3>
                        </div>

                        <div class="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                            <p class="w-32 text-lg font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                17:00 - 14:00
                            </p>
                            <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                <a href="#" class="hover:underline">Drinks & networking</a>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>