import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
export const useWindowStore = defineStore('window', () => {
    const deviceRatio = ref(
        document.documentElement.clientWidth / document.documentElement.clientHeight,
    )
    const deviceRatioChange = computed(() => deviceRatio.value >= 1)
    const dpi = ref(window.devicePixelRatio)
    const updateDeviceRatio = () => {
        deviceRatio.value =
            document.documentElement.clientWidth / document.documentElement.clientHeight
    }
    return { deviceRatio, deviceRatioChange, dpi, updateDeviceRatio }
})
