<script setup>
import { onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { api } from '../api'
import Sidebar from './Sidebar.vue'
import Footer from './Footer.vue'
import AddressBar from './index/AddressBar.vue'

const message = useMessage()
const notification = useNotification()
const { openSettings, userSettings } = useGlobalState()

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
  <div class="main-layout">
    <Sidebar />
    <div class="main-content">
      <div class="content-inner">
        <AddressBar />
        <router-view />
      </div>
      <Footer />
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
}
.main-content {
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
  .content-inner { padding: 16px; padding-top: 48px; }
}
</style>
