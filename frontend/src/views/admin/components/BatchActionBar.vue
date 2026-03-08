<script setup>
const props = defineProps({
  labels: {
    type: Object,
    required: true
  },
  selectedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'select-all',
  'unselect-all',
  'batch-delete',
  'batch-clear-inbox',
  'batch-clear-sent',
  'batch-tag-add',
  'batch-tag-remove',
  'batch-tag-set'
])
</script>

<template>
  <div class="batch-bar-shell">
    <n-card embedded :bordered="false" class="batch-bar-card">
      <div class="batch-main">
        <n-tag type="warning" round>
          {{ labels.selectedItems }}: {{ selectedCount }}
        </n-tag>

        <n-space>
          <n-button tertiary size="small" @click="emit('select-all')">
            {{ labels.selectAll }}
          </n-button>
          <n-button tertiary size="small" @click="emit('unselect-all')">
            {{ labels.unselectAll }}
          </n-button>

          <n-popconfirm @positive-click="emit('batch-delete')">
            <template #trigger>
              <n-button tertiary type="error" size="small">{{ labels.multiDelete }}</n-button>
            </template>
            {{ labels.multiDeleteTip }}
          </n-popconfirm>

          <n-popconfirm @positive-click="emit('batch-clear-inbox')">
            <template #trigger>
              <n-button tertiary type="warning" size="small">{{ labels.multiClearInbox }}</n-button>
            </template>
            {{ labels.multiClearInboxTip }}
          </n-popconfirm>

          <n-popconfirm @positive-click="emit('batch-clear-sent')">
            <template #trigger>
              <n-button tertiary type="warning" size="small">{{ labels.multiClearSentItems }}</n-button>
            </template>
            {{ labels.multiClearSentItemsTip }}
          </n-popconfirm>

          <n-button tertiary type="info" size="small" @click="emit('batch-tag-add')">
            {{ labels.batchAddTags }}
          </n-button>
          <n-button tertiary type="warning" size="small" @click="emit('batch-tag-remove')">
            {{ labels.batchRemoveTags }}
          </n-button>
          <n-button tertiary size="small" @click="emit('batch-tag-set')">
            {{ labels.batchSetTags }}
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.batch-bar-shell {
  position: sticky;
  bottom: 10px;
  z-index: 20;
}

.batch-bar-card {
  border-radius: var(--ds-radius);
  border: 1px solid color-mix(in srgb, var(--ds-border) 80%, transparent);
}

.batch-main {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
</style>
