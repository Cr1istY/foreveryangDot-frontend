<template>
  <div class="blog-layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <n-h3 class="sidebar-title" style="padding-top: 18px;">📝 所有文章</n-h3>
      <n-text type="secondary">共 {{ totalPosts }} 篇文章 · 按发布时间倒序排列</n-text>

      <!-- 🔍 智能搜索框 -->
      <div class="search-box">
        <n-input
          v-model:value="searchKeyword"
          placeholder="find the thoughts..."
          clearable
          size="small"
          @update:value="onSearch"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <!-- 搜索建议下拉 -->
        <div
          v-if="showSuggestions && searchSuggestions.length > 0"
          class="search-suggestions"
        >
          <div
            v-for="(suggestion, index) in searchSuggestions"
            :key="index"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>

      <div class="calendar-heatmap">
        <n-h3 class="sidebar-title">📆 发文日历</n-h3>
        <HeatmapCalendar
          :posts="allPosts"
          @date-click="onDateSelect"
          :selected-date="selectedDate"
        />
      </div>

      <div class="tag-cloud" style="margin-top: 24px;">
        <n-h3 class="sidebar-title">🔖 所有标签</n-h3>
        <n-tag
          v-for="tag in tagCounts"
          :key="tag.name"
          size="small"
          round
          :bordered="true"
          :color="getTagColor(tag.name)"
          style="margin: 4px; cursor: pointer;"
          @click="onTagSelect(tag.name)"
        >
          {{ tag.name }} ({{ tag.count }})
        </n-tag>
      </div>
    </aside>

    <!-- 右侧主内容 -->
    <main class="main-content">
      <div
        v-for="post in paginatedPosts"
        :key="post.id"
        class="post-item-layout"
      >
        <div class="post-text">
          <router-link :to="`/post/${post.id}`" class="post-title">
            {{ post.title }}
          </router-link>
          <div class="post-meta">
            <n-space size="small">
              <n-tag
                v-for="tag in post.tags"
                :key="tag"
                type="info"
                size="small"
                style="margin-right: 4px;"
              >
                {{ tag }}
              </n-tag>
              <n-text type="secondary">{{ post.date }}</n-text>
            </n-space>
          </div>
          <p class="post-excerpt">{{ post.excerpt }}</p>
        </div>
        <div class="post-thumbnail">
          <img
            :src="post.thumbnail || defaultThumbnail"
            alt=""
            loading="lazy"
          />
        </div>
      </div>

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
        <div v-else style="height: 40px;"></div>
      </div>

      <n-empty
        v-if="filteredPosts.length === 0 && !loading"
        description="暂无匹配文章"
        style="margin-top: 64px;"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useMessage } from 'naive-ui';
import HeatmapCalendar from '@/components/HeatmapCalendar.vue';

// 默认占位图（80x80 SVG）
const defaultThumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yNSAyNUg1NVY1NUgyNVYyNVoiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTM1IDQwSDQ1IiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0zNSA0NUg0NSIgc3Ryb2tlPSIjZTJlOGYwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMzUgNTBINTUiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==';

interface BlogPost {
  id: number;
  title: string;
  tags: string[];
  date: string;
  excerpt: string;
  thumbnail?: string;
}

const allPosts = ref<BlogPost[]>([]);
const loading = ref<boolean>(true);
const currentPage = ref<number>(1);
const pageSize = ref<number>(6);
const selectedDate = ref<string | undefined>(undefined);
const selectedTag = ref<string | undefined>(undefined);
const searchKeyword = ref<string>('');
const searchSuggestions = ref<string[]>([]);
const showSuggestions = ref<boolean>(false);
const blurTimer = ref<number | null>(null);

// ======================
// 🔍 全文搜索：动态构建倒排索引（基于标题 + 标签）
// ======================
let mockInvertedIndex: Record<string, number[]> = {};

/**
 * 构建倒排索引（小写分词）
 */
