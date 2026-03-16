<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  PersonRound, ReplyRound,
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
      autoReply: 'Auto Reply',
      webhook: 'Webhook', attachments: 'Attachments', about: 'About',
    },
    zh: {
      settings: '设置', account: '账户',
      autoReply: '自动回复',
      webhook: 'Webhook', attachments: '附件', about: '关于',
    }
  }
})

const navItems = computed(() => [
  { key: 'account', label: t('account'), icon: PersonRound, path: '/settings/account', show: true },
  { key: 'auto-reply', label: t('autoReply'), icon: ReplyRound, path: '/settings/auto-reply', show: openSettings.value.enableAutoReply },
  { key: 'webhook', label: t('webhook'), icon: WebhookOutlined, path: '/settings/webhook', show: openSettings.value.enableWebhook },
  { key: 'attachments', label: t('attachments'), icon: CloudUploadRound, path: '/settings/attachments', show: openSettings.value.isS3Enabled },
  { key: 'about', label: t('about'), icon: InfoRound, path: '/settings/about', show: openSettings.value.enableIndexAbout },
].filter(i => i.show))

const activeKey = computed(() => {
  const path = route.path
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
    <div v-if="!isMobile && navItems.length > 1" class="settings-nav">
      <div class="settings-nav-inner">
        <div class="settings-nav-copy">
          <span class="settings-nav-kicker">{{ t('settings') }}</span>
          <h3 class="settings-nav-title">{{ t('settings') }}</h3>
        </div>
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="settings-nav-item"
          :class="{ active: activeKey === item.key }"
          :aria-current="activeKey === item.key ? 'page' : undefined"
          @click="navigate(item.path)"
        >
          <n-icon :component="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
    <div class="settings-content">
      <div class="settings-content-inner">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  gap: 24px;
  min-height: 400px;
  max-width: 1120px;
  margin: 0 auto;
}
.settings-layout.mobile {
  flex-direction: column;
  gap: 12px;
}
.settings-nav {
  width: 240px;
  flex-shrink: 0;
}

.settings-nav-inner {
  display: grid;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(18px);
  box-shadow: var(--ds-shadow-md);
}

.settings-nav-copy {
  display: grid;
  gap: 6px;
  margin-bottom: 4px;
}

.settings-nav-kicker {
  color: var(--ds-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.settings-nav-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ds-text);
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 15px;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: var(--ds-text-secondary);
  font-weight: 600;
  font-size: 14px;
  text-align: left;
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    color var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    border-color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}
.settings-nav-item:hover,
.settings-nav-item:focus-visible {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--ds-surface-soft) 92%, transparent);
  border-color: var(--ds-border);
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-sm);
}
.settings-nav-item.active {
  background: color-mix(in srgb, var(--ds-primary-soft) 88%, var(--ds-surface-strong) 12%);
  border-color: color-mix(in srgb, var(--ds-primary) 20%, var(--ds-border));
  color: var(--ds-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.settings-content {
  flex: 1;
  min-width: 0;
}

.settings-content-inner {
  min-height: 100%;
  padding: 18px 20px;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(18px);
  box-shadow: var(--ds-shadow-md);
}

@media (max-width: 768px) {
  .settings-content-inner {
    padding: 16px;
  }
}
</style>
