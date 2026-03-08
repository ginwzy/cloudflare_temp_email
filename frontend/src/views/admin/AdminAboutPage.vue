<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGlobalState } from '../../store'
import { getRouterPathWithLang } from '../../utils'
import About from '../common/About.vue'

const router = useRouter()
const message = useMessage()
const {
  adminAuth, showAdminAuth, adminTab, loading,
  userSettings, openSettings
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      about: 'About',
      loginMethod: 'Login Method',
      loginViaPassword: 'Admin Password Login',
      loginViaUserAdmin: 'User Admin Permission',
      loginViaDisabledCheck: 'Disabled Password Check',
      logout: 'Logout',
      logoutConfirmTitle: 'Confirm Logout',
      logoutConfirmContent: 'Are you sure you want to logout from admin panel?',
      confirm: 'Confirm',
      logoutSuccess: 'Logout successful',
      description: 'View project info and manage current admin login session.'
    },
    zh: {
      about: '关于',
      loginMethod: '登录方式',
      loginViaPassword: 'Admin 密码登录',
      loginViaUserAdmin: '用户管理员权限',
      loginViaDisabledCheck: '已禁用密码检查',
      logout: '退出登录',
      logoutConfirmTitle: '确认退出',
      logoutConfirmContent: '确定要退出管理员面板吗？',
      confirm: '确认',
      logoutSuccess: '退出成功',
      description: '查看项目信息并管理当前管理员登录会话。'
    }
  }
})

const showLogoutModal = ref(false)
const isAdminPasswordLogin = computed(() => !!adminAuth.value)

const currentLoginMethod = computed(() => {
  if (adminAuth.value) return t('loginViaPassword')
  if (userSettings.value.is_admin) return t('loginViaUserAdmin')
  if (openSettings.value.disableAdminPasswordCheck) return t('loginViaDisabledCheck')
  return ''
})

const handleLogout = async () => {
  adminAuth.value = ''
  showAdminAuth.value = false
  adminTab.value = 'account'
  message.success(t('logoutSuccess'))
  await router.push(getRouterPathWithLang('/', locale.value))
}
</script>

<template>
  <section class="about-page">
    <header class="about-header">
      <div>
        <h2 class="page-title">{{ t('about') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
    </header>

    <main class="about-content">
      <div class="login-card-wrap">
        <n-card class="login-card">
          <n-space vertical>
            <n-text strong>{{ t('loginMethod') }}</n-text>
            <n-text>{{ currentLoginMethod }}</n-text>
            <n-divider v-if="isAdminPasswordLogin" />
            <n-button v-if="isAdminPasswordLogin" type="warning" @click="showLogoutModal = true" block>
              {{ t('logout') }}
            </n-button>
          </n-space>
        </n-card>
      </div>

      <About />
    </main>

    <n-modal v-model:show="showLogoutModal" preset="dialog" :title="t('logoutConfirmTitle')">
      <p>{{ t('logoutConfirmContent') }}</p>
      <template #action>
        <n-button :loading="loading" @click="handleLogout" size="small" tertiary type="warning">
          {{ t('confirm') }}
        </n-button>
      </template>
    </n-modal>
  </section>
</template>

<style scoped>
.about-page {
  display: grid;
  gap: 12px;
}

.about-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--ds-text);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ds-text-secondary);
}

.about-content {
  min-width: 0;
}

.login-card-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.login-card {
  max-width: 600px;
  width: 100%;
}
</style>
