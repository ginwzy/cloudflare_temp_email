<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
const { openSettings } = useGlobalState()


const { t } = useI18n({
    messages: {
        en: {
            copyright: "Copyright"
        },
        zh: {
            copyright: "版权所有"
        }
    }
});

</script>

<template>
    <div>
        <n-divider class="footer-divider" />
        <div style="text-align: center; padding: 8px 20px">
            <n-space justify="center">
                <n-text depth="3" style="font-size: 12px;">
                    {{ t('copyright') }} © 2023-{{ new Date().getFullYear() }}
                </n-text>
                <n-text depth="3" style="font-size: 12px;">
                    <div v-html="openSettings.copyright"></div>
                </n-text>
            </n-space>
        </div>
    </div>
</template>


<style scoped>
.footer-divider {
    margin: 0;
    padding: 0 var(--x-padding);
}
</style>
