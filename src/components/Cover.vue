<template>
  <div :class="status.siteStatus !== 'normal' ? 'cover focus' : 'cover'">
    <img
      v-show="status.imgLoadStatus"
      class="background"
      alt="background"
      :src="currentBgUrl"
      :style="{ '--blur': set.backgroundBlur + 'px' }"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <Transition name="fade">
      <div v-if="set.showBackgroundGray" class="gray" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { statusStore, setStore } from "@/stores";

const set = setStore();
const status = statusStore();
const currentBgUrl = ref(null);
const nextBgUrl = ref(null);
const imgTimeout = ref(null);
const preloadImage = ref(null);
const emit = defineEmits(["loadComplete"]);

/* 壁纸随机数 */
/* 请依据文件夹内的图片个数修改 Math.random() 后面的第一个数字 */
const bgRandom = Math.floor(Math.random() * 3 + 1);

/* 缓存相关 */
const CACHE_KEY = 'wallpaper_cache';
const CACHE_EXPIRE = 24 * 60 * 60 * 1000; /* 24小时 */

/* 获取缓存的壁纸 */
const getCachedWallpaper = () => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      const { url, timestamp, type } = JSON.parse(cache);
      /* 检查缓存是否过期和类型是否匹配 */
      if (Date.now() - timestamp < CACHE_EXPIRE && type === set.backgroundType) {
        return url;
      }
    }
  } catch (error) {
    console.error('读取壁纸缓存失败:', error);
  }
  return null;
};

/* 设置壁纸缓存 */
const setCachedWallpaper = (url) => {
  try {
    const cache = {
      url,
      timestamp: Date.now(),
      type: set.backgroundType
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('保存壁纸缓存失败:', error);
  }
};

/* 预加载图片 */
const preloadWallpaper = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('无效的URL'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      preloadImage.value = img;
      resolve(url);
    };
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
};

/* 获取必应壁纸 */
const getBingWallpaper = async () => {
  try {
    const isMobile = window.innerWidth < 768;
    /* 使用新的API路径 */
    const response = await fetch('/api/wallpaper/bing');
    const data = await response.json();
    
    if (data.url) {
      return `https://cn.bing.com${data.url}`;
    }
    
    /* 如果API返回失败，使用备用链接 */
    return isMobile 
      ? 'https://cn.bing.com/th?id=OHR.CheetahMom_ZH-CN1434325639_1080x1920.jpg'
      : 'https://cn.bing.com/th?id=OHR.CheetahMom_ZH-CN1434325639_1920x1080.jpg';
  } catch (error) {
    console.error('获取必应壁纸失败:', error);
    /* 使用固定的备用图片 */
    return isMobile 
      ? 'https://cn.bing.com/th?id=OHR.CheetahMom_ZH-CN1434325639_1080x1920.jpg'
      : 'https://cn.bing.com/th?id=OHR.CheetahMom_ZH-CN1434325639_1920x1080.jpg';
  }
};

/* 赋值壁纸 */
const setBgUrl = async () => {
  const { backgroundType } = set;
  try {
    /* 先尝试使用缓存 */
    const cachedUrl = getCachedWallpaper();
    if (cachedUrl) {
      currentBgUrl.value = cachedUrl;
      /* 在后台更新新的壁纸 */
      updateWallpaper();
      return;
    }

    /* 如果没有缓存，直接获取新壁纸 */
    await updateWallpaper();
  } catch (error) {
    console.error("设置壁纸URL时出错：", error);
    currentBgUrl.value = `/background/bg${bgRandom}.jpg`;
  }
};

/* 更新壁纸 */
const updateWallpaper = async () => {
  const { backgroundType } = set;
  let url;

  try {
    switch (backgroundType) {
      case 0:
        url = `/background/bg${bgRandom}.jpg`;
        break;
      case 1:
        url = await getBingWallpaper();
        break;
      case 2:
        url = "https://api.ixiaowai.cn/gqapi/gqapi.php";
        break;
      case 3:
        url = "https://api.ixiaowai.cn/api/api.php";
        break;
      case 4:
        url = set.backgroundCustom;
        break;
      default:
        url = `/background/bg${bgRandom}.jpg`;
    }

    /* 预加载新壁纸 */
    await preloadWallpaper(url);
    
    /* 更新当前显示的壁纸 */
    currentBgUrl.value = url;
    
    /* 缓存壁纸 */
    setCachedWallpaper(url);

    /* 如果是在线壁纸，预加载下一张 */
    if (backgroundType > 0 && backgroundType < 4) {
      preloadNextWallpaper();
    }
  } catch (error) {
    console.error("更新壁纸失败：", error);
    throw error;
  }
};

/* 预加载下一张壁纸 */
const preloadNextWallpaper = async () => {
  try {
    const { backgroundType } = set;
    let nextUrl;

    switch (backgroundType) {
      case 1:
        nextUrl = await getBingWallpaper();
        break;
      case 2:
        nexturl = "https://api.ixiaowai.cn/gqapi/gqapi.php";
        break;
      case 3:
        nexturl = "https://api.ixiaowai.cn/api/api.php";
        break;
      default:
        return;
    }

    await preloadWallpaper(nextUrl);
    nextBgUrl.value = nextUrl;
  } catch (error) {
    console.error("预加载下一张壁纸失败：", error);
  }
};

/* 图片加载完成 */
const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      status.setImgLoadStatus(true);
      emit("loadComplete");
    },
    Math.floor(Math.random() * (300 - 100 + 1)) + 100,
  );
};

/* 图片动画完成 */
const imgAnimationEnd = () => {
  console.log("壁纸加载且动画完成");
  /* 加载完成事件 */
  emit("loadComplete");
};

/* 图片显示失败 */
const imgLoadError = () => {
  console.error("壁纸加载失败：", currentBgUrl.value);
  if (set.backgroundType !== 0) {
    set.backgroundType = 0;
    $message.error("壁纸加载失败，已切换为本地壁纸");
    setBgUrl();
  } else {
    /* 如果本地壁纸也加载失败，尝试其他备选壁纸 */
    const fallbackUrls = [
      "https://api.ixiaowai.cn/gqapi/gqapi.php",
      "https://api.ixiaowai.cn/api/api.php",
      "https://source.unsplash.com/random/1920x1080"
    ];
    
    if (!window._fallbackIndex) window._fallbackIndex = 0;
    if (window._fallbackIndex < fallbackUrls.length) {
      currentBgUrl.value = fallbackUrls[window._fallbackIndex++];
      $message.warning("本地壁纸加载失败，使用备选壁纸源");
    } else {
      window._fallbackIndex = 0;
      $message.error("所有壁纸源均不可用，请检查网络连接");
    }
  }
};

/* 监听壁纸类型变化 */
watch(
  () => set.backgroundType,
  () => {
    setBgUrl();
  }
);

onMounted(() => {
  setBgUrl();
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
});
</script>

<style lang="postcss" scoped>
.cover {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--body-background-color);
  &.focus {
    .background {
      filter: blur(calc(var(--blur) + 10px)) brightness(0.8);
      transform: scale(1.3);
    }
  }
  .background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    transform: scale(1.2);
    filter: blur(var(--blur));
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .gray {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);
  }
}
</style>
