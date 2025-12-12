<template>
  <div class="memos-calendar">
    <!-- 自定义年月导航栏 -->
    <n-grid cols="4" class="calendar-header">
      <n-gi span="3 400:1 600:2 800:3">
        <span class="month-label">{{ currentMonthLabel }}</span>
      </n-gi>
      <n-gi responsive="self">
        <n-button
          size="small"
          text
          :disabled="isPrevDisabled"
          @click="prevMonth"
          style="margin: 0 12px;"
        >
          <template #icon>
            <n-icon :component="ArrowLeft" />
          </template>
        </n-button>
        <n-button
          size="small"
          text
          :disabled="isNextDisabled"
          @click="nextMonth"
        >
          <template #icon>
            <n-icon :component="ArrowRight" />
          </template>
        </n-button>
      </n-gi>
    </n-grid>

    <!-- 周标题 -->
    <div class="weekdays">
      <span v-for="day in weekdays" :key="day" class="weekday">
        {{ day }}
      </span>
    </div>

    <!-- 日历格子 -->
    <div class="days-grid">
      <div
        v-for="(item, index) in calendarDays"
        :key="index"
        class="day-cell"
        :class="getDayClass(item)"
        :title="getTitle(item)"
        @click="handleDayClick(item)"
      >
        <span>{{ item.date.getDate() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NButton, NIcon } from 'naive-ui';
// Naive UI 图标（使用官方推荐方式）
import {ArrowLeft, ArrowRight} from '@vicons/carbon';

// 类型声明
interface BlogPost {
  id: number;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  excerpt: string;
}

const today = new Date();
today.setHours(0, 0, 0, 0); // 忽略时分秒，只比日期
const props = defineProps<{
  posts: BlogPost[];
  selectedDate?: string; // ✅ 新增
}>();
const emit = defineEmits<{
  (e: 'date-click', date: string): void;
}>();


// ------------------ 工具函数 ------------------
function isValidDateString(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function parseYearMonth(value: string): [number, number] | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]); // 1-based
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return [year, month];
}

// ------------------ 数据映射 ------------------
const postCountByDate = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  for (const post of props.posts) {
    if (isValidDateString(post.date)) {
      map[post.date] = (map[post.date] || 0) + 1;
    }
  }
  return map;
});

const maxCount = computed<number>(() => {
  const counts = Object.values(postCountByDate.value);
  return counts.length > 0 ? Math.max(...counts) : 1;
});

// ------------------ 状态 ------------------
const selectedYearMonth = ref<string | null>(null);

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

