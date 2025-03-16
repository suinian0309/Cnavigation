<template>
  <div class="shortcut-add-modal fade-in-scale" v-if="show" @click.stop>
    <!-- 主对话框 -->
    <form @submit.prevent="handleSubmit" v-show="!showIconSelector && !showFolderSelector">
      <div class="modal-header">
        {{ isEdit ? '编辑网站捷径' : '添加网站捷径' }}
        <button title="关闭" type="button" class="close-button" @click="handleClose">
          <i></i>
        </button>
      </div>
      
      <!-- 网址输入 -->
      <div class="input-wrapper">
        <label :for="urlInputId">
          <SvgIcon iconName="icon-link" />
          <span hidden>网址</span>
        </label>
        <input 
          :id="urlInputId" 
          autocomplete="off" 
          inputmode="url" 
          placeholder="网址" 
          required
          v-model="formData.url"
        >
      </div>
      
      <!-- 标题输入 -->
      <div class="input-wrapper">
        <label :for="titleInputId">
          <SvgIcon iconName="icon-heading" />
          <span hidden>标题</span>
        </label>
        <input 
          :id="titleInputId" 
          autocomplete="off" 
          placeholder="标题 - 留空即自动获取" 
          v-model="formData.name"
        >
      </div>
      
      <!-- 图标选择 -->
      <button type="button" class="option-button" @click="showIconSelector = true">
        <div class="option-icon">
          <SvgIcon iconName="icon-icons" />图标
        </div>
        <div class="option-value">
          <span>{{ getIconDisplayText() }}</span>
          <SvgIcon iconName="icon-angle-right" />
        </div>
      </button>
      
      <!-- 收纳夹选择 -->
      <button type="button" class="option-button" @click="showFolderSelector = true">
        <div class="option-icon">
          <SvgIcon iconName="icon-folder-closed" />收纳夹
        </div>
        <div class="option-value">
          <span>{{ getFolderDisplayText() }}</span>
          <SvgIcon iconName="icon-angle-right" />
        </div>
      </button>
      
      <!-- 提交按钮 -->
      <button type="submit" class="submit-button">{{ isEdit ? '保存' : '添加' }}</button>
    </form>
    
    <!-- 图标选择器 -->
    <div class="selector-panel" v-show="showIconSelector">
      <div class="modal-header">
        <button title="返回" type="button" class="back-button" @click="showIconSelector = false">
          <i></i>
        </button>
        自定义捷径图标
      </div>
      
      <!-- 自动图标选项 -->
      <div 
        class="icon-option" 
        :class="{ active: formData.icon === 'auto' }"
        role="radio" 
        tabindex="0" 
        aria-checked="true"
        @click="selectIcon('auto')"
        @keydown.space.prevent="selectIcon('auto')"
      >
        <div class="icon-option-content">
          <div class="icon-preview auto">A</div>
          <div>
            <div>自动</div>
            <div class="icon-description">自动获取并设置最适宜的图标。</div>
          </div>
        </div>
        <SvgIcon v-if="formData.icon === 'auto'" iconName="icon-check" class="check-icon" />
      </div>
      
      <!-- 网站默认图标选项 -->
      <div 
        class="icon-option" 
        :class="{ active: formData.icon === 'default' }"
        role="radio" 
        tabindex="0" 
        aria-checked="false"
        @click="selectIcon('default')"
        @keydown.space.prevent="selectIcon('default')"
      >
        <div class="icon-option-content">
          <div class="icon-preview default">?</div>
          <div>
            <div>网站默认</div>
            <div class="icon-description">{{ getDefaultIconDescription() }}</div>
          </div>
        </div>
        <SvgIcon v-if="formData.icon === 'default'" iconName="icon-check" class="check-icon" />
      </div>
      
      <!-- 青柠生成图标选项 -->
      <div 
        class="icon-option" 
        :class="{ active: formData.icon === 'generated' }"
        role="radio" 
        tabindex="0" 
        aria-checked="false"
        @click="selectIcon('generated')"
        @keydown.space.prevent="selectIcon('generated')"
      >
        <div class="icon-option-content">
          <div class="icon-preview generated" :style="generatedIconStyle">青</div>
          <div>
            <div>青柠生成</div>
            <button type="button" @click.stop="generateRandomIcon">
              <SvgIcon iconName="icon-dice" />随机
            </button>
          </div>
        </div>
        <SvgIcon v-if="formData.icon === 'generated'" iconName="icon-check" class="check-icon" />
      </div>
      
      <!-- 自定义URL图标选项 -->
      <div 
        class="icon-option" 
        :class="{ active: formData.icon === 'custom' }"
        role="radio" 
        tabindex="0" 
        aria-checked="false"
        @click="selectIcon('custom')"
        @keydown.space.prevent="selectIcon('custom')"
      >
        <div class="icon-option-content">
          <div class="icon-preview default">?</div>
          <div>
            <div>指定 URL</div>
            <input 
              autocomplete="off" 
              inputmode="url" 
              placeholder="图标 / 图片的 URL" 
              class="custom-icon-input"
              v-model="customIconUrl"
              @click.stop
              @input="updateCustomIcon"
            >
          </div>
        </div>
        <SvgIcon v-if="formData.icon === 'custom'" iconName="icon-check" class="check-icon" />
      </div>
    </div>
    
    <!-- 收纳夹选择器 -->
    <div class="selector-panel" v-show="showFolderSelector">
      <div class="modal-header">
        <button title="返回" type="button" class="back-button" @click="showFolderSelector = false">
          <i></i>
        </button>
        选择捷径收纳夹
      </div>
      
      <!-- 创建新收纳夹 -->
      <form class="folder-create-form" @submit.prevent="createFolder">
        <input 
          autocomplete="off" 
          placeholder="收纳夹名称" 
          class="folder-input"
          v-model="newFolderName"
        >
        <button type="submit" class="submit-button">创建</button>
      </form>
      
      <!-- 无收纳夹选项 -->
      <div 
        class="folder-option" 
        :class="{ active: formData.folder === 'none' }"
        role="radio" 
        tabindex="0" 
        aria-checked="true"
        @click="selectFolder('none')"
        @keydown.space.prevent="selectFolder('none')"
      >
        <span>无</span>
        <SvgIcon v-if="formData.folder === 'none'" iconName="icon-check" class="check-icon" />
      </div>
      
      <!-- 已有收纳夹列表 -->
      <div 
        v-for="folder in folders" 
        :key="folder.id"
        class="folder-option" 
        :class="{ active: formData.folder === folder.name }"
        role="radio" 
        tabindex="0" 
        :aria-checked="formData.folder === folder.name"
        @click="selectFolder(folder.name)"
        @keydown.space.prevent="selectFolder(folder.name)"
      >
        <span>{{ folder.name }}</span>
        <SvgIcon v-if="formData.folder === folder.name" iconName="icon-check" class="check-icon" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';
