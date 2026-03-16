<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import IndexAccountSettings from '../index/AccountSettings.vue'
import UserSettingsPage from '../user/UserSettings.vue'
import Appearance from '../common/Appearance.vue'

const { userSettings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: { account: 'Account', emailSettings: 'Email Settings', userAccount: 'User Account', appearance: 'Appearance' },
    zh: { account: '账户', emailSettings: '邮箱设置', userAccount: '用户账户', appearance: '外观' }
  }
})
</script>

<template>
  <div class="ds-settings-stack account-settings">
    <section class="ds-settings-section">
      <div>
        <h3 class="section-title">{{ t('account') }}</h3>
      </div>
      <div class="ds-panel">
        <div class="ds-panel-body">
          <IndexAccountSettings />
        </div>
      </div>
    </section>

    <section v-if="userSettings.user_email" class="ds-settings-section">
      <div>
        <h3 class="section-title">{{ t('userAccount') }}</h3>
      </div>
      <div class="ds-panel">
        <div class="ds-panel-body">
          <UserSettingsPage />
        </div>
      </div>
    </section>

    <section class="ds-settings-section">
      <div>
        <h3 class="section-title">{{ t('appearance') }}</h3>
      </div>
      <div class="ds-panel">
        <div class="ds-panel-body">
          <Appearance :showUseSimpleIndex="true" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
