<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  InboxRound, SendRound, EditRound,
  SettingsRound, AlternateEmailRound,
  DarkModeFilled, LightModeFilled,
  AdminPanelSettingsRound, MoreHorizFilled, PersonRound
} from '@vicons/material'
import { GithubAlt, Language } from '@vicons/fa'
import { useGlobalState } from '../store'
import { getRouterPathWithLang } from '../utils'
import TelegramAddress from '../views/index/TelegramAddress.vue'
import AddressManagement from '../views/user/AddressManagement.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const {
  isDark, toggleDark, openSettings, showAdminPage,
  settings, userJwt, isTelegram, loading
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      inbox: 'Inbox', sent: 'Sent', compose: 'Compose',
      addresses: 'Addresses', more: 'More', settings: 'Settings',
      admin: 'Admin', manage: 'Manage',
    },
    zh: {
      inbox: '收件箱', sent: '发件箱', compose: '写邮件',
      addresses: '地址', more: '更多', settings: '设置',
      admin: '管理', manage: '管理',
    }
  }
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
  return items.filter(i => i.show)
})

const navigate = async (path) => {
  await router.push(getRouterPathWithLang(path, locale.value))
}

const handleTab = (tab) => {
  if (tab.action === 'more') {
    showMore.value = true
  } else {
    navigate(tab.path)
  }
}

const changeLocale = async () => {
  if (locale.value === 'zh') {
    await router.push(`/en${route.fullPath}`)
  } else {
    await router.push(route.fullPath.replace('/en', ''))
  }
  showMore.value = false
}
</script>

<template>
  <div class="bottom-tab-bar">
    <div v-for="tab in tabs" :key="tab.key" class="tab-item"
      :class="{ active: activeKey === tab.key, cta: tab.isCta }"
      @click="handleTab(tab)">
      <n-icon :component="tab.icon" :size="22" />
      <span class="tab-label">{{ tab.label }}</span>
    </div>
  </div>

  <n-drawer v-model:show="showMore" placement="bottom" :height="320" :closable="true">
    <n-drawer-content :title="t('more')">
      <div class="more-menu">
        <div v-if="userJwt" class="more-item" @click="navigate('/settings/account'); showMore = false">
          <n-icon :component="SettingsRound" :size="20" />
          <span>{{ t('settings') }}</span>
        </div>
        <div v-if="settings.address" class="more-item" @click="showAddressManage = true; showMore = false">
          <n-icon :component="AlternateEmailRound" :size="20" />
          <span>{{ t('manage') }}</span>
        </div>
        <div v-if="showAdminPage" class="more-item" @click="navigate('/admin/dashboard'); showMore = false">
          <n-icon :component="AdminPanelSettingsRound" :size="20" />
          <span>{{ t('admin') }}</span>
        </div>
        <div class="more-item" @click="toggleDark(); showMore = false">
          <n-icon :component="isDark ? LightModeFilled : DarkModeFilled" :size="20" />
          <span>{{ isDark ? 'Light' : 'Dark' }}</span>
        </div>
        <div class="more-item" @click="changeLocale()">
          <n-icon :component="Language" :size="20" />
          <span>{{ locale === 'zh' ? 'English' : '中文' }}</span>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>

  <n-modal v-model:show="showAddressManage" preset="card" :title="t('manage')">
    <TelegramAddress v-if="isTelegram" />
    <AddressManagement v-else-if="userJwt" />
  </n-modal>
</template>

<style scoped>
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--ds-bottom-bar-height);
  background: var(--ds-surface);
  border-top: 1px solid var(--ds-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  cursor: pointer;
  color: var(--ds-text-secondary);
  transition: color var(--ds-transition);
  min-width: 0;
  flex: 1;
}
.tab-item.active { color: var(--ds-primary); }
.tab-item.cta {
  color: var(--ds-cta);
}
.tab-label {
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}
.more-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.more-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  color: var(--ds-text);
  font-size: 15px;
  font-weight: 500;
  transition: background var(--ds-transition);
}
.more-item:hover { background: var(--ds-bg); }
</style>
