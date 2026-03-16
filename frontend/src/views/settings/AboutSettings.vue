<script setup>
import { useI18n } from 'vue-i18n'
import About from '../common/About.vue'

const { t } = useI18n({
  messages: {
    en: { about: 'About' },
    zh: { about: '关于' }
  }
})
</script>

<template>
  <div class="ds-settings-section about-settings">
    <div>
      <h3 class="section-title">{{ t('about') }}</h3>
    </div>
    <div class="ds-panel">
      <div class="ds-panel-body">
        <About />
      </div>
    </div>
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
