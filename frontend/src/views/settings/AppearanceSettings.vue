<script setup>
import { useI18n } from 'vue-i18n'
import Appearance from '../common/Appearance.vue'

const { t } = useI18n({
  messages: {
    en: { appearance: 'Appearance' },
    zh: { appearance: '外观' }
  }
})
</script>

<template>
  <div class="appearance-settings">
    <h3 class="section-title">{{ t('appearance') }}</h3>
    <Appearance :showUseSimpleIndex="true" />
  </div>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
</style>
