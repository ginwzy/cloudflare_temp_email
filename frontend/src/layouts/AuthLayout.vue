<script setup>
import { onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { api } from '../api'

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
})

onMounted(async () => {
  await api.getOpenSettings(message, notification)
  if (!userSettings.value.user_id) await api.getUserSettings(message)
})
</script>

<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-logo">
        <n-avatar src="/logo.png" :size="48" round />
        <h2 class="auth-title">{{ openSettings.title || t('title') }}</h2>
      </div>
      <n-card class="auth-card" :bordered="false">
        <router-view />
      </n-card>
      <n-text depth="3" class="auth-footer">
        &copy; {{ new Date().getFullYear() }}
        <span v-html="openSettings.copyright || 'Dream Hunter'"></span>
      </n-text>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-bg);
  padding: 24px;
}
.auth-container {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.auth-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.auth-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ds-text);
}
.auth-card {
  width: 100%;
  border-radius: var(--ds-radius);
  box-shadow: var(--ds-shadow-md);
}
.auth-footer {
  font-size: 12px;
  text-align: center;
}
</style>
