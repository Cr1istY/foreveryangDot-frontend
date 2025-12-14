import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/blog/HomeView.vue'
import NotFound from '@/views/NotFoundPage.vue'
import BlogList from '@/views/blog/BlogList.vue'
import AdminLogin from '@/views/admin/AdminLogin.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' },
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogList,
      meta: { title: 'Blog' },
    },
    {
      path: '/admin',
      name: 'login',
      component: AdminLogin,
      meta: { title: 'Admin Login' },
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
      meta: { title: '页面走丢了' },
    },
  ],
})

export default router
