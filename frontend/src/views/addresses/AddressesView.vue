<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import AddressManagement from '../user/AddressManagement.vue'
import TelegramAddress from '../index/TelegramAddress.vue'
import LocalAddress from '../index/LocalAddress.vue'
import Login from '../common/Login.vue'

const { userJwt, isTelegram, userSettings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: { addresses: 'Addresses', loginRequired: 'Please log in to manage addresses' },
    zh: { addresses: '地址管理', loginRequired: '请登录以管理地址' }
  }
})
</script>

<template>
  <div class="addresses-page">
    <h2 class="page-title">{{ t('addresses') }}</h2>
    <div v-if="isTelegram">
      <TelegramAddress />
    </div>
    <div v-else-if="userJwt && userSettings.user_email">
      <AddressManagement />
    </div>
    <div v-else class="login-prompt">
      <n-card :bordered="false" embedded style="max-width: 600px; margin: 0 auto;">
        <n-text depth="3">{{ t('loginRequired') }}</n-text>
        <LocalAddress />
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.addresses-page {
  max-width: 900px;
  margin: 0 auto;
}
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}
.login-prompt {
  text-align: center;
  padding: 20px 0;
}
</style>
