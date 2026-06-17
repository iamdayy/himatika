<script setup lang="ts">
import 'driver.js/dist/driver.css';
const { x, y } = useMouse();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
const isActive = ref(false);
const isLoading = ref(true);
const
  position = computed(() => {
    if (isActive.value && !isMobile.value) {
      return {
        left: `${x.value}px`,
        top: `${y.value}px`,
        opacity: 0.4,
      };
    }
    return {
      left: `50%`,
      top: `0%`,
      opacity: 1,
    };
  });

// Berikan sedikit delay agar logo sempat terlihat (estetika)
setTimeout(() => {
  isLoading.value = false;
}, 1500);
</script>
<template>
  <UApp>
    <div class="light-container" @mousemove="isActive = true" @mouseleave="isActive = false">
      <!-- Light effect -->
      <ClientOnly>
        <div class="light-effect"
          :style="`--left-position:${position.left};--top-position:${position.top};--opacity:${position.opacity}`">
        </div>
      </ClientOnly>
      <!-- Logo -->
      <CoreSplashScreen :loading="isLoading" />
      <NuxtLoadingIndicator color="#ff6600" />
      <div class="content">
        <!-- Maintenance Mode Screen -->
        <!-- <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 text-center z-50 relative">
          <div
            class="max-w-md w-full bg-red-50 dark:bg-red-950/40 p-8 rounded-3xl shadow-lg border border-red-200 dark:border-red-900/50 backdrop-blur-xl">
            <div
              class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Sistem Dalam Perbaikan</h1>
            <p class="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm">
              Saat ini kami sedang mengalami gangguan akses pada sistem. Tim teknis kami sedang berupaya penuh untuk
              memulihkannya secepat mungkin. <br><br>Mohon maaf atas ketidaknyamanan ini.
            </p>
            <div
              class="inline-flex items-center justify-center space-x-2 text-sm text-red-700 dark:text-red-400 font-semibold bg-red-100 dark:bg-red-900/50 px-5 py-2.5 rounded-full border border-red-200 dark:border-red-800/50">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span>Sedang Ditangani...</span>
            </div>
          </div>
        </div> -->

        <!-- DISABLED TEMPORARILY DUE TO DATABASE OUTAGE -->
        <NuxtLayout>
          <NuxtPwaManifest />
          <NuxtPage />
        </NuxtLayout>
        <!-- -->
      </div>
    </div>
  </UApp>
</template>
<style>
.light-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
}

.light-effect {
  transition: transform 1s ease-in, opacity 0.5s ease;
}

.light-effect::before {
  content: '';
  position: absolute;
  width: 200vh;
  aspect-ratio: 1/1;
  /* height: 100%; */
  background: radial-gradient(circle,
      var(--color-accent-1) 0%,
      rgba(142, 84, 142, 0) 66%,
      transparent 90%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  left: var(--left-position);
  top: var(--top-position);
  opacity: var(--opacity);
  mix-blend-mode: screen;
}

.content {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  overflow-y: auto;
}

.flip-enter-active,
.flip-leave-active {
  transition: transform 700ms 400ms ease-out;
}

.flip-enter-from {
  transform: rotateY(-180deg) scale(0.7);
}

.flip-leave-to {
  transform: rotateY(180deg) scale(0.7);
}

.driver-popover.driverjs-theme {
  background-color: rgb(245 245 245 / 0.3);
  border: 1px solid rgb(28 28 38 / 0.5);
  backdrop-filter: blur(4px);
}

.driver-popover.driverjs-theme .driver-popover-title {
  font-size: 20px;
}

.driver-popover.driverjs-theme .driver-popover-description {
  font-size: 16px;
}

.driver-popover.driverjs-theme .driver-popover-progress-text {
  font-size: 14px;
}

.driver-popover.driverjs-theme .driver-popover-title,
.driver-popover.driverjs-theme .driver-popover-description,
.driver-popover.driverjs-theme .driver-popover-progress-text {
  color: rgb(28 28 38);
}

@media (prefers-color-scheme: dark) {

  .dark .driver-popover.driverjs-theme .driver-popover-title,
  .dark .driver-popover.driverjs-theme .driver-popover-description,
  .dark .driver-popover.driverjs-theme .driver-popover-progress-text {
    color: rgb(245 245 245);
  }

  .dark .driver-popover.driverjs-theme {
    background-color: rgb(28 28 38 / 0.3);
    border: 1px solid rgb(245 245 245 / 0.5);
  }
}

.driver-popover-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.driver-popover.driverjs-theme button {
  flex: 1;
  text-align: center;
  background-color: #000;
  color: #ffffff;
  border: 2px solid #000;
  text-shadow: none;
  font-size: 14px;
  padding: 5px 8px;
  border-radius: 6px;
}

.driver-popover.driverjs-theme button:hover {
  background-color: #000;
  color: #ffffff;
}

.driver-popover.driverjs-theme .driver-popover-navigation-btns {
  justify-content: space-between;
  gap: 3px;
}

.driver-popover.driverjs-theme .driver-popover-close-btn {
  color: #9b9b9b;
}

.driver-popover.driverjs-theme .driver-popover-close-btn:hover {
  color: #000;
}

.driver-popover.driverjs-theme .driver-popover-arrow-side-left.driver-popover-arrow {
  border-left-color: #fde047;
}

.driver-popover.driverjs-theme .driver-popover-arrow-side-right.driver-popover-arrow {
  border-right-color: #fde047;
}

.driver-popover.driverjs-theme .driver-popover-arrow-side-top.driver-popover-arrow {
  border-top-color: #fde047;
}

.driver-popover.driverjs-theme .driver-popover-arrow-side-bottom.driver-popover-arrow {
  border-bottom-color: #fde047;
}
</style>
