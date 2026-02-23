<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  PersonRound, PaletteRound, ReplyRound,
  WebhookOutlined, CloudUploadRound, InfoRound
} from '@vicons/material'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { getRouterPathWithLang } from '../utils'

const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()
const { openSettings } = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      settings: 'Settings', account: 'Account',
      appearance: 'Appearance', autoReply: 'Auto Reply',
      webhook: 'Webhook', attachments: 'Attachments', about: 'About',
    },
    zh: {
      settings: '设置', account: '账户',
      appearance: '外观', autoReply: '自动回复',
      webhook: 'Webhook', attachments: '附件', about: '关于',
    }
  }
})

const navItems = computed(() => [
  { key: 'account', label: t('account'), icon: PersonRound, path: '/settings/account', show: true },
  { key: 'appearance', label: t('appearance'), icon: PaletteRound, path: '/settings/appearance', show: true },
  { key: 'auto-reply', label: t('autoReply'), icon: ReplyRound, path: '/settings/auto-reply', show: openSettings.value.enableAutoReply },
  { key: 'webhook', label: t('webhook'), icon: WebhookOutlined, path: '/settings/webhook', show: openSettings.value.enableWebhook },
  { key: 'attachments', label: t('attachments'), icon: CloudUploadRound, path: '/settings/attachments', show: openSettings.value.isS3Enabled },
  { key: 'about', label: t('about'), icon: InfoRound, path: '/settings/about', show: openSettings.value.enableIndexAbout },
].filter(i => i.show))

const activeKey = computed(() => {
  const path = route.path
  if (path.includes('appearance')) return 'appearance'
  if (path.includes('auto-reply')) return 'auto-reply'
  if (path.includes('webhook')) return 'webhook'
  if (path.includes('attachments')) return 'attachments'
  if (path.includes('about')) return 'about'
  return 'account'
})

const navigate = async (path) => {
  await router.push(getRouterPathWithLang(path, locale.value))
}
</script>

<template>
  <div class="settings-layout" :class="{ mobile: isMobile }">
    <div v-if="!isMobile" class="settings-nav">
      <h3 class="settings-nav-title">{{ t('settings') }}</h3>
      <div v-for="item in navItems" :key="item.key"
        class="settings-nav-item" :class="{ active: activeKey === item.key }"
        @click="navigate(item.path)">
        <n-icon :component="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </div>
    </div>
    <div class="settings-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  gap: 24px;
  min-height: 400px;
}
.settings-layout.mobile {
  flex-direction: column;
  gap: 0;
}
.settings-nav {
  width: 200px;
  flex-shrink: 0;
}
.settings-nav-title {
  margin: 0 0 12px 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--ds-text);
}
.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  color: var(--ds-text-secondary);
  font-weight: 500;
  font-size: 14px;
  transition: all var(--ds-transition);
}
.settings-nav-item:hover { background: var(--ds-bg); color: var(--ds-text); }
.settings-nav-item.active {
  background: color-mix(in srgb, var(--ds-primary) 10%, transparent);
  color: var(--ds-primary);
  font-weight: 600;
}
.settings-content {
  flex: 1;
  min-width: 0;
  max-width: 800px;
}
</style>
