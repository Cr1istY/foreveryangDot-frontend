<template>
  <div class="blog-layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <n-h3 class="sidebar-title" style="padding-top: 18px;">📝 所有文章</n-h3>
      <n-text type="secondary">共 {{ totalPosts }} 篇文章 · 按发布时间倒序排列</n-text>
      <div class="calendar-heatmap" style="margin-top: 1.2%;">
        <n-h3 class="sidebar-title">📆 发文日历</n-h3>
        <HeatmapCalendar :posts="allPosts" @date-click="onDateSelect"  :selected-date="selectedDate"/>
      </div>

      <div class="tag-cloud" style="margin-top: 24px;">
        <n-h3 class="sidebar-title">🔖 分类标签</n-h3>
        <n-tag
          v-for="tag in categoryCounts"
          :key="tag.name"
          size="small"
          round
          :bordered="false"
          :color="{ color: '#f0f9ff', textColor: '#007bff' }"
          style="margin: 4px; cursor: default;"
        >
          {{ tag.name }} ({{ tag.count }})
        </n-tag>
      </div>
    </aside>

    <!-- 右侧主内容（你原有的内容） -->
    <main class="main-content">
      <!-- 你原来的 .blog-list-page 内容全部放在这里 -->


      <n-list hoverable style="margin-top: 24px;">
        <n-list-item v-for="post in paginatedPosts" :key="post.id">
          <n-thing>
            <template #header>
              <router-link :to="`/post/${post.id}`" class="post-title">
                {{ post.title }}
              </router-link>
            </template>
            <template #description>
              <n-space size="small">
                <n-tag type="info" size="small">{{ post.category }}</n-tag>
                <n-text type="secondary">{{ post.date }}</n-text>
              </n-space>
            </template>
            <template #footer>
              {{ post.excerpt }}
            </template>
          </n-thing>
        </n-list-item>
      </n-list>

      <div class="pagination-wrapper">
        <n-pagination
          v-if="totalPages > 1"
          v-model:page="currentPage"
          :page-count="totalPages"
          :page-size="pageSize"
          show-size-picker
          :page-sizes="[6, 12, 20]"
          @update:page-size="handlePageSizeChange"
          style="justify-content: center;"
        />
        <!-- 占位：当 totalPages <= 1 时保留空 div 高度 -->
        <div v-else style="height: 40px;"></div>
      </div>

      <n-empty
        v-if="allPosts.length === 0 && !loading"
        description="暂无文章"
        style="margin-top: 64px;"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import HeatmapCalendar from '@/components/HeatmapCalendar.vue';

// 定义文章类型
interface BlogPost {
  id: number;
  title: string;
  category: string;
  date: string;
  excerpt: string;
}


// 响应式数据：显式指定泛型
const allPosts = ref<BlogPost[]>([]);
const loading = ref<boolean>(true);
const currentPage = ref<number>(1);
const pageSize = ref<number>(6);

// 加载文章
const loadAllPosts = async () => {
  try {
    // TODO: 替换为真实 API
    // const res = await fetch('/api/posts');
    // allPosts.value = await res.json();

    // 模拟数据（与你主页格式一致）
    const mockData: BlogPost[] = [
      {
        id: 1,
        title: '如何用 Naive UI 构建响应式博客',
        category: 'Vue',
        date: '2024-11-15',
        excerpt: '从零开始搭建一个支持桌面和手机访问的个人博客系统...'
      },
      {
        id: 2,
        title: 'Vue 3 性能优化的 10 个技巧',
        category: '性能',
        date: '2024-10-22',
        excerpt: '涵盖组件懒加载、响应式数据优化、编译时优化等实战方案...'
      },
      {
        id: 3,
        title: 'Vite 插件开发入门',
        category: '工具链',
        date: '2024-12-08',
        excerpt: '深入 Vite 插件机制，手把手教你写一个自定义插件...'
      },
      {
        id: 4,
        title: 'TypeScript 泛型实战',
        category: 'TypeScript',
        date: '2024-12-05',
        excerpt: '从基础到高级，掌握泛型在真实项目中的应用...'
      },
      {
        id: 5,
        title: '部署个人网站到 Vercel',
        category: 'DevOps',
        date: '2024-12-01',
        excerpt: '免费、快速、自动 HTTPS，一键部署你的静态博客...'
      },
      {
        id: 6,
        title: 'Go 语言并发模式详解',
        category: 'Go',
        date: '2024-11-28',
        excerpt: 'goroutine + channel 的经典组合，构建高并发服务...'
      },
      {
        id: 7,
        title: 'Arduino 与 MQTT 实现智能家居',
        category: 'IoT',
        date: '2024-11-20',
        excerpt: '使用 ESP32 连接 MQTT Broker，远程控制 LED...'
      },
      {
        id: 8,
        title: 'Java Spring Boot 最佳实践',
        category: 'Java',
        date: '2024-11-10',
        excerpt: '从项目结构到异常处理，打造生产级后端服务...'
      }
    ];

    // 按日期倒序排序（最新在前）
    allPosts.value = mockData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    useMessage().error('加载文章失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAllPosts();
});

// 先筛选（如果 selectedDate 有值）
const filteredPosts = computed(() => {
  if (selectedDate.value) {
    return allPosts.value.filter(post => post.date === selectedDate.value);
  }
  return allPosts.value; // 无筛选时返回全部
});

// 再分页
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredPosts.value.slice(start, start + pageSize.value);
});

// 总页数也要基于筛选结果
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / pageSize.value));

// 总文章数显示也要动态更新（可选）
const totalPosts = computed(() => filteredPosts.value.length);

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // 切换每页数量时回到第一页
};

const categoryCounts = computed(() => {
  const map: Record<string, number> = {};
  allPosts.value.forEach(post => {
    map[post.category] = (map[post.category] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
});

// 新增：用于存储筛选的日期（null 表示不筛选）
const selectedDate = ref<string | undefined>(undefined);

const onDateSelect = (date: string) => {
  if (selectedDate.value === date) {
    // 再次点击同一日期 → 取消筛选
    selectedDate.value = undefined; // 使用 undefined 替代 null
  } else {
    // 点击新日期 → 应用筛选
    selectedDate.value = date;
  }
  currentPage.value = 1; // 切换筛选状态时重置到第一页
};
</script>

<style scoped>
.blog-list-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 48px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  text-align: center;
  padding: 40px 0 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin-top: 8px;
}

.posts-container {
  margin-top: 24px;
}

.post-item {
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.post-item:last-child {
  border-bottom: none;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
  transition: color 0.2s;
  display: block;
  margin-bottom: 6px;
}

.post-title:hover {
  color: #10b981; /* Naive 的 success 色 */
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.post-category {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.post-date {
  white-space: nowrap;
}

.post-excerpt {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 640px) {
  .blog-list-page {
    padding: 0 16px 32px;
  }

  .page-title {
    font-size: 24px;
  }

  .post-meta {
    flex-direction: column;
    gap: 4px;
  }
}

.blog-layout {
  display: flex;
  gap: 64px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
  min-height: calc(100vh - 100px); /* 👈 关键：留出页头/页脚空间 */
  align-items: start; /* 避免 baseline 对齐问题 */
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  height: fit-content;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #333;
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* 响应式：小屏时堆叠 */
@media (max-width: 960px) {
  .blog-layout {
    flex-direction: column;
    padding: 0 16px 32px;
  }

  .sidebar {
    width: 100%;
    position: static;
    margin-bottom: 32px;
  }
}
</style>
