<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
import 'driver.js/dist/driver.css';
const { x, y } = useMouse();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
const isActive = ref(false);
const isLoading = ref(true);
const position = computed(() => {
  if (isActive.value && !isMobile.value) {
    return {
      left: `${x.value}px`,
      top: `${y.value}px`,
      opacity: 0.7,
    };
  }
  return {
    left: `50%`,
    top: `0%`,
    opacity: 1,
  };
});

onMounted(() => {
  // Berikan sedikit delay agar logo sempat terlihat (estetika)
  setTimeout(() => {
    isLoading.value = false;
  }, 3000);
});
</script>
<template>
  <Analytics />
  <UApp>
    <div class="light-container" @mousemove="isActive = true" @mouseleave="isActive = false">
      <!-- Light effect -->
      <div class="light-effect"
        :style="`--left-position:${position.left};--top-position:${position.top};--opacity:${position.opacity}`"></div>
      <CoreSplashScreen :loading="isLoading" />
      <div class="content">
        <NuxtLoadingIndicator color="#ff6600" />
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>

      <!-- UI components for modals and notifications -->
    </div>
  </UApp>
  <!-- Main content area -->
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
