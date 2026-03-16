<script setup>
import { onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { api } from '../api'
import { useIsMobile } from '../utils/composables'
import AppSidebar from '../components/AppSidebar.vue'
import BottomTabBar from '../components/BottomTabBar.vue'
import Footer from '../views/Footer.vue'
import AddressBar from '../views/index/AddressBar.vue'

const message = useMessage()
const notification = useNotification()
const isMobile = useIsMobile()
const { openSettings, userSettings, settings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: { title: 'Cloudflare Temp Email' },
    zh: { title: 'Cloudflare 临时邮件' }
  }
})

useHead({
  title: () => openSettings.value.title || t('title'),
  meta: [{ name: 'description', content: () => openSettings.value.description || t('title') }]
})

onMounted(async () => {
  await api.getOpenSettings(message, notification)
  if (!userSettings.value.user_id) await api.getUserSettings(message)
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar v-if="!isMobile" />
    <div class="app-content">
      <div class="content-shell">
        <div class="content-inner">
          <AddressBar v-if="!settings.address" class="layout-address-bar" />
          <div class="route-stage">
            <router-view />
          </div>
        </div>
        <Footer class="app-footer" />
      </div>
    </div>
    <BottomTabBar v-if="isMobile" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  isolation: isolate;
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

.content-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 24px 10px;
}

.content-inner {
  flex: 1;
  width: 100%;
  max-width: var(--ds-content-max-width);
  margin: 0 auto;
  display: grid;
  gap: 16px;
}

.route-stage {
  min-height: calc(100vh - 120px);
}

.app-footer {
  width: 100%;
  max-width: var(--ds-content-max-width);
  margin: 14px auto 0;
  opacity: 0.88;
}

@media (max-width: 768px) {
  .app-layout {
    display: block;
  }

  .content-shell {
    padding: 12px 12px calc(12px + var(--ds-bottom-bar-height) + var(--ds-safe-bottom));
  }

  .content-inner {
    gap: 12px;
  }

  .route-stage {
    min-height: auto;
  }

  .app-footer {
    margin-top: 12px;
  }
}
</style>
