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
  <div class="about-settings">
    <h3 class="section-title">{{ t('about') }}</h3>
    <About />
  </div>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
</style>