// ------------------ 初始化 ------------------
onMounted(() => {
  const now = new Date();
  selectedYearMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

// ------------------ 导航逻辑 ------------------
const MIN_YEAR = 2010;
const MAX_YEAR = 2035;

const currentMonthLabel = computed<string>(() => {
  if (!selectedYearMonth.value) return '';
  const parsed = parseYearMonth(selectedYearMonth.value);
  if (!parsed) return '';
  const [year, month] = parsed;
  return `${year}年${month}月`;
});

const isPrevDisabled = computed<boolean>(() => {
  if (!selectedYearMonth.value) return true;
  const parsed = parseYearMonth(selectedYearMonth.value);
  if (!parsed) return true;
  const [year, month] = parsed;
  return year <= MIN_YEAR && month === 1;
});

const isNextDisabled = computed<boolean>(() => {
  if (!selectedYearMonth.value) return true;
  const parsed = parseYearMonth(selectedYearMonth.value);
  if (!parsed) return true;
  const [year, month] = parsed;
  return year >= MAX_YEAR && month === 12;
});

const prevMonth = (): void => {
  if (!selectedYearMonth.value) return;
  const parsed = parseYearMonth(selectedYearMonth.value);
  if (!parsed) return;
  let [year, month] = parsed; // month is 1-based
  if (month === 1) {
    year--;
    month = 12;
  } else {
    month--;
  }
  selectedYearMonth.value = `${year}-${String(month).padStart(2, '0')}`;
};

const nextMonth = (): void => {
  if (!selectedYearMonth.value) return;
  const parsed = parseYearMonth(selectedYearMonth.value);
  if (!parsed) return;
  let [year, month] = parsed; // month is 1-based
  if (month === 12) {
    year++;
    month = 1;
  } else {
    month++;
  }
  selectedYearMonth.value = `${year}-${String(month).padStart(2, '0')}`;
};

// ------------------ 日历数据 ------------------
interface CalendarDay {
  date: Date;
  dateStr: string;
  count: number;
  isCurrentMonth: boolean;
  isFuture: boolean; // ✅ 新增
}
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
function isDateInFuture(d: Date): boolean {
  const dCopy = new Date(d);
  dCopy.setHours(0, 0, 0, 0);
  return dCopy.getTime() > todayStart.getTime();
}

const calendarDays = computed<CalendarDay[]>(() => {


  if (selectedYearMonth.value === null) return [];
  const parsed = parseYearMonth(selectedYearMonth.value);
  if (!parsed) return [];

  const [year, month] = parsed;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startWeekday = firstDay.getDay();
  const days: CalendarDay[] = [];

  // 上个月
  const prevMonthLastDay = new Date(year, month - 1, 0);
  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = new Date(prevMonthLastDay);
    date.setDate(prevMonthLastDay.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push({ date, dateStr, count: 0, isCurrentMonth: false, isFuture: isDateInFuture(date) });
  }

  // 本月
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const count = postCountByDate.value[dateStr] ?? 0;
    days.push({ date, dateStr, count, isCurrentMonth: true, isFuture: isDateInFuture(date) });
  }

  // 下个月
  const remaining = 42 - days.length;
  const nextMonthStart = new Date(year, month, 1);
  for (let i = 0; i < remaining; i++) {
    const date = new Date(nextMonthStart);
    date.setDate(nextMonthStart.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push({ date, dateStr, count: 0, isCurrentMonth: false, isFuture: isDateInFuture(date) });
  }

  return days;
});

const handleDayClick = (item: CalendarDay): void => {
  if (item.isFuture) return;
  console.log(item.dateStr);
  emit('date-click', item.dateStr); // 👈 发出事件
};

// ------------------ 样式 & 提示 ------------------
const getDayClass = (item: CalendarDay): string => {
  if (item.isFuture) {
    return 'level-future';
  }
  if (!item.isCurrentMonth) {
    return 'level-outside';
  }
  // ✅ 高亮选中日期（即使 count=0）
  if (props.selectedDate === item.dateStr) {
    return 'level-selected';
  }
  if (item.count === 0) return 'level-0';
  const level = Math.ceil((item.count / maxCount.value) * 3);
  return `level-${Math.min(level, 3)}`;
};

const getTitle = (item: CalendarDay): string => {
  if (item.isFuture) {
    return `${item.dateStr} · 未来日期`;
  }
  if (!item.isCurrentMonth) {
    return item.dateStr;
  }
  return `${item.dateStr} · ${item.count} 篇`;
};
</script>

<style scoped>
.memos-calendar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  color: #333;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.month-label {
  font-weight: 600;
  min-width: 90px;
  text-align: center;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 6px;
}

.weekday {
  font-size: 12px;
  color: #999;
  padding: 2px 0;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  cursor: default;
}

.day-cell.level-outside {
  background-color: transparent;
  color: #ccc;
}

.day-cell.level-0 {
  background-color: #f0f0f0;
  color: #ccc;
}

.day-cell.level-1 {
  background-color: #c6e48b;
  color: #191919;
}
.day-cell.level-2 {
  background-color: #7bc96f;
  color: #191919;
}
.day-cell.level-3 {
  background-color: #239a3b;
  color: white;
}

.day-cell.level-future {
  background-color: transparent !important;
  color: #ddd !important;
  cursor: not-allowed;
}

.day-cell.level-selected {
  border: 2px solid #10b981 !important;
  background-color: #dcfce7 !important;
  color: #065f46 !important;
}
</style>
