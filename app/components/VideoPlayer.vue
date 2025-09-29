<template>
    <div>
        <video ref="videoPlayer" class="video-js"></video>
    </div>
</template>

<script lang="ts" setup>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
const props = defineProps({
    options: {
        type: Object,
        default: {}
    }
});
const player = ref<any>(null);
const videoPlayer = ref<any>(null);
onMounted(() => {
    player.value = videojs(videoPlayer.value, props.options, () => {
        // player.value.log('onPlayerReady');
    });
});
onBeforeUnmount(() => {
    if (player.value) {
        player.value.dispose();
    }
});
</script>