import identifyInput from '@/utils/identifyInput';
import { useMessage } from 'naive-ui';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      url: '',
      icon: 'auto',
      folder: 'none'
    })
  }
});

const emit = defineEmits(['update:show', 'submit', 'close']);

// 生成唯一ID
const urlInputId = `url-input-${Math.random().toString(36).substring(2, 9)}`;
const titleInputId = `title-input-${Math.random().toString(36).substring(2, 9)}`;

// 表单数据
const formData = ref({
  id: null,
  name: '',
  url: '',
  icon: 'auto',
  folder: 'none'
});

// 子面板显示状态
const showIconSelector = ref(false);
const showFolderSelector = ref(false);

// 自定义图标URL
const customIconUrl = ref('');

// 新收纳夹名称
const newFolderName = ref('');

// 收纳夹列表（示例数据，实际应从props或store获取）
const folders = ref([
  { id: 1, name: '常用' },
  { id: 2, name: '工作' },
  { id: 3, name: '学习' }
]);

// 生成的图标样式
const generatedIconStyle = ref({
  backgroundColor: '#d4af87',
  color: '#ffffff'
});

const $message = useMessage();

// 监听初始数据变化
watch(() => props.initialData, (newVal) => {
  formData.value = { ...newVal };
  if (formData.value.icon === 'custom' && formData.value.customIconUrl) {
    customIconUrl.value = formData.value.customIconUrl;
  }
}, { immediate: true, deep: true });

