<template>
  <HomeLayout>
    <div class="relative min-h-screen mx-6 mt-10 mb-8 isolate lg:px-8">
      <div class="absolute inset-x-0 overflow-hidden -top-40 -z-10 transform-gpu blur-2xl sm:-top-60"
        aria-hidden="true">
        <div
          class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
      <section class="relative min-h-screen px-6 pt-10 pb-8 isolate">
        <div class="absolute w-full transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
          <div class="text-center">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-8xl hero title">Himpunan
              Mahasiswa Informatika</h1>
            <p class="mt-6 text-lg leading-8 text-gray-600 hero subtitle">Himpunan Mahasiswa Informatika atau yang sering
              disebut HIMATIKA
              merupakan suatu organisasi yang menghimpun Mahasiswa Informatika untuk mengembangkan, dan mempraktekkan ilmu
              nya dalam bidang komputer.</p>
            <div class="flex items-center justify-center mt-10 gap-x-6">
              <a href="#about" class="text-sm font-semibold leading-6 text-gray-900">Learn more <span
                  aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </section>
      <div
        class="absolute inset-x-0 top-[24rem] -z-10 transform-gpu overflow-hidden blur-2xl sm:top-[30rem]"
        aria-hidden="true">
        <div
          class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[96.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
      <section class="py-12 overflow-x-hidden about" id="about">
        <About />
      </section>
      <div
        class="absolute inset-x-0 top-[56rem] -z-10 transform-gpu overflow-hidden blur-2xl sm:top-[85rem]"
        aria-hidden="true">
        <div
          class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
      <section class="py-12" id="events" data-aos="fade-right">
        <Events />
      </section>
      <section class="py-12" id="projects" data-aos="zoom-in-up">
        <Projects />
      </section>
      <div
        class="absolute inset-x-0 top-[calc(100%-25rem)] -z-10 transform-gpu overflow-hidden blur-2xl sm:top-[calc(100%-75rem)]"
        aria-hidden="true">
        <div
          class="relative left-[calc(50%-2rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-9rem)] sm:w-[72.1875rem]"
          style="clip-path: polygon(74.1% 44.1%, 90% 61.6%, 37.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
    </div>
  </HomeLayout>
</template>
<script setup lang='ts'>
import { initDropdowns } from 'flowbite';
const { access, dept } = useDept();

definePageMeta({
  layout: false,
  auth: false
});
useHead({
  title: "Himatika"
});
onMounted(() => {
  initDropdowns();
})
</script>
<style scoped>
.hero {
  animation: zoom-in-fade 2s ease-out;
}

.subtitle {
  animation-duration: 2.5s;
}

@keyframes zoom-in-fade {
  0% {
    opacity: 0%;
    transform: scale(1.5, 1.5);
  }

  100% {
    opacity: 100%;
    transform: scale(1, 1);
  }
}
</style>