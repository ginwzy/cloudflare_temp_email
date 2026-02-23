<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DatabaseManager from './DatabaseManager.vue'
import WorkerConfig from './WorkerConfig.vue'
import Maintenance from './Maintenance.vue'

const { t } = useI18n({
  messages: {
    en: { maintenance: 'Maintenance', database: 'Database', worker: 'Worker Config', cleanup: 'Cleanup' },
    zh: { maintenance: '系统维护', database: '数据库', worker: 'Worker 配置', cleanup: '清理' }
  }
})

const tab = ref('database')
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('maintenance') }}</h2>
    <n-tabs v-model:value="tab" type="segment" animated>
      <n-tab-pane name="database" :tab="t('database')">
        <DatabaseManager />
      </n-tab-pane>
      <n-tab-pane name="worker" :tab="t('worker')">
        <WorkerConfig />
      </n-tab-pane>
      <n-tab-pane name="cleanup" :tab="t('cleanup')">
        <Maintenance />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
