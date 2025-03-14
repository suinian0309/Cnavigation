/**
 * 图片转换脚本
 * 将 JPG 图片转换为 WebP 格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpConverter from 'webp-converter';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置 webp-converter 的二进制文件路径
webpConverter.grant_permission();

// 背景图片目录
const backgroundDir = path.join(__dirname, '../public/background');

// 转换质量
const QUALITY = 80;

/**
 * 转换单个图片
 * @param {string} filePath - 图片路径
 */
async function convertImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    console.log(`跳过非图片文件: ${filePath}`);
    return;
  }

  const outputPath = filePath.replace(ext, '.webp');
  
  // 检查输出文件是否已存在
  if (fs.existsSync(outputPath)) {
    console.log(`WebP 文件已存在: ${outputPath}`);
    return;
  }

  try {
    console.log(`转换图片: ${filePath} -> ${outputPath}`);
    await webpConverter.cwebp(filePath, outputPath, `-q ${QUALITY}`);
    console.log(`转换成功: ${outputPath}`);
  } catch (error) {
    console.error(`转换失败: ${filePath}`, error);
  }
}

/**
 * 转换目录中的所有图片
 * @param {string} directory - 目录路径
 */
async function convertDirectory(directory) {
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await convertDirectory(filePath);
      } else {
        await convertImage(filePath);
      }
    }
  } catch (error) {
    console.error(`读取目录失败: ${directory}`, error);
  }
}

// 开始转换
console.log('开始转换图片...');
convertDirectory(backgroundDir)
  .then(() => {
    console.log('图片转换完成！');
  })
  .catch((error) => {
    console.error('图片转换过程中发生错误:', error);
  }); 