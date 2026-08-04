import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: 'Dashboard', icon: 'mdi-view-dashboard-outline' },
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('../views/UploadView.vue'),
    meta: { title: 'Upload Document', icon: 'mdi-cloud-upload-outline' },
  },
  {
    path: '/ask',
    name: 'ask',
    component: () => import('../views/AskView.vue'),
    meta: { title: 'Ask & Search', icon: 'mdi-comment-question-outline' },
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('../views/DocumentsView.vue'),
    meta: { title: 'Documents', icon: 'mdi-file-document-multiple-outline' },
  },
  {
    path: '/documents/:id',
    name: 'document-detail',
    component: () => import('../views/DocumentDetailView.vue'),
    meta: { title: 'Document Detail', icon: 'mdi-file-document-outline' },
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('../views/ReviewView.vue'),
    meta: { title: 'Review Queue', icon: 'mdi-clipboard-check-outline' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Update document title based on route
router.afterEach((to) => {
  const title = (to.meta.title as string) || 'Document Control';
  document.title = `${title} | Engineering Document Control`;
});

export default router;