<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DatabaseManager from './DatabaseManager.vue'
import Maintenance from './Maintenance.vue'
import WorkerConfig from './WorkerConfig.vue'

const { t } = useI18n({
  messages: {
    en: {
      maintenance: 'Maintenance',
      database: 'Database',
      worker: 'Worker Config',
      cleanup: 'Cleanup',
      description: 'Maintain database tools, worker runtime settings, and cleanup jobs.'
    },
    zh: {
      maintenance: '系统维护',
      database: '数据库',
      worker: 'Worker 配置',
      cleanup: '清理',
      description: '统一维护数据库工具、Worker 运行参数与清理任务。'
    }
  }
})

const tab = ref('database')
</script>

<template>
  <section class="maintenance-page">
    <header class="maintenance-header">
      <div>
        <h2 class="page-title">{{ t('maintenance') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
      <n-space>
        <n-button :type="tab === 'database' ? 'primary' : 'default'" :secondary="tab === 'database'" @click="tab = 'database'">
          {{ t('database') }}
        </n-button>
        <n-button :type="tab === 'worker' ? 'primary' : 'default'" :secondary="tab === 'worker'" @click="tab = 'worker'">
          {{ t('worker') }}
        </n-button>
        <n-button :type="tab === 'cleanup' ? 'primary' : 'default'" :secondary="tab === 'cleanup'" @click="tab = 'cleanup'">
          {{ t('cleanup') }}
        </n-button>
      </n-space>
    </header>

    <main class="maintenance-content">
      <DatabaseManager v-if="tab === 'database'" />
      <WorkerConfig v-else-if="tab === 'worker'" />
      <Maintenance v-else />
    </main>
  </section>
</template>

<style scoped>
.maintenance-page {
  display: grid;
  gap: 12px;
}

.maintenance-header {
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

.maintenance-content {
  min-width: 0;
}
</style>
