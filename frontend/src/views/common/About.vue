<script setup>
import { computed } from 'vue'
import { GithubAlt, Discord, Telegram } from '@vicons/fa'
import { useGlobalState } from '../../store'
import { sanitizeRichTextHtml } from '../../utils/safe-html'

const { announcement } = useGlobalState()
const safeAnnouncement = computed(() => sanitizeRichTextHtml(announcement.value || ''))
</script>

<template>
  <div class="about-shell">
    <div class="announcement" v-html="safeAnnouncement"></div>
    <div class="link-row">
      <n-button tag="a" target="_blank" href="https://github.com/dreamhunter2333/cloudflare_temp_email">
        <template #icon>
          <n-icon :component="GithubAlt" />
        </template>
        Github
      </n-button>
      <n-button tag="a" target="_blank" href="https://discord.gg/dQEwTWhA6Q">
        <template #icon>
          <n-icon :component="Discord" />
        </template>
        Discord
      </n-button>
      <n-button tag="a" target="_blank" href="https://t.me/cloudflare_temp_email">
        <template #icon>
          <n-icon :component="Telegram" />
        </template>
        Telegram
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.about-shell {
  display: grid;
  gap: 16px;
}

.announcement {
  color: var(--ds-text);
}

.link-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
