<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  InboxRound, SendRound, EditRound, SettingsRound,
  DarkModeFilled, LightModeFilled, MenuFilled,
  ContentCopyFilled
} from '@vicons/material'
import { GithubAlt, Language, ExchangeAlt } from '@vicons/fa'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { getRouterPathWithLang } from '../utils'
import TelegramAddress from './index/TelegramAddress.vue'
import LocalAddress from './index/LocalAddress.vue'
import AddressManagement from './user/AddressManagement.vue'

const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()
const message = useMessage()

const {
  isDark, toggleDark, isTelegram, openSettings, loading,
  showAdminPage, sidebarCollapsed, settings, userJwt
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      inbox: 'Inbox', sent: 'Sent', compose: 'Compose',
      settings: 'Settings', menu: 'Menu', noAddress: 'Not logged in',
      copied: 'Address copied', manage: 'Manage',
    },
    zh: {
      inbox: '收件箱', sent: '发件箱', compose: '写邮件',
      settings: '设置', menu: '菜单', noAddress: '未登录',
      copied: '地址已复制', manage: '管理',
    }
  }
})

const showDrawer = ref(false)
const version = import.meta.env.PACKAGE_VERSION ? `v${import.meta.env.PACKAGE_VERSION}` : ""

const activeKey = computed(() => {
  if (route.path.includes('/settings')) return 'settings'
  if (route.path.includes('/compose')) return 'compose'
  if (route.path.includes('/sent')) return 'sent'
  return 'inbox'
})

const navItems = computed(() => [
  { key: 'inbox', label: t('inbox'), icon: InboxRound, path: '/', show: true },
  { key: 'sent', label: t('sent'), icon: SendRound, path: '/sent', show: openSettings.value.enableSendMail },
  { key: 'compose', label: t('compose'), icon: EditRound, path: '/compose', show: openSettings.value.enableSendMail },
  { key: 'settings', label: t('settings'), icon: SettingsRound, path: '/settings', show: true },
].filter(i => i.show))

const navigate = async (path) => {
  await router.push(getRouterPathWithLang(path, locale.value))
  showDrawer.value = false
}

const changeLocale = async () => {
  if (locale.value === 'zh') {
    await router.push(`/en${route.fullPath}`)
  } else {
    await router.push(route.fullPath.replace('/en', ''))
  }
}

const logoClickCount = ref(0)
const logoClick = async () => {
  if (route.path.includes('admin')) { logoClickCount.value = 0; return }
  logoClickCount.value++
  if (logoClickCount.value >= 5) {
    logoClickCount.value = 0
    message.info('Change to admin Page')
    loading.value = true
    await router.push(getRouterPathWithLang('/admin', locale.value))
    loading.value = false
  } else {
    message.info(`Click ${5 - logoClickCount.value + 1} times to enter the admin page`)
  }
}

const truncatedAddress = computed(() => {
  const addr = settings.value.address
  if (!addr) return t('noAddress')
  if (addr.length <= 24) return addr
  const [local, domain] = addr.split('@')
  if (!domain) return addr
  const maxLocal = 24 - domain.length - 4
  if (maxLocal < 3) return addr.substring(0, 21) + '...'
  return local.substring(0, maxLocal) + '...@' + domain
})

const showAddressManage = ref(false)

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(settings.value.address)
    message.success(t('copied'))
  } catch { message.error('Copy failed') }
}
</script>

