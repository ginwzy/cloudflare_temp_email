<script setup>
import { onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { api } from '../api'
import { useIsMobile } from '../utils/composables'
import AppSidebar from '../components/AppSidebar.vue'
import BottomTabBar from '../components/BottomTabBar.vue'
import Footer from '../views/Footer.vue'
import AddressBar from '../views/index/AddressBar.vue'

const message = useMessage()
const notification = useNotification()
const isMobile = useIsMobile()
const { openSettings, userSettings, settings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: { title: 'Cloudflare Temp Email' },
    zh: { title: 'Cloudflare 临时邮件' }
  }
})

useHead({
  title: () => openSettings.value.title || t('title'),
  meta: [{ name: 'description', content: () => openSettings.value.description || t('title') }]
})

onMounted(async () => {
  await api.getOpenSettings(message, notification)
  if (!userSettings.value.user_id) await api.getUserSettings(message)
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar v-if="!isMobile" />
    <div class="app-content">
      <div class="content-inner">
        <AddressBar v-if="!settings.address" />
        <router-view />
      </div>
      <Footer />
    </div>
    <BottomTabBar v-if="isMobile" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--ds-bg);
}
.content-inner {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  .content-inner {
    padding: 16px;
    padding-bottom: calc(16px + var(--ds-bottom-bar-height));
  }
}
</style>
