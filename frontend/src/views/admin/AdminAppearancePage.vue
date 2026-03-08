<script setup>
import { useI18n } from 'vue-i18n'
import Appearance from '../common/Appearance.vue'

const { t } = useI18n({
  messages: {
    en: {
      appearance: 'Appearance',
      description: 'Adjust theme, branding, and display preferences for the admin panel.'
    },
    zh: {
      appearance: '外观',
      description: '调整管理面板主题、品牌信息和显示偏好。'
    }
  }
})
</script>

<template>
  <section class="appearance-page">
    <header class="appearance-header">
      <div>
        <h2 class="page-title">{{ t('appearance') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
    </header>

    <main class="appearance-content">
      <Appearance />
    </main>
  </section>
</template>

<style scoped>
.appearance-page {
  display: grid;
  gap: 12px;
}

.appearance-header {
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

.appearance-content {
  min-width: 0;
}
</style>