const buildMockInvertedIndex = (posts: BlogPost[]): void => {
  const index: Record<string, number[]> = {};
  posts.forEach(post => {
    const terms = new Set<string>();
    // 标题分词
    post.title.toLowerCase().split(/\s+/).forEach(t => terms.add(t));
    // 标签加入
    post.tags.forEach(tag => terms.add(tag.toLowerCase()));
    // 写入索引
    terms.forEach(term => {
      if (!index[term]) index[term] = [];
      if (!index[term].includes(post.id)) {
        index[term].push(post.id);
      }
    });
  });
  mockInvertedIndex = index;
};

/**
 * 全文搜索核心函数（AND 逻辑）
 */
const fullTextSearch = (query: string): number[] => {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return [];

  let resultIds: Set<number> | null = null;

  for (const term of terms) {
    const ids = mockInvertedIndex[term] || [];
    if (resultIds === null) {
      resultIds = new Set(ids);
    } else {
      resultIds = new Set(ids.filter(id => resultIds!.has(id)));
    }
  }

  return resultIds ? Array.from(resultIds) : [];
};

// 加载文章（模拟）
const loadAllPosts = async () => {
  try {
    const mockData: BlogPost[] = [
      {
        id: 1,
        title: '如何用 Naive UI 构建响应式博客',
        tags: ['Vue', 'UI', '响应式'],
        date: '2024-11-15',
        excerpt: '从零开始搭建一个支持桌面和手机访问的个人博客系统...',
      },
      {
        id: 2,
        title: 'Vue 3 性能优化的 10 个技巧',
        tags: ['Vue', '性能', '优化'],
        date: '2024-10-22',
        excerpt: '涵盖组件懒加载、响应式数据优化、编译时优化等实战方案...',
      },
      {
        id: 3,
        title: 'Vite 插件开发入门',
        tags: ['Vite', '工具链', '插件'],
        date: '2024-12-08',
        excerpt: '深入 Vite 插件机制，手把手教你写一个自定义插件...',
      },
      {
        id: 4,
        title: 'TypeScript 泛型实战',
        tags: ['TypeScript', '泛型', '类型安全'],
        date: '2024-12-05',
        excerpt: '从基础到高级，掌握泛型在真实项目中的应用...',
      },
      {
        id: 5,
        title: '部署个人网站到 Vercel',
        tags: ['DevOps', '部署', 'Vercel'],
        date: '2024-12-01',
        excerpt: '免费、快速、自动 HTTPS，一键部署你的静态博客...',
      },
      {
        id: 6,
        title: 'Go 语言并发模式详解',
        tags: ['Go', '并发', 'goroutine'],
        date: '2024-11-28',
        excerpt: 'goroutine + channel 的经典组合，构建高并发服务...',
      },
      {
        id: 7,
        title: 'Arduino 与 MQTT 实现智能家居',
        tags: ['IoT', 'Arduino', 'MQTT'],
        date: '2024-11-20',
        excerpt: '使用 ESP32 连接 MQTT Broker，远程控制 LED...',
      },
      {
        id: 8,
        title: 'Java Spring Boot 最佳实践',
        tags: ['Java', 'Spring', '后端'],
        date: '2024-11-10',
        excerpt: '从项目结构到异常处理，打造生产级后端服务...',
      }
    ];

    // 按时间倒序
    allPosts.value = mockData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 构建搜索索引
    buildMockInvertedIndex(allPosts.value);
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

onUnmounted(() => {
  if (blurTimer.value !== null) {
    window.clearTimeout(blurTimer.value);
    blurTimer.value = null;
  }
});

// 获取所有建议词（标题 + 标签）
const getAllKeywords = (): string[] => {
  const keywords = new Set<string>();
  allPosts.value.forEach(post => {
    keywords.add(post.title);
    post.tags.forEach(tag => keywords.add(tag));
  });
  return Array.from(keywords);
};

// 计算搜索建议
const computeSuggestions = (query: string): void => {
  if (!query.trim()) {
    searchSuggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  const lowerQuery = query.toLowerCase();
  const allKeywords = getAllKeywords();
  const matches = allKeywords
    .filter(kw => kw.toLowerCase().includes(lowerQuery))
    .slice(0, 5);
  searchSuggestions.value = matches;
  showSuggestions.value = matches.length > 0;
};

// 防抖
const debounce = <T extends (...args: string[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const debouncedCompute = debounce((val: string) => {
  computeSuggestions(val);
}, 200);

watch(searchKeyword, (newVal) => {
  debouncedCompute(newVal);
});

const handleFocus = (): void => {
  if (searchKeyword.value.trim()) {
    showSuggestions.value = true;
  }
};

const handleBlur = (): void => {
  if (blurTimer.value !== null) {
    window.clearTimeout(blurTimer.value);
  }
  blurTimer.value = window.setTimeout(() => {
    showSuggestions.value = false;
    blurTimer.value = null;
  }, 200);
};

const selectSuggestion = (text: string): void => {
  searchKeyword.value = text;
  showSuggestions.value = false;
  onSearch();
};

const onSearch = (): void => {
  currentPage.value = 1;
};

// ======================
// ✅ 筛选逻辑（搜索 + 日期 + 标签）
// ======================
const filteredPosts = computed(() => {
  let candidates = [...allPosts.value];

  // 1. 全文搜索
  if (searchKeyword.value.trim()) {
    const ids = fullTextSearch(searchKeyword.value);
    const matchedIds = new Set(ids);
    candidates = candidates.filter(post => matchedIds.has(post.id));
  }

  // 2. 日期筛选
  if (selectedDate.value) {
    candidates = candidates.filter(post => post.date === selectedDate.value);
  }

  // 3. 标签筛选
  if (selectedTag.value) {
    candidates = candidates.filter(post => post.tags.includes(selectedTag.value!));
  }

  return candidates;
});

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredPosts.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / pageSize.value));
const totalPosts = computed(() => filteredPosts.value.length);

const handlePageSizeChange = (size: number): void => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 标签统计
const tagCounts = computed(() => {
  const map: Record<string, number> = {};
  allPosts.value.forEach(post => {
    post.tags.forEach(tag => {
      map[tag] = (map[tag] || 0) + 1;
    });
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
});

const getTagColor = (tag: string) => {
  if (selectedTag.value === tag) {
    return { color: '#e6f7ff', textColor: '#1890ff' };
  }
  return { color: '#f0f9ff', textColor: '#007bff' };
};

const onDateSelect = (date: string): void => {
  selectedDate.value = selectedDate.value === date ? undefined : date;
  currentPage.value = 1;
};

const onTagSelect = (tag: string): void => {
  selectedTag.value = selectedTag.value === tag ? undefined : tag;
  currentPage.value = 1;
};
</script>

<style scoped>
.blog-layout {
  display: flex;
  gap: 64px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
  min-height: calc(100vh - 100px);
  align-items: start;
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

.post-item-layout {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.post-item-layout:last-child {
  border-bottom: none;
}

.post-text {
  flex: 1;
  min-width: 0;
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
  color: #10b981;
}

.post-meta {
  margin: 4px 0 8px;
}

.post-excerpt {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

.post-thumbnail {
  width: 160px;
  height: 90px;
  flex-shrink: 0;
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  background-color: #f8fafc;
}

/* 搜索建议样式 */
.search-box {
  position: relative;
  margin: 16px 0;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.suggestion-item:hover {
  background-color: #f9fafb;
}

/* 小屏响应式 */
@media (max-width: 640px) {
  .blog-layout {
    flex-direction: column;
    padding: 0 16px 32px;
  }

  .sidebar {
    width: 100%;
    position: static;
    margin-bottom: 32px;
  }

  .post-item-layout {
    flex-direction: column;
    gap: 12px;
  }

  .post-thumbnail {
    width: 100%;
    height: 180px;
    order: -1;
  }

  .post-thumbnail img {
    border-radius: 10px;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
