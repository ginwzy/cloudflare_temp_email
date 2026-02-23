<script setup>
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import { api } from '../../api'
import UserLogin from '../user/UserLogin.vue'
import Login from '../common/Login.vue'

const message = useMessage()
const { openSettings, userOpenSettings, userSettings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: {
      accountLogin: 'Account Login',
      tryWithout: 'Or use without account',
      addressLogin: 'Use email address directly',
    },
    zh: {
      accountLogin: '账户登录',
      tryWithout: '或不使用账户',
      addressLogin: '直接使用邮箱地址',
    }
  }
})

const showAnonymous = computed(() => {
  return openSettings.value.enableUserCreateEmail || openSettings.value.enableAddressPassword
})

onMounted(async () => {
  await api.getUserOpenSettings(message)
})
</script>

<template>
  <div class="auth-login">
    <UserLogin />
    <template v-if="showAnonymous">
      <n-divider>{{ t('tryWithout') }}</n-divider>
      <Login />
    </template>
  </div>
</template>

<style scoped>
.auth-login {
  text-align: left;
}
</style>
