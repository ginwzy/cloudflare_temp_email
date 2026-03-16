<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  InboxRound,
  SendRound,
  EditRound,
  SettingsRound,
  AlternateEmailRound,
  DarkModeFilled,
  LightModeFilled,
  AdminPanelSettingsRound,
  MoreHorizFilled,
} from '@vicons/material'
import { Language } from '@vicons/fa'
import { useGlobalState } from '../store'
import { getRouterPathWithLang } from '../utils'
import TelegramAddress from '../views/index/TelegramAddress.vue'
import AddressManagement from '../views/user/AddressManagement.vue'

const route = useRoute()
const router = useRouter()

const {
  isDark,
  toggleDark,
  openSettings,
  showAdminPage,
  settings,
  userJwt,
  isTelegram,
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      inbox: 'Inbox',
      sent: 'Sent',
      compose: 'Compose',
      addresses: 'Addresses',
      more: 'More',
      settings: 'Settings',
      admin: 'Admin',
      manage: 'Manage',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
    },
    zh: {
      inbox: '收件箱',
      sent: '发件箱',
      compose: '写邮件',
      addresses: '地址',
      more: '更多',
      settings: '设置',
      admin: '管理',
      manage: '管理',
      darkMode: '深色模式',
      lightMode: '浅色模式',
    },
  },
})

const showMore = ref(false)
const showAddressManage = ref(false)

const activeKey = computed(() => {
  const path = route.path
  if (path.includes('/settings')) return 'settings'
  if (path.includes('/compose')) return 'compose'
  if (path.includes('/sent')) return 'sent'
  if (path.includes('/addresses')) return 'addresses'
  return 'inbox'
})

const tabs = computed(() => {
  const items = [
    { key: 'inbox', label: t('inbox'), icon: InboxRound, path: '/', show: true },
    { key: 'sent', label: t('sent'), icon: SendRound, path: '/sent', show: openSettings.value.enableSendMail },
    { key: 'compose', label: t('compose'), icon: EditRound, path: '/compose', isCta: true, show: openSettings.value.enableSendMail },
  ]
  if (userJwt.value) {
    items.push({ key: 'addresses', label: t('addresses'), icon: AlternateEmailRound, path: '/addresses', show: true })
  }
  items.push({ key: 'more', label: t('more'), icon: MoreHorizFilled, show: true, action: 'more' })
  return items.filter((item) => item.show)
})

const navigate = async (path) => {
  await router.push(getRouterPathWithLang(path, locale.value))
}

const handleTab = async (tab) => {
  if (tab.action === 'more') {
    showMore.value = true
    return
  }
  await navigate(tab.path)
}

const closeMore = () => {
  showMore.value = false
}

const changeLocale = async () => {
  const nextLocale = locale.value === 'zh' ? 'en' : 'zh'
  const normalizedPath = route.path.replace(/^\/en(?=\/|$)/, '') || '/'
  await router.push({
    path: getRouterPathWithLang(normalizedPath, nextLocale),
    query: route.query,
    hash: route.hash,
  })
  closeMore()
}
</script>

<template>
  <div class="bottom-tab-shell">
    <div class="bottom-tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-item"
        :class="{ active: activeKey === tab.key, cta: tab.isCta }"
        :aria-current="activeKey === tab.key ? 'page' : undefined"
        @click="handleTab(tab)"
      >
        <span class="tab-icon-shell">
          <n-icon :component="tab.icon" :size="22" />
        </span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
  </div>

  <n-drawer v-model:show="showMore" placement="bottom" :height="360" :closable="false">
    <n-drawer-content class="more-sheet" :title="t('more')">
      <div class="more-menu">
        <div v-if="settings.address" class="more-menu-header">
          <div class="more-menu-kicker">{{ t('manage') }}</div>
          <div class="more-menu-address">{{ settings.address }}</div>
        </div>

        <button
          v-if="userJwt"
          type="button"
          class="more-item"
          @click="navigate('/settings/account'); closeMore()"
        >
          <n-icon :component="SettingsRound" :size="20" />
          <span>{{ t('settings') }}</span>
        </button>

        <button
          v-if="settings.address || userJwt"
          type="button"
          class="more-item"
          @click="showAddressManage = true; closeMore()"
        >
          <n-icon :component="AlternateEmailRound" :size="20" />
          <span>{{ t('manage') }}</span>
        </button>

        <button
          v-if="showAdminPage"
          type="button"
          class="more-item"
          @click="navigate('/admin/dashboard'); closeMore()"
        >
          <n-icon :component="AdminPanelSettingsRound" :size="20" />
          <span>{{ t('admin') }}</span>
        </button>

        <button type="button" class="more-item" @click="toggleDark(); closeMore()">
          <n-icon :component="isDark ? LightModeFilled : DarkModeFilled" :size="20" />
          <span>{{ isDark ? t('lightMode') : t('darkMode') }}</span>
        </button>

        <button type="button" class="more-item" @click="changeLocale()">
          <n-icon :component="Language" :size="20" />
          <span>{{ locale === 'zh' ? 'English' : '中文' }}</span>
        </button>
      </div>
    </n-drawer-content>
  </n-drawer>

  <n-modal v-model:show="showAddressManage" preset="card" :title="t('manage')">
    <TelegramAddress v-if="isTelegram" />
    <AddressManagement v-else-if="userJwt" />
  </n-modal>
</template>

<style scoped>
.bottom-tab-shell {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + var(--ds-safe-bottom));
  z-index: 120;
}

.bottom-tab-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--ds-border);
  border-radius: 26px;
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(18px);
  box-shadow: var(--ds-shadow-overlay);
}

.tab-item {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 10px 6px 8px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: var(--ds-text-secondary);
  font: inherit;
  cursor: pointer;
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    color var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}

.tab-item::after {
  content: "";
  width: 24px;
  height: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background-color var(--ds-motion-fast) var(--ds-ease-standard);
}

.tab-icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-item.active {
  color: var(--ds-primary);
  background: color-mix(in srgb, var(--ds-primary-soft) 88%, var(--ds-surface-strong) 12%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.tab-item.active::after {
  background: var(--ds-primary);
}

.tab-item.cta {
  color: var(--ds-cta);
}

.tab-item.cta.active {
  background: color-mix(in srgb, var(--ds-cta) 16%, var(--ds-surface-strong));
}

.tab-label {
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.more-sheet :deep(.n-drawer-header) {
  padding-bottom: 0;
}

.more-menu {
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

.more-menu-header {
  margin-bottom: 4px;
  padding: 14px 16px;
  border-radius: var(--ds-radius);
  border: 1px solid color-mix(in srgb, var(--ds-primary) 16%, var(--ds-border));
  background: color-mix(in srgb, var(--ds-primary-soft) 78%, var(--ds-surface-strong) 22%);
}

.more-menu-kicker {
  color: var(--ds-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.more-menu-address {
  margin-top: 8px;
  color: var(--ds-text);
  font-size: 14px;
  font-weight: 700;
  word-break: break-word;
}

.more-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 15px 16px;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius);
  background: var(--ds-surface-soft);
  color: var(--ds-text);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    border-color var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}

.more-item:hover,
.more-item:focus-visible {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ds-primary) 18%, var(--ds-border));
  background: var(--ds-surface-active);
  box-shadow: var(--ds-shadow-sm);
}
</style>
