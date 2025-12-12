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
      <div class="tag-cloud" style="margin-top: 24px;">
        <n-h3 class="sidebar-title">😊 更多信息</n-h3>
          <n-space vertical>
            <n-button text tag="a" @click="$router.push('/')">
              🏠 foreveryang
            </n-button>
            <n-button text tag="a" href="https://github.com/Cr1istY/foreveryangDot-frontend" target="_blank">
              💻 source code
            </n-button>
            <n-button text tag="a" href="https://beian.miit.gov.cn/" target="_blank">
              渝ICP备2025056615号
            </n-button>
          </n-space>
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
            <n-text type="secondary" class="post-date">{{ post.date }}</n-text>
            <!-- 使用 NAvatarGroup 展示标签头像 -->
            <n-avatar-group
              :options="getPostTagOptions(post)"
              :max="3"
              size="small"
              :style="{ display: 'inline-flex', gap: '4px' }"
            >
              <!-- 自定义每个 avatar -->
              <template #avatar="{ option }">
                <n-tooltip placement="top">
                  <template #trigger>
                    <n-avatar
                      :src="option.src"
                      :fallback="{ text: option.name?.[0]?.toUpperCase() || '?' }"
                      style="cursor: pointer;"
                      @click.stop="onTagSelect(option.name)"
                    />
                  </template>
                  {{ option.name }}
                </n-tooltip>
              </template>

              <template #rest="{ rest, options: restOptions }">
                <n-dropdown
                  :options="createDropdownOptions(restOptions)"
                  placement="top"
                  trigger="hover"
                  :style="{ cursor: 'pointer' }"
                >
                  <n-avatar>+{{ rest }}</n-avatar>
                </n-dropdown>
              </template>
            </n-avatar-group>


          </div>
          <p class="post-excerpt">{{ post.excerpt }}</p>
        </div>
        <div class="post-thumbnail">
          <img
            :src="post.thumbnail || defaultThumbnail"
            alt=""
            loading="lazy"
            style="object-fit: cover; object-position: center;"
          />
        </div>
      </div>

      <div class="pagination-wrapper">
        <n-pagination
          v-show="totalPages > 1"
          v-model:page="currentPage"
          :page-count="totalPages"
          :page-size="pageSize"
          show-size-picker
          :page-sizes="[12, 20]"
          @update:page-size="handlePageSizeChange"
          class="pagination"
        />
        <div v-show="totalPages <= 1" class="pagination-placeholder"></div>
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
import { ref, computed, onMounted, watch, onUnmounted, h } from 'vue';
import { useMessage, NAvatar } from 'naive-ui';
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
const pageSize = ref<number>(12);
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

const buildMockInvertedIndex = (posts: BlogPost[]): void => {
  const index: Record<string, number[]> = {};
  posts.forEach(post => {
    const terms = new Set<string>();
    post.title.toLowerCase().split(/\s+/).forEach(t => terms.add(t));
    post.tags.forEach(tag => terms.add(tag.toLowerCase()));
    terms.forEach(term => {
      if (!index[term]) index[term] = [];
      if (!index[term].includes(post.id)) {
        index[term].push(post.id);
      }
    });
  });
  mockInvertedIndex = index;
};

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
        tags: ['Vue', 'UI', '响应式', 'Vite', '工具链', '插件'],
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
        tags: ['Go', '并发'],
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
      },
      {
        id: 9,
        title: 'React Hooks 深入浅出',
        tags: ['React', 'Hooks', '前端'],
        date: '2024-10-15',
        excerpt: '从 useState 到 useEffect，全面掌握 React Hooks...',
      },
      {
        id: 10,
        title: 'Docker 容器化部署指南',
        tags: ['Docker', '容器', '部署'],
        date: '2024-10-08',
        excerpt: '手把手教你使用 Docker 打包和部署应用...',
      },
      {
        id: 11,
        title: 'Python 数据分析实战',
        tags: ['Python', '数据分析', 'Pandas'],
        date: '2024-09-30',
        excerpt: '使用 Pandas 和 NumPy 进行数据处理和分析...',
      },
      {
        id: 12,
        title: '微服务架构设计原则',
        tags: ['架构', '微服务', '设计'],
        date: '2024-09-25',
        excerpt: '探讨微服务架构的设计原则和最佳实践...',
      },
      {
        id: 13,
        title: 'Flutter 跨平台开发实践',
        tags: ['Flutter', '移动开发', '跨平台'],
        date: '2024-09-20',
        excerpt: '一套代码，多端运行，Flutter 开发体验...',
      },
      {
        id: 14,
        title: 'Kubernetes 集群管理入门',
        tags: ['K8s', '容器编排', '运维'],
        date: '2024-09-15',
        excerpt: '从基础概念到实际部署，全面了解 Kubernetes...',
      },
      {
        id: 15,
        title: 'Rust 内存安全机制解析',
        tags: ['Rust', '内存管理', '系统编程'],
        date: '2024-09-10',
        excerpt: '深入理解 Rust 的所有权和借用检查机制...',
      }
    ];


    allPosts.value = mockData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
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

