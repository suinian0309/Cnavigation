import { setOptimizedStorage, getOptimizedStorage } from './storageUtils';

/**
 * 创建优化的 Pinia 持久化插件
 * @param {Object} options - 配置选项
 * @returns {Function} - Pinia 插件函数
 */
export function createOptimizedPersistedState(options = {}) {
  const {
    key = 'pinia',
    paths = null,
    beforeRestore = null,
    afterRestore = null,
  } = options;

  return ({ store }) => {
    // 获取存储的键名
    const storeKey = key || store.$id;

    // 恢复状态
    const fromStorage = getOptimizedStorage(storeKey);
    if (fromStorage) {
      // 恢复前的钩子
      if (beforeRestore) {
        beforeRestore(store);
      }

      // 恢复状态
      if (paths) {
        // 只恢复指定路径的状态
        const partialState = {};
        paths.forEach(path => {
          if (fromStorage[path] !== undefined) {
            partialState[path] = fromStorage[path];
          }
        });
        store.$patch(partialState);
      } else {
        // 恢复所有状态
        store.$patch(fromStorage);
      }

      // 恢复后的钩子
      if (afterRestore) {
        afterRestore(store);
      }
    }

    // 监听状态变化
    store.$subscribe(
      (_, state) => {
        // 只持久化指定路径的状态
        if (paths) {
          const partialState = {};
          paths.forEach(path => {
            partialState[path] = state[path];
          });
          setOptimizedStorage(storeKey, partialState);
        } else {
          // 持久化所有状态
          setOptimizedStorage(storeKey, state);
        }
      },
      { detached: true }
    );
  };
} 