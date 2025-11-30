
import { LucideIcon, LayoutDashboard, ShoppingBag, Database, Settings, Activity } from 'lucide-react';

export const APP_NAME = "众拓 TikTok 全自动截流系统";
export const APP_VERSION = "爬虫旗舰版 v5.3";

// Gemini Model Configuration
export const GEMINI_MODEL_FAST = "gemini-2.5-flash";

export const SAMPLE_DATA = `
1. 【夏季爆款】碎花连衣裙
价格: $15.99  销量: 10.2k
链接: https://tiktok.com/product/12345
店铺: FashionNova (https://tiktok.com/@fashionnova)

2. 懒人抹布干湿两用
US $3.50 | 已售 5000+
好用不贵，点击左下角小黄车购买
店铺: 家居好物严选
`;

export const PRODUCT_CATEGORIES = [
  "所有类目",
  "女装服饰",
  "男装服饰",
  "美妆个护",
  "3C数码",
  "家居百货",
  "鞋包配饰",
  "运动户外",
  "母婴玩具",
  "食品饮料"
];

export const PROXY_REGIONS = [
  "自动 (Auto)",
  "美国 (US - Residential)",
  "英国 (UK)",
  "东南亚 (SEA)",
  "中国 (CN)"
];

export const NAV_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: '数据大屏', icon: LayoutDashboard },
  { id: 'extraction', label: '智能采集', icon: Activity },
  { id: 'products', label: '商品库', icon: ShoppingBag },
  { id: 'settings', label: '系统设置', icon: Settings },
];

export const CRAWLER_LOGS = [
  "初始化无头浏览器 (Headless Chrome/121.0)...",
  "加载反指纹配置 (Stealth Plugin Active)...",
  "正在连接住宅代理池 (ISP Proxy)...",
  "随机化 User-Agent 与 Viewport...",
  "伪造 WebGL/Canvas 指纹...",
  "绕过 Cloudflare Turnstile 验证...",
  "目标页面加载中 (DOM Ready)...",
  "注入鼠标轨迹与点击事件 (模拟人类行为)...",
  "拦截 XHR/Fetch 请求数据包...",
  "解析动态 Hydration 数据 (Next.js/React)...",
  "数据清洗与去重...",
  "采集完成，正在释放会话资源..."
];
