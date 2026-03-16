<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  InboxRound,
  SendRound,
  EditRound,
  SettingsRound,
  DarkModeFilled,
  LightModeFilled,
  ContentCopyFilled,
  AdminPanelSettingsRound,
  AlternateEmailRound,
} from '@vicons/material'
import { GithubAlt, Language, ExchangeAlt } from '@vicons/fa'
import { useGlobalState } from '../store'
import { getRouterPathWithLang } from '../utils'
import TelegramAddress from '../views/index/TelegramAddress.vue'
import AddressManagement from '../views/user/AddressManagement.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const {
  isDark,
  toggleDark,
  isTelegram,
  openSettings,
  showAdminPage,
  settings,
  userJwt,
  userSettings,
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      inbox: 'Inbox',
      sent: 'Sent',
      compose: 'Compose',
      settings: 'Settings',
      addresses: 'Addresses',
      admin: 'Admin',
      noAddress: 'No active address',
      copied: 'Address copied',
      copyFailed: 'Copy failed',
      manage: 'Manage',
      workspace: 'Inbox workspace',
      mailReady: 'Ready to receive mail',
      guestState: 'Sign in to manage addresses',
      copyAddress: 'Copy address',
      manageAddress: 'Manage addresses',
      switchTheme: 'Toggle theme',
      switchLanguage: 'Switch language',
      openGithub: 'Open GitHub repository',
    },
    zh: {
      inbox: '收件箱',
      sent: '发件箱',
      compose: '写邮件',
      settings: '设置',
      addresses: '地址管理',
      admin: '管理面板',
      noAddress: '当前没有激活地址',
      copied: '地址已复制',
      copyFailed: '复制失败',
      manage: '管理',
      workspace: '收件箱工作区',
      mailReady: '已准备接收邮件',
      guestState: '登录后可管理地址',
      copyAddress: '复制地址',
      manageAddress: '管理地址',
      switchTheme: '切换主题',
      switchLanguage: '切换语言',
      openGithub: '打开 GitHub 仓库',
    },
  },
})

const showAddressManage = ref(false)
const version = import.meta.env.PACKAGE_VERSION ? `v${import.meta.env.PACKAGE_VERSION}` : ''

const activeKey = computed(() => {
  const path = route.path
  if (path.includes('/settings')) return 'settings'
  if (path.includes('/compose')) return 'compose'
  if (path.includes('/sent')) return 'sent'
  if (path.includes('/addresses')) return 'addresses'
  return 'inbox'
})

const navItems = computed(() => [
  { key: 'inbox', label: t('inbox'), icon: InboxRound, path: '/', show: true },
  { key: 'sent', label: t('sent'), icon: SendRound, path: '/sent', show: openSettings.value.enableSendMail },
  { key: 'compose', label: t('compose'), icon: EditRound, path: '/compose', show: openSettings.value.enableSendMail },
  { key: 'addresses', label: t('addresses'), icon: AlternateEmailRound, path: '/addresses', show: !!userJwt.value },
  { key: 'settings', label: t('settings'), icon: SettingsRound, path: '/settings/account', show: !!userJwt.value },
].filter((item) => item.show))

const accountStatus = computed(() => (settings.value.address ? t('mailReady') : t('guestState')))
const accountAddress = computed(() => settings.value.address || t('noAddress'))
const accountMeta = computed(() => userSettings.value.user_email || t('workspace'))
const canManageAddress = computed(() => !!settings.value.address || !!userJwt.value)

const navigate = async (path) => {
  await router.push(getRouterPathWithLang(path, locale.value))
}

const changeLocale = async () => {
  const nextLocale = locale.value === 'zh' ? 'en' : 'zh'
  const normalizedPath = route.path.replace(/^\/en(?=\/|$)/, '') || '/'
  await router.push({
    path: getRouterPathWithLang(normalizedPath, nextLocale),
    query: route.query,
    hash: route.hash,
  })
}

