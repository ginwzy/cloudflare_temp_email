<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import {
  DashboardRound, PeopleRound, EmailRound,
  SecurityRound, ExtensionRound, BuildRound,
  PaletteRound, InfoRound, AccountCircleRound,
  ArrowBackRound, DarkModeFilled, LightModeFilled
} from '@vicons/material'
import { Language } from '@vicons/fa'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { api } from '../api'
import { getRouterPathWithLang } from '../utils'

const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()
const message = useMessage()

const {
  isDark, toggleDark, openSettings, loading,
  adminAuth, showAdminAuth, showAdminPage, userSettings
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      admin: 'Admin Panel', backToApp: 'Back to App',
      dashboard: 'Dashboard', accounts: 'Accounts',
      users: 'Users', emails: 'Emails',
      security: 'Security', integrations: 'Integrations',
      maintenance: 'Maintenance', appearance: 'Appearance',
      about: 'About', accessHeader: 'Admin Password',
      accessTip: 'Please enter the admin password', ok: 'OK',
    },
    zh: {
      admin: '管理面板', backToApp: '返回应用',
      dashboard: '仪表盘', accounts: '账号管理',
      users: '用户管理', emails: '邮件管理',
      security: '安全设置', integrations: '集成',
      maintenance: '系统维护', appearance: '外观',
      about: '关于', accessHeader: 'Admin 密码',
      accessTip: '请输入 Admin 密码', ok: '确定',
    }
  }
})

useHead({ title: () => `${t('admin')} - ${openSettings.value.title || 'Temp Email'}` })

const showDrawer = ref(false)
const tmpAdminAuth = ref('')
const showAdminPasswordModal = computed(() => !showAdminPage.value || showAdminAuth.value)

const authFunc = async () => {
  try {
    adminAuth.value = tmpAdminAuth.value
    location.reload()
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const navItems = [
  { key: 'dashboard', label: () => t('dashboard'), icon: DashboardRound, path: '/admin/dashboard' },
  { key: 'accounts', label: () => t('accounts'), icon: AccountCircleRound, path: '/admin/accounts' },
  { key: 'users', label: () => t('users'), icon: PeopleRound, path: '/admin/users' },
  { key: 'emails', label: () => t('emails'), icon: EmailRound, path: '/admin/emails' },
  { key: 'security', label: () => t('security'), icon: SecurityRound, path: '/admin/security' },
  { key: 'integrations', label: () => t('integrations'), icon: ExtensionRound, path: '/admin/integrations' },
  { key: 'maintenance', label: () => t('maintenance'), icon: BuildRound, path: '/admin/maintenance' },
  { key: 'appearance', label: () => t('appearance'), icon: PaletteRound, path: '/admin/appearance' },
  { key: 'about', label: () => t('about'), icon: InfoRound, path: '/admin/about' },
]

const activeKey = computed(() => {
  const path = route.path
  for (const item of navItems) {
    if (path.includes(item.key)) return item.key
  }
  return 'dashboard'
})

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

onMounted(async () => {
  if (!userSettings.value.user_id) await api.getUserSettings(message)
})
</script>

<template>
  <div v-if="userSettings.fetched">
    <n-modal v-model:show="showAdminPasswordModal" :closable="false" :closeOnEsc="false"
      :maskClosable="false" preset="dialog" :title="t('accessHeader')">
      <p>{{ t('accessTip') }}</p>
      <n-input v-model:value="tmpAdminAuth" type="password" show-password-on="click" />
      <template #action>
        <n-button @click="authFunc" type="primary" :loading="loading">{{ t('ok') }}</n-button>
      </template>
    </n-modal>

    <div v-if="showAdminPage" class="admin-layout">
      <!-- Mobile header -->
      <div v-if="isMobile" class="admin-mobile-header">
        <n-button text @click="showDrawer = true">
          <template #icon><n-icon size="22"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></n-icon></template>
        </n-button>
        <span class="admin-mobile-title">{{ t('admin') }}</span>
        <n-button text @click="navigate('/')">
          <template #icon><n-icon :component="ArrowBackRound" /></template>
        </n-button>
      </div>

      <!-- Mobile drawer -->
      <n-drawer v-if="isMobile" v-model:show="showDrawer" placement="left" :width="260">
        <n-drawer-content :title="t('admin')" closable>
          <div class="admin-sidebar-inner">
            <div class="admin-nav">
              <div v-for="item in navItems" :key="item.key"
                class="admin-nav-item" :class="{ active: activeKey === item.key }"
                @click="navigate(item.path)">
                <n-icon :component="item.icon" :size="20" />
                <span>{{ item.label() }}</span>
              </div>
            </div>
          </div>
        </n-drawer-content>
      </n-drawer>

      <!-- Desktop sidebar -->
      <aside v-if="!isMobile" class="admin-sidebar">
        <div class="admin-sidebar-inner">
          <div class="admin-back" @click="navigate('/')">
            <n-icon :component="ArrowBackRound" :size="18" />
            <span>{{ t('backToApp') }}</span>
          </div>
          <div class="admin-sidebar-title">{{ t('admin') }}</div>
          <div class="admin-nav">
            <div v-for="item in navItems" :key="item.key"
              class="admin-nav-item" :class="{ active: activeKey === item.key }"
              @click="navigate(item.path)">
              <n-icon :component="item.icon" :size="20" />
              <span>{{ item.label() }}</span>
            </div>
          </div>
          <div class="admin-sidebar-bottom">
            <n-button text @click="toggleDark()">
              <template #icon>
                <n-icon :component="isDark ? LightModeFilled : DarkModeFilled" />
              </template>
            </n-button>
            <n-button text @click="changeLocale()">
              <template #icon><n-icon :component="Language" /></template>
            </n-button>
          </div>
        </div>
      </aside>

      <div class="admin-content">
        <div class="admin-content-inner">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}
.admin-sidebar {
  width: var(--ds-sidebar-width);
  min-height: 100vh;
  border-right: 1px solid var(--ds-border);
  background: var(--ds-surface);
  flex-shrink: 0;
}
.admin-sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px 12px;
  position: sticky;
  top: 0;
}
.admin-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  color: var(--ds-text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all var(--ds-transition);
}
.admin-back:hover { background: var(--ds-bg); color: var(--ds-text); }
.admin-sidebar-title {
  font-weight: 700;
  font-size: 18px;
  padding: 8px 12px 16px;
  color: var(--ds-text);
}
.admin-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.admin-nav-item {
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
.admin-nav-item:hover { background: var(--ds-bg); color: var(--ds-text); }
.admin-nav-item.active {
  background: color-mix(in srgb, var(--ds-primary) 10%, transparent);
  color: var(--ds-primary);
  font-weight: 600;
}
.admin-sidebar-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--ds-border);
}
.admin-content {
  flex: 1;
  min-height: 100vh;
  background: var(--ds-bg);
  overflow-x: hidden;
}
.admin-content-inner {
  padding: 24px;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}
.admin-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--ds-surface);
  border-bottom: 1px solid var(--ds-border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.admin-mobile-title {
  font-weight: 600;
  font-size: 16px;
}
@media (max-width: 768px) {
  .admin-content-inner { padding: 16px; }
}
</style>
