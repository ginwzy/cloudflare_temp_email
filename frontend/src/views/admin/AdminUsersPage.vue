<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import RoleAddressConfig from './RoleAddressConfig.vue'
import UserManagement from './UserManagement.vue'
import UserOauth2Settings from './UserOauth2Settings.vue'
import UserSettings from './UserSettings.vue'

const { t } = useI18n({
  messages: {
    en: {
      users: 'Users',
      management: 'Management',
      settings: 'Settings',
      oauth2: 'OAuth2',
      roles: 'Roles',
      description: 'Manage users, login settings, OAuth behavior, and role address limits.'
    },
    zh: {
      users: '用户管理',
      management: '管理',
      settings: '设置',
      oauth2: 'OAuth2',
      roles: '角色',
      description: '统一管理用户、登录设置、OAuth 行为和角色地址限制。'
    }
  }
})

const tab = ref('management')
</script>

<template>
  <section class="users-page">
    <header class="users-header">
      <div>
        <h2 class="page-title">{{ t('users') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
      <n-space>
        <n-button :type="tab === 'management' ? 'primary' : 'default'" :secondary="tab === 'management'" @click="tab = 'management'">
          {{ t('management') }}
        </n-button>
        <n-button :type="tab === 'settings' ? 'primary' : 'default'" :secondary="tab === 'settings'" @click="tab = 'settings'">
          {{ t('settings') }}
        </n-button>
        <n-button :type="tab === 'oauth2' ? 'primary' : 'default'" :secondary="tab === 'oauth2'" @click="tab = 'oauth2'">
          {{ t('oauth2') }}
        </n-button>
        <n-button :type="tab === 'roles' ? 'primary' : 'default'" :secondary="tab === 'roles'" @click="tab = 'roles'">
          {{ t('roles') }}
        </n-button>
      </n-space>
    </header>

    <main class="users-content">
      <UserManagement v-if="tab === 'management'" />
      <UserSettings v-else-if="tab === 'settings'" />
      <UserOauth2Settings v-else-if="tab === 'oauth2'" />
      <RoleAddressConfig v-else />
    </main>
  </section>
</template>

<style scoped>
.users-page {
  display: grid;
  gap: 12px;
}

.users-header {
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

.users-content {
  min-width: 0;
}
</style>
