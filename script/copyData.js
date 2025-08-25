import fse from 'fs-extra';
const { copySync } = fse;
const srcLandDir = './src/languages/';
const destLandDir = './dist/languages/';

try {
  // Copy ngôn ngữ từ src sang dist
  copySync(srcLandDir, destLandDir, { overwrite: true });
  console.log('Copy thư muc languages thành công!');
} catch (err) {
  console.error('Lỗi khi copy thư mục languages:', err);
}