// 获取图标显示文本
const getIconDisplayText = () => {
  switch (formData.value.icon) {
    case 'auto': return '自动';
    case 'default': return '网站默认';
    case 'generated': return '青柠生成';
    case 'custom': return '自定义URL';
    default: return formData.value.icon;
  }
};

// 获取收纳夹显示文本
const getFolderDisplayText = () => {
  return formData.value.folder === 'none' ? '无' : formData.value.folder;
};

// 获取默认图标描述
const getDefaultIconDescription = () => {
  if (!formData.value.url) {
    return '尚未填写完整网址。';
  }
  return '使用网站提供的默认图标。';
};

// 选择图标
const selectIcon = (iconType) => {
  formData.value.icon = iconType;
  if (iconType === 'custom') {
    formData.value.customIconUrl = customIconUrl.value;
  }
};

// 更新自定义图标
const updateCustomIcon = () => {
  formData.value.customIconUrl = customIconUrl.value;
  formData.value.icon = 'custom';
};

// 生成随机图标
const generateRandomIcon = (e) => {
  e.stopPropagation();
  
  // 生成随机颜色
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20);
  const lightness = 50 + Math.floor(Math.random() * 10);
  
  generatedIconStyle.value = {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    color: '#ffffff'
  };
  
  formData.value.icon = 'generated';
  formData.value.iconStyle = generatedIconStyle.value;
};

// 选择收纳夹
const selectFolder = (folderName) => {
  formData.value.folder = folderName;
};

// 创建新收纳夹
const createFolder = () => {
  if (!newFolderName.value.trim()) {
    $message.warning('请输入收纳夹名称');
    return;
  }
  
  // 检查是否已存在同名收纳夹
  if (folders.value.some(f => f.name === newFolderName.value.trim())) {
    $message.warning('收纳夹名称已存在');
    return;
  }
  
  // 创建新收纳夹
  const newId = Math.max(...folders.value.map(f => f.id), 0) + 1;
  folders.value.push({
    id: newId,
    name: newFolderName.value.trim()
  });
  
  // 选择新创建的收纳夹
  formData.value.folder = newFolderName.value.trim();
  newFolderName.value = '';
  
  $message.success('收纳夹创建成功');
};

// 提交表单
const handleSubmit = () => {
  // 验证URL
  if (!formData.value.url.trim()) {
    $message.warning('请输入网址');
    return;
  }
  
  // 验证URL格式
  if (identifyInput(formData.value.url) !== 'url') {
    $message.warning('请输入有效的网址');
    return;
  }
  
  // 如果名称为空，设置默认名称
  if (!formData.value.name.trim()) {
    formData.value.name = '未命名';
  }
  
  emit('submit', { ...formData.value });
  handleClose();
};

// 关闭对话框
const handleClose = () => {
  showIconSelector.value = false;
  showFolderSelector.value = false;
  emit('update:show', false);
  emit('close');
};
</script>

<style lang="postcss" scoped>
.shortcut-add-modal {
  position: absolute;
  left: 0;
  top: 0;
  transform: translateX(20px);
  width: 360px;
  background-color: var(--main-background-light-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
  z-index: 1000;
  color: var(--main-text-color);
  pointer-events: auto;
  animation: fadeInScale 0.1s ease-out;
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    width: 320px;
    transform: translateX(15px);
  }
  
  @media (max-width: 576px) {
    width: 280px;
    transform: translateX(10px);
  }
  
  @media (max-width: 480px) {
    width: 250px;
    transform: translateX(5px);
  }
}

.fade-in-scale {
  animation: fadeInScale 0.1s ease-out forwards;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(20px) scale(1);
  }
}

/* 响应式动画关键帧 */
@media (max-width: 768px) {
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: translateX(15px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(15px) scale(1);
    }
  }
}

@media (max-width: 576px) {
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: translateX(10px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(10px) scale(1);
    }
  }
}

