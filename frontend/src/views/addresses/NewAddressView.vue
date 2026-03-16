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
  <div class="ds-page-shell new-address-page">
    <header class="ds-page-header ds-page-header--compact">
      <div class="ds-page-copy">
        <span class="ds-page-kicker">{{ t('newAddress') }}</span>
        <h1 class="ds-page-title ds-page-title--sm">{{ t('newAddress') }}</h1>
      </div>
    </header>
    <div class="ds-panel login-panel">
      <div class="ds-panel-body">
        <Login />
      </div>
    </div>
  </div>
</template>

<style scoped>
.new-address-page {
  width: min(780px, 100%);
}

.login-panel {
  width: 100%;
}
</style>
