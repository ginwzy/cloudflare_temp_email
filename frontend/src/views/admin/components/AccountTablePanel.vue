<script setup>
import { computed } from 'vue'

const props = defineProps({
  labels: {
    type: Object,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  showMultiActionBar: {
    type: Boolean,
    default: false
  },
  tableScrollX: {
    type: Number,
    default: 960
  },
  columns: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  },
  checkedRowKeys: {
    type: Array,
    default: () => []
  },
  page: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  },
  visibleColumnKeys: {
    type: Array,
    default: () => []
  },
  columnOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:checkedRowKeys',
  'update:page',
  'update:pageSize',
  'update:visibleColumnKeys',
  'reset-columns'
])

const checkedRowKeysModel = computed({
  get: () => props.checkedRowKeys,
  set: (value) => emit('update:checkedRowKeys', value)
})

const visibleColumnKeysModel = computed({
  get: () => props.visibleColumnKeys,
  set: (value) => emit('update:visibleColumnKeys', value)
})
</script>

<template>
  <n-card embedded :bordered="false" class="account-table-card">
    <div class="table-head">
      <n-space>
        <n-tag type="info" round>
          {{ labels.itemCount }}: {{ count }}
        </n-tag>
        <n-tag v-if="showMultiActionBar" type="warning" round>
          {{ labels.selectedItems }}: {{ selectedCount }}
        </n-tag>
      </n-space>

      <n-popover trigger="click" placement="bottom-end">
        <template #trigger>
          <n-button tertiary size="small">{{ labels.columns }}</n-button>
        </template>
        <div class="column-popover">
          <p class="column-title">{{ labels.columns }}</p>
          <n-checkbox-group v-model:value="visibleColumnKeysModel">
            <n-space vertical :size="8">
              <n-checkbox
                v-for="option in columnOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </n-checkbox>
            </n-space>
          </n-checkbox-group>
          <n-button text size="tiny" @click="emit('reset-columns')">
            {{ labels.resetColumns }}
          </n-button>
        </div>
      </n-popover>
    </div>

    <div class="table-scroll-wrap">
      <div :style="{ minWidth: `${tableScrollX}px` }">
        <n-data-table
          v-model:checked-row-keys="checkedRowKeysModel"
          :columns="columns"
          :data="data"
          :bordered="false"
          :row-key="(row) => row.id"
          embedded
        />
      </div>
    </div>

    <div class="table-foot">
      <n-pagination
        :page="page"
        :page-size="pageSize"
        :item-count="count"
        :page-sizes="[20, 50, 100]"
        show-size-picker
        @update:page="(value) => emit('update:page', value)"
        @update:page-size="(value) => emit('update:pageSize', value)"
      >
        <template #prefix>
          {{ labels.itemCount }}: {{ count }}
        </template>
      </n-pagination>
    </div>
  </n-card>
</template>

<style scoped>
.account-table-card {
  border-radius: var(--ds-radius);
  border: 1px solid color-mix(in srgb, var(--ds-border) 80%, transparent);
}

.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.table-scroll-wrap {
  overflow: auto;
}

.table-foot {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.column-popover {
  display: grid;
  gap: 10px;
  min-width: 190px;
}

.column-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-text-secondary);
}

@media (max-width: 640px) {
  .table-foot {
    justify-content: center;
  }
}
</style>