// ======================
// 🖼️ 标签头像生成（带彩色背景 SVG）
// ======================

type ColorHex = `#${string}`;

const stringToColor = (str: string | undefined): ColorHex => {
  const colors: ColorHex[] = [
    '#fce7f3', '#e0f2fe', '#dcfce7', '#fff7ed', '#ede9fe',
    '#ffe4e6', '#ffedd5', '#dcf5e9', '#e6f7ff', '#f0f9ff'
  ];
  if (!str) {
    return colors[0] as ColorHex; // 明确的类型断言
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] as ColorHex; // 明确的类型断言
};

// ✅ 现在会被使用！
const PlaceholderSvg = (text: string): string => {
  const char = text?.[0]?.toUpperCase() || '?';
  const bgColor = stringToColor(text) || '#fce7f3'; // 添加默认颜色
  const textColor = '#334155';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="${bgColor}"/>
      <text x="16" y="21" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="${textColor}" font-weight="500">${char}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const tagIconMap: Record<string, string> = {};


const getPostTagOptions = (post: BlogPost) => {
  return post.tags.map(tag => {
    // 尝试加载本地图标
    return {
      name: tag,
      src: tagIconMap[tag] || PlaceholderSvg(tag),
      fallbackText: tag?.[0]?.toUpperCase() || '?'
    };
  });
};


const createDropdownOptions = (restOptions: { name: string; src: string; fallbackText: string }[]) => {
  return restOptions.map(opt => ({
    key: opt.name,
    label: () =>
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        h(NAvatar, {
          size: 'small',
          src: opt.src,
          fallback: { text: opt.fallbackText }
        }),
        h('span', opt.name)
      ]),
    onClick: () => onTagSelect(opt.name)
  }));
};

// ======================
// 🔎 搜索建议 & 防抖
// ======================

const getAllKeywords = (): string[] => {
  const keywords = new Set<string>();
  allPosts.value.forEach(post => {
    keywords.add(post.title);
    post.tags.forEach(tag => keywords.add(tag));
  });
  return Array.from(keywords);
};

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
// ✅ 筛选逻辑
// ======================

const filteredPosts = computed(() => {
  let candidates = [...allPosts.value];

  if (searchKeyword.value.trim()) {
    const ids = fullTextSearch(searchKeyword.value);
    const matchedIds = new Set(ids);
    candidates = candidates.filter(post => matchedIds.has(post.id));
  }

  if (selectedDate.value) {
    candidates = candidates.filter(post => post.date === selectedDate.value);
  }

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

const tagCounts = computed(() => {
  const map: Record<string, number> = {};
  allPosts.value.forEach(post => {
    post.tags.forEach(tag => {
      map[tag] = (map[tag] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) // 按数量降序排序
    .slice(0, 20); // 只取前20个
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

.sidebar {
  width: 250px;
  flex-shrink: 0;
  position: fixed;
  top: 24px; /* 与页面顶部边距保持一致 */
  height: calc(100vh - 88px); /* 减去顶部边距和底部间距 */
  overflow-y: auto;
}

.main-content {
  flex: 1;
  min-width: 0;
  margin-left: 288px; /* 侧边栏宽度 + 间距 */
  margin-top: 24px;
}

.blog-layout {
  display: flex;
  gap: 64px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
  min-height: 100vh;
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
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 8px;
}

.post-date {
  margin-right: 8px;
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

@media (max-width: 640px) {
  .blog-layout {
    flex-direction: column;
    padding: 0 16px 32px;
  }

  .sidebar {
    width: 100%;
    position: static;
    left: auto;
    margin-bottom: 32px;
  }

  .main-content {
    margin-left: 0;
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
  min-height: 40px; /* 或根据实际调整 */
}

.pagination,
.pagination-placeholder {
  height: 40px; /* 统一高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
