<script setup>
import { ref, computed } from 'vue'
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
      about: 'About', loginMethod: 'Login Method',
      loginViaPassword: 'Admin Password Login',
      loginViaUserAdmin: 'User Admin Permission',
      loginViaDisabledCheck: 'Disabled Password Check',
      logout: 'Logout', logoutConfirmTitle: 'Confirm Logout',
      logoutConfirmContent: 'Are you sure you want to logout from admin panel?',
      confirm: 'Confirm', logoutSuccess: 'Logout successful',
    },
    zh: {
      about: '关于', loginMethod: '登录方式',
      loginViaPassword: 'Admin 密码登录',
      loginViaUserAdmin: '用户管理员权限',
      loginViaDisabledCheck: '已禁用密码检查',
      logout: '退出登录', logoutConfirmTitle: '确认退出',
      logoutConfirmContent: '确定要退出管理员面板吗？',
      confirm: '确认', logoutSuccess: '退出成功',
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
  <div>
    <h2 class="page-title">{{ t('about') }}</h2>
    <div style="display: flex; justify-content: center; margin-bottom: 20px;">
      <n-card style="max-width: 600px; width: 100%;">
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
    <n-modal v-model:show="showLogoutModal" preset="dialog" :title="t('logoutConfirmTitle')">
      <p>{{ t('logoutConfirmContent') }}</p>
      <template #action>
        <n-button :loading="loading" @click="handleLogout" size="small" tertiary type="warning">
          {{ t('confirm') }}
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
