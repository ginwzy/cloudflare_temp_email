<script setup>
import { useI18n } from 'vue-i18n'
import Login from '../common/Login.vue'

const { t } = useI18n({
  messages: {
    en: { newAddress: 'Create or Bind Address' },
    zh: { newAddress: '创建或绑定地址' }
  }
})
</script>

<template>
  <div class="new-address-page">
    <h2 class="page-title">{{ t('newAddress') }}</h2>
    <n-card :bordered="false" embedded style="max-width: 600px;">
      <Login />
    </n-card>
  </div>
</template>

<style scoped>
.new-address-page {
  max-width: 600px;
}
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}
</style>
