<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Account from './Account.vue'
import AccountSettings from './AccountSettings.vue'
import CreateAccount from './CreateAccount.vue'

const tab = ref('list')

const { t } = useI18n({
  messages: {
    en: {
      accounts: 'Accounts',
      list: 'List',
      create: 'Create',
      settings: 'Settings',
      description: 'Manage account list, creation flow, and account-level policies in one place.'
    },
    zh: {
      accounts: '账号管理',
      list: '列表',
      create: '创建',
      settings: '设置',
      description: '在同一页面统一管理账号列表、创建流程与账号策略。'
    }
  }
})
</script>

<template>
  <section class="accounts-page">
    <header class="accounts-header">
      <div>
        <h2 class="page-title">{{ t('accounts') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
      <n-space>
        <n-button
          :type="tab === 'list' ? 'primary' : 'default'"
          :secondary="tab === 'list'"
          @click="tab = 'list'"
        >
          {{ t('list') }}
        </n-button>
        <n-button
          :type="tab === 'create' ? 'primary' : 'default'"
          :secondary="tab === 'create'"
          @click="tab = 'create'"
        >
          {{ t('create') }}
        </n-button>
        <n-button
          :type="tab === 'settings' ? 'primary' : 'default'"
          :secondary="tab === 'settings'"
          @click="tab = 'settings'"
        >
          {{ t('settings') }}
        </n-button>
      </n-space>
    </header>

    <n-card embedded :bordered="false" class="accounts-content-shell">
      <n-tabs v-model:value="tab" type="line" animated>
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
    </n-card>
  </section>
</template>

<style scoped>
.accounts-page {
  display: grid;
  gap: 12px;
}

.accounts-header {
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

.accounts-content-shell {
  border-radius: var(--ds-radius);
  border: 1px solid color-mix(in srgb, var(--ds-border) 80%, transparent);
}
</style>