const copyAddress = async () => {
  if (!settings.value.address) return
  try {
    await navigator.clipboard.writeText(settings.value.address)
    message.success(t('copied'))
  } catch {
    message.error(t('copyFailed'))
  }
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <div class="brand">
        <n-avatar src="/logo.png" :size="40" round class="brand-avatar" />
        <div class="brand-copy">
          <strong>{{ openSettings.title || 'Temp Email' }}</strong>
          <span>{{ t('workspace') }}</span>
        </div>
      </div>

      <div class="account-card">
        <div class="account-status">
          <span class="online-dot"></span>
          <span>{{ accountStatus }}</span>
        </div>
        <div class="account-address">
          <n-ellipsis>{{ accountAddress }}</n-ellipsis>
        </div>
        <div class="account-meta">
          {{ accountMeta }}
        </div>
        <div class="account-actions">
          <n-button
            circle
            quaternary
            class="icon-button"
            :aria-label="t('copyAddress')"
            @click="copyAddress"
          >
            <template #icon>
              <n-icon :component="ContentCopyFilled" />
            </template>
          </n-button>
          <n-button
            v-if="canManageAddress"
            circle
            quaternary
            class="icon-button"
            :aria-label="t('manageAddress')"
            @click="showAddressManage = true"
          >
            <template #icon>
              <n-icon :component="ExchangeAlt" />
            </template>
          </n-button>
        </div>
      </div>

      <div class="nav-group">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="nav-item"
          :class="{ active: activeKey === item.key }"
          :aria-current="activeKey === item.key ? 'page' : undefined"
          @click="navigate(item.path)"
        >
          <span class="nav-icon-shell">
            <n-icon :component="item.icon" :size="20" />
          </span>
          <span>{{ item.label }}</span>
        </button>
      </div>

      <div v-if="showAdminPage" class="sidebar-admin">
        <button
          type="button"
          class="nav-item admin-link"
          :class="{ active: route.path.includes('/admin') }"
          :aria-current="route.path.includes('/admin') ? 'page' : undefined"
          @click="navigate('/admin/dashboard')"
        >
          <span class="nav-icon-shell">
            <n-icon :component="AdminPanelSettingsRound" :size="20" />
          </span>
          <span>{{ t('admin') }}</span>
        </button>
      </div>

      <div class="sidebar-footer">
        <div class="footer-actions">
          <n-button
            circle
            quaternary
            class="icon-button"
            :aria-label="t('switchTheme')"
            @click="toggleDark()"
          >
            <template #icon>
              <n-icon :component="isDark ? LightModeFilled : DarkModeFilled" />
            </template>
          </n-button>
          <n-button
            circle
            quaternary
            class="icon-button"
            :aria-label="t('switchLanguage')"
            @click="changeLocale()"
          >
            <template #icon>
              <n-icon :component="Language" />
            </template>
          </n-button>
          <n-button
            v-if="openSettings.showGithub"
            circle
            quaternary
            class="icon-button"
            tag="a"
            target="_blank"
            href="https://github.com/dreamhunter2333/cloudflare_temp_email"
            :aria-label="t('openGithub')"
          >
            <template #icon>
              <n-icon :component="GithubAlt" />
            </template>
          </n-button>
        </div>
        <div class="footer-meta">
          <span v-if="version" class="pill-note">{{ version }}</span>
        </div>
      </div>
    </div>
  </aside>

  <n-modal
    v-model:show="showAddressManage"
    preset="card"
    :title="t('manage')"
    style="max-width: 600px; width: 90%;"
  >
    <TelegramAddress v-if="isTelegram" />
    <AddressManagement v-else-if="userJwt" />
  </n-modal>
</template>

<style scoped>
.sidebar {
  width: var(--ds-sidebar-width);
  flex-shrink: 0;
  padding: 18px 12px 18px 18px;
}

.sidebar-inner {
  position: sticky;
  top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100vh - 36px);
  padding: 20px 18px;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(18px);
  box-shadow: var(--ds-shadow-md);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 2px;
}

.brand-avatar {
  box-shadow: var(--ds-shadow-sm);
}

.brand-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.brand-copy strong {
  font-size: 15px;
  letter-spacing: -0.02em;
}

.brand-copy span {
  color: var(--ds-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.account-card {
  padding: 16px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid color-mix(in srgb, var(--ds-primary) 16%, var(--ds-border));
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--ds-primary-soft) 82%, var(--ds-surface-strong) 18%), color-mix(in srgb, var(--ds-surface-strong) 88%, transparent)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.account-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--ds-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ds-accent);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--ds-accent) 14%, transparent);
}

.account-address {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.account-meta {
  margin-top: 8px;
  color: var(--ds-text-secondary);
  font-size: 12px;
}

.account-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.nav-group {
  display: grid;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 11px 14px;
  border: 1px solid transparent;
  border-radius: 15px;
  background: transparent;
  color: var(--ds-text-secondary);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    color var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    border-color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}

.nav-icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
}

.nav-item:hover,
.nav-item:focus-visible {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--ds-surface-strong) 86%, var(--ds-primary-soft) 14%);
  border-color: var(--ds-border);
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-sm);
}

.nav-item.active {
  background: linear-gradient(180deg, color-mix(in srgb, var(--ds-primary-soft) 92%, white 8%), color-mix(in srgb, var(--ds-primary-soft) 78%, var(--ds-surface-strong) 22%));
  border-color: color-mix(in srgb, var(--ds-primary) 24%, var(--ds-border));
  color: var(--ds-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.sidebar-admin {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--ds-border);
}

.admin-link {
  color: var(--ds-text-secondary);
}

.sidebar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--ds-border);
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-button {
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--ds-surface-soft) 88%, transparent);
}

.icon-button:hover,
.icon-button:focus-visible {
  border-color: color-mix(in srgb, var(--ds-primary) 18%, var(--ds-border));
  background: var(--ds-surface-active);
  color: var(--ds-primary);
}

.footer-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.pill-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--ds-surface-soft);
  border: 1px solid var(--ds-border);
  color: var(--ds-text-secondary);
  font-size: 11px;
  font-weight: 700;
}
</style>
