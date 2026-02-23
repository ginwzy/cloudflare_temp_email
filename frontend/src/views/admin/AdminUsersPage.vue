<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserManagement from './UserManagement.vue'
import UserSettings from './UserSettings.vue'
import UserOauth2Settings from './UserOauth2Settings.vue'
import RoleAddressConfig from './RoleAddressConfig.vue'

const { t } = useI18n({
  messages: {
    en: { users: 'Users', management: 'Management', settings: 'Settings', oauth2: 'OAuth2', roles: 'Roles' },
    zh: { users: '用户管理', management: '管理', settings: '设置', oauth2: 'OAuth2', roles: '角色' }
  }
})

const tab = ref('management')
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('users') }}</h2>
    <n-tabs v-model:value="tab" type="segment" animated>
      <n-tab-pane name="management" :tab="t('management')">
        <UserManagement />
      </n-tab-pane>
      <n-tab-pane name="settings" :tab="t('settings')">
        <UserSettings />
      </n-tab-pane>
      <n-tab-pane name="oauth2" :tab="t('oauth2')">
        <UserOauth2Settings />
      </n-tab-pane>
      <n-tab-pane name="roles" :tab="t('roles')">
        <RoleAddressConfig />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
