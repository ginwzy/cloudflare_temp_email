<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Account from './Account.vue'
import CreateAccount from './CreateAccount.vue'
import AccountSettings from './AccountSettings.vue'

const { t } = useI18n({
  messages: {
    en: { accounts: 'Accounts', list: 'List', create: 'Create', settings: 'Settings' },
    zh: { accounts: '账号管理', list: '列表', create: '创建', settings: '设置' }
  }
})

const tab = ref('list')
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('accounts') }}</h2>
    <n-tabs v-model:value="tab" type="segment" animated>
      <n-tab-pane name="list" :tab="t('list')">
        <Account />
      </n-tab-pane>
      <n-tab-pane name="create" :tab="t('create')">
        <CreateAccount />
      </n-tab-pane>
      <n-tab-pane name="settings" :tab="t('settings')">
        <AccountSettings />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