<template>
  <!-- Mobile: hamburger button -->
  <n-button v-if="isMobile" class="mobile-menu-btn" text @click="showDrawer = true">
    <template #icon><n-icon :component="MenuFilled" :size="22" /></template>
  </n-button>

  <!-- Mobile drawer -->
  <n-drawer v-if="isMobile" v-model:show="showDrawer" placement="left" :width="280">
    <n-drawer-content :title="t('menu')" closable>
      <div class="sidebar-inner">
        <div v-if="settings.address" class="sidebar-address-card">
          <div class="address-info">
            <div class="address-dot"></div>
            <n-ellipsis class="address-text">{{ settings.address }}</n-ellipsis>
          </div>
          <div class="address-actions">
            <n-button text size="tiny" @click="copyAddress">
              <template #icon><n-icon :component="ContentCopyFilled" :size="14" /></template>
            </n-button>
            <n-button text size="tiny" @click="showAddressManage = true">
              <template #icon><n-icon :component="ExchangeAlt" :size="14" /></template>
            </n-button>
          </div>
        </div>
        <div class="sidebar-nav">
          <div v-for="item in navItems" :key="item.key"
            class="nav-item" :class="{ active: activeKey === item.key }"
            @click="navigate(item.path)">
            <n-icon :component="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </div>
        </div>
        <div class="sidebar-bottom">
          <n-button text @click="toggleDark(); showDrawer = false">
            <template #icon>
              <n-icon :component="isDark ? LightModeFilled : DarkModeFilled" />
            </template>
          </n-button>
          <n-button text @click="changeLocale(); showDrawer = false">
            <template #icon><n-icon :component="Language" /></template>
          </n-button>
          <n-button v-if="openSettings.showGithub" text tag="a" target="_blank"
            href="https://github.com/dreamhunter2333/cloudflare_temp_email">
            <template #icon><n-icon :component="GithubAlt" /></template>
          </n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>

  <!-- Desktop sidebar -->
  <aside v-else class="sidebar" :class="{ collapsed: sidebarCollapsed }">
    <div class="sidebar-inner">
      <div class="sidebar-logo" @click="logoClick">
        <n-avatar src="/logo.png" :size="32" round />
        <span v-if="!sidebarCollapsed" class="logo-text">
          {{ openSettings.title || 'Temp Email' }}
        </span>
      </div>

      <div v-if="!sidebarCollapsed && settings.address" class="sidebar-address-card">
        <div class="address-info">
          <div class="address-dot"></div>
          <n-ellipsis class="address-text">{{ settings.address }}</n-ellipsis>
        </div>
        <div class="address-actions">
          <n-button text size="tiny" @click="copyAddress">
            <template #icon><n-icon :component="ContentCopyFilled" :size="14" /></template>
          </n-button>
          <n-button text size="tiny" @click="showAddressManage = true">
            <template #icon><n-icon :component="ExchangeAlt" :size="14" /></template>
          </n-button>
        </div>
      </div>

      <div class="sidebar-nav">
        <div v-for="item in navItems" :key="item.key"
          class="nav-item" :class="{ active: activeKey === item.key }"
          @click="navigate(item.path)">
          <n-icon :component="item.icon" :size="20" />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </div>
      </div>

      <div class="sidebar-bottom">
        <n-button text @click="toggleDark()">
          <template #icon>
            <n-icon :component="isDark ? LightModeFilled : DarkModeFilled" />
          </template>
        </n-button>
        <n-button text @click="changeLocale()">
          <template #icon><n-icon :component="Language" /></template>
        </n-button>
        <n-button v-if="openSettings.showGithub" text tag="a" target="_blank"
          href="https://github.com/dreamhunter2333/cloudflare_temp_email">
          <template #icon><n-icon :component="GithubAlt" /></template>
        </n-button>
        <n-text v-if="!sidebarCollapsed && version" depth="3" style="font-size: 11px;">{{ version }}</n-text>
      </div>
    </div>
  </aside>

  <n-modal v-model:show="showAddressManage" preset="card" :title="t('manage')">
    <TelegramAddress v-if="isTelegram" />
    <AddressManagement v-else-if="userJwt" />
    <LocalAddress v-else />
  </n-modal>
</template>

<style scoped>
.sidebar {
  width: var(--ds-sidebar-width);
  min-height: 100vh;
  border-right: 1px solid var(--ds-border);
  background: var(--ds-surface);
  transition: width var(--ds-transition);
  flex-shrink: 0;
}
.sidebar.collapsed { width: var(--ds-sidebar-collapsed-width); }

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px 12px;
  position: sticky;
  top: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}
.logo-text {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-address-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  margin-bottom: 16px;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-bg);
  font-size: 12px;
  color: var(--ds-text-secondary);
  overflow: hidden;
}
.address-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.address-actions {
  display: flex;
  gap: 4px;
  margin-left: 16px;
}
.address-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  flex-shrink: 0;
}
.address-text {
  flex: 1;
  min-width: 0;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
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
.nav-item:hover { background: var(--ds-bg); color: var(--ds-text); }
.nav-item.active {
  background: color-mix(in srgb, var(--ds-primary) 10%, transparent);
  color: var(--ds-primary);
  font-weight: 600;
}

.sidebar-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--ds-border);
  flex-wrap: wrap;
}

.mobile-menu-btn {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 100;
}
</style>
