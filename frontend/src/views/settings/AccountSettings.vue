<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import IndexAccountSettings from '../index/AccountSettings.vue'
import UserSettingsPage from '../user/UserSettings.vue'

const { userSettings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: { account: 'Account', emailSettings: 'Email Settings', userAccount: 'User Account' },
    zh: { account: '账户', emailSettings: '邮箱设置', userAccount: '用户账户' }
  }
})
</script>

<template>
  <div class="account-settings">
    <h3 class="section-title">{{ t('account') }}</h3>
    <n-card size="small">
      <IndexAccountSettings />
    </n-card>
    <n-card v-if="userSettings.user_email" size="small" style="margin-top: 16px;">
      <UserSettingsPage />
    </n-card>
  </div>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
</style>