@media (max-width: 480px) {
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: translateX(5px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(5px) scale(1);
    }
  }
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 16px;
  font-weight: 500;
  border-bottom: 1px solid var(--main-border-color);
  position: relative;
}

.close-button, .back-button {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--main-text-color);
  opacity: 0.7;
  position: absolute;
  right: 16px;
  
  &:hover {
    opacity: 1;
  }
  
  i {
    position: relative;
    display: inline-block;
    width: 16px;
    height: 16px;
    
    &::before, &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 2px;
      background-color: currentColor;
      top: 50%;
      left: 0;
    }
    
    &::before {
      transform: rotate(45deg);
    }
    
    &::after {
      transform: rotate(-45deg);
    }
  }
}

.back-button {
  left: 16px;
  right: auto;
  
  i {
    &::before, &::after {
      width: 10px;
    }
    
    &::before {
      transform: rotate(-45deg) translate(0, -4px);
    }
    
    &::after {
      transform: rotate(45deg) translate(0, 4px);
    }
  }
}

form {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--main-background-hover-color);
  border-radius: 8px;
  overflow: hidden;
  
  label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    color: var(--main-text-color);
    opacity: 0.7;
  }
  
  input {
    flex: 1;
    background-color: transparent;
    border: none;
    height: 40px;
    padding: 0 12px 0 0;
    color: var(--main-text-color);
    font-size: 14px;
    
    &:focus {
      outline: none;
    }
    
    &::placeholder {
      color: var(--main-text-color);
      opacity: 0.5;
    }
  }
}

.option-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--main-background-hover-color);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 12px;
  color: var(--main-text-color);
  cursor: pointer;
  transition: background-color 0.1s;
  
  &:hover {
    background-color: var(--main-background-hover-color);
    opacity: 0.9;
  }
  
  .option-icon {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .option-value {
    display: flex;
    align-items: center;
    opacity: 0.7;
    gap: 4px;
  }
}

.submit-button {
  background-color: var(--main-text-color);
  color: var(--body-background-color);
  border: none;
  border-radius: 8px;
  height: 40px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.1s;
  
  &:hover {
    opacity: 0.9;
  }
}

/* 选择器面板 */
.selector-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 图标选项 */
.icon-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.1s;
  
  &:hover, &.active {
    background-color: var(--main-background-hover-color);
  }
  
  .icon-option-content {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .icon-preview {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      
      &.auto {
        background-color: var(--main-background-hover-color);
        color: var(--main-text-color);
      }
      
      &.default {
        background-color: var(--main-background-hover-color);
        color: var(--main-text-color);
      }
      
      &.generated {
        background-color: #d4af87;
        color: white;
      }
    }
    
    .icon-description {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }
    
    button {
      background-color: transparent;
      border: none;
      color: var(--main-text-color);
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 4px;
      
      &:hover {
        background-color: var(--main-background-hover-color);
      }
    }
    
    .custom-icon-input {
      background-color: var(--main-background-hover-color);
      border: none;
      border-radius: 4px;
      padding: 6px 8px;
      color: var(--main-text-color);
      width: 100%;
      margin-top: 4px;
      
      &:focus {
        outline: none;
      }
      
      &::placeholder {
        color: var(--main-text-color);
        opacity: 0.5;
      }
    }
  }
  
  .check-icon {
    font-size: 18px;
  }
}

/* 收纳夹创建表单 */
.folder-create-form {
  display: flex;
  gap: 8px;
  padding: 16px;
  
  .folder-input {
    flex: 1;
    background-color: var(--main-background-hover-color);
    border: none;
    border-radius: 8px;
    height: 40px;
    padding: 0 12px;
    color: var(--main-text-color);
    
    &:focus {
      outline: none;
    }
    
    &::placeholder {
      color: var(--main-text-color);
      opacity: 0.5;
    }
  }
  
  .submit-button {
    width: 80px;
  }
}

/* 收纳夹选项 */
.folder-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.1s;
  
  &:hover, &.active {
    background-color: var(--main-background-hover-color);
  }
  
  .check-icon {
    font-size: 18px;
  }
}
</style> 