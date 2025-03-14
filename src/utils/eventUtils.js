/**
 * 事件处理工具函数
 * 用于优化事件处理函数，包括防抖、节流和批量更新
 */

/**
 * 防抖函数 - 延迟执行函数，如果在延迟时间内再次调用，则重新计时
 * @param {Function} fn - 要执行的函数
 * @param {Number} delay - 延迟时间（毫秒）
 * @param {Boolean} immediate - 是否立即执行
 * @returns {Function} - 防抖处理后的函数
 */
export const debounce = (fn, delay = 300, immediate = false) => {
  let timer = null;
  
  return function(...args) {
    const context = this;
    
    if (timer) clearTimeout(timer);
    
    if (immediate && !timer) {
      fn.apply(context, args);
    }
    
    timer = setTimeout(() => {
      if (!immediate) fn.apply(context, args);
      timer = null;
    }, delay);
  };
};

/**
 * 节流函数 - 限制函数执行频率，每隔一段时间执行一次
 * @param {Function} fn - 要执行的函数
 * @param {Number} interval - 间隔时间（毫秒）
 * @returns {Function} - 节流处理后的函数
 */
export const throttle = (fn, interval = 300) => {
  let lastTime = 0;
  let timer = null;
  
  return function(...args) {
    const context = this;
    const now = Date.now();
    
    // 计算剩余时间
    const remaining = interval - (now - lastTime);
    
    // 如果已经到了间隔时间，执行函数
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      
      fn.apply(context, args);
      lastTime = now;
    } else if (!timer) {
      // 如果还没到间隔时间，设置定时器
      timer = setTimeout(() => {
        fn.apply(context, args);
        lastTime = Date.now();
        timer = null;
      }, remaining);
    }
  };
};

/**
 * 批量更新函数 - 将多次更新合并为一次
 * @param {Function} fn - 要执行的函数
 * @param {Object} options - 配置选项
 * @returns {Function} - 批量更新处理后的函数
 */
export const batchUpdate = (fn, options = {}) => {
  const { delay = 16, maxWait = 100 } = options;
  let batch = [];
  let timer = null;
  let lastInvokeTime = 0;
  
  const processBatch = () => {
    if (batch.length === 0) return;
    
    const currentBatch = [...batch];
    batch = [];
    fn(currentBatch);
    
    lastInvokeTime = Date.now();
    timer = null;
  };
  
  return function(item) {
    batch.push(item);
    
    const now = Date.now();
    const timeElapsed = now - lastInvokeTime;
    
    // 如果已经超过最大等待时间，立即处理
    if (timeElapsed >= maxWait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      processBatch();
      return;
    }
    
    // 如果没有定时器，设置定时器
    if (!timer) {
      timer = setTimeout(processBatch, delay);
    }
  };
};

/**
 * 创建一个可取消的防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {Number} delay - 延迟时间（毫秒）
 * @returns {Object} - 包含执行函数和取消函数的对象
 */
export const createCancelableDebounce = (fn, delay = 300) => {
  let timer = null;
  
  const debounced = function(...args) {
    const context = this;
    
    if (timer) clearTimeout(timer);
    
    timer = setTimeout(() => {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  
  return {
    execute: debounced,
    cancel
  };
};

/**
 * 创建一个可取消的节流函数
 * @param {Function} fn - 要执行的函数
 * @param {Number} interval - 间隔时间（毫秒）
 * @returns {Object} - 包含执行函数和取消函数的对象
 */
export const createCancelableThrottle = (fn, interval = 300) => {
  let lastTime = 0;
  let timer = null;
  
  const throttled = function(...args) {
    const context = this;
    const now = Date.now();
    
    // 计算剩余时间
    const remaining = interval - (now - lastTime);
    
    // 如果已经到了间隔时间，执行函数
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      
      fn.apply(context, args);
      lastTime = now;
    } else if (!timer) {
      // 如果还没到间隔时间，设置定时器
      timer = setTimeout(() => {
        fn.apply(context, args);
        lastTime = Date.now();
        timer = null;
      }, remaining);
    }
  };
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  
  return {
    execute: throttled,
    cancel
  };
}; 