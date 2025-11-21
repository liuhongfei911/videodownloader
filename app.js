// 常量定义
const CORRECT_PASSWORD = '123456';
const API_URL = 'https://api.guijianpan.com/waterRemoveDetail/xxmQsyByAk';
const API_KEY = 'b2d0603ff4cc4da48442f60d537fa28d';

// DOM元素
const passwordSection = document.getElementById('passwordSection');
const mainSection = document.getElementById('mainSection');
const resultSection = document.getElementById('resultSection');
const passwordInput = document.getElementById('password');
const passwordError = document.getElementById('passwordError');
const verifyPasswordBtn = document.getElementById('verifyPasswordBtn');
const videoLinkInput = document.getElementById('videoLink');
const linkError = document.getElementById('linkError');
const parseButton = document.getElementById('parseButton');
const videoTitle = document.getElementById('videoTitle');
const videoType = document.getElementById('videoType');
const coverPreview = document.getElementById('coverPreview');
const downloadCoverBtn = document.getElementById('downloadCover');
const downloadVideoBtn = document.getElementById('downloadVideo');

// 当前解析结果数据
let currentParseResult = null;

// 初始化页面
function init() {
    // 默认显示密码验证界面
    passwordSection.classList.add('active');
    
    // 添加事件监听器
    verifyPasswordBtn.addEventListener('click', verifyPassword);
    parseButton.addEventListener('click', handleParse);
    downloadCoverBtn.addEventListener('click', downloadCover);
    downloadVideoBtn.addEventListener('click', downloadVideo);
    
    // 支持回车验证密码
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyPassword();
        }
    });
    
    // 支持回车解析
    videoLinkInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleParse();
        }
    });
}

// 密码验证
function verifyPassword() {
    const password = passwordInput.value.trim();
    
    if (!password) {
        showError(passwordError, '请输入密码');
        return;
    }
    
    if (password === CORRECT_PASSWORD) {
        showError(passwordError, '');
        passwordSection.classList.remove('active');
        mainSection.classList.add('active');
        passwordInput.value = '';
    } else {
        showError(passwordError, '密码错误，请重新输入');
    }
}

// 显示错误信息
function showError(element, message) {
    element.textContent = message;
}

// 处理解析请求
function handleParse() {
    const inputText = videoLinkInput.value.trim();
    
    if (!inputText) {
        showError(linkError, '请输入视频链接');
        return;
    }
    
    // 从输入文本中提取URL
    const url = extractUrl(inputText);
    
    if (!url) {
        showError(linkError, '无法提取有效链接，请检查输入格式');
        return;
    }
    
    showError(linkError, '');
    parseButton.disabled = true;
    parseButton.textContent = '解析中...';
    
    // 调用API解析
    parseVideo(url);
}

// 提取URL
function extractUrl(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
}

// 解析视频
async function parseVideo(url) {
    try {
        // 构建API请求URL
        const apiUrl = `${API_URL}?ak=${API_KEY}&link=${encodeURIComponent(url)}`;
        
        // 发送请求
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        handleParseResult(result);
    } catch (error) {
        console.error('解析失败:', error);
        // 如果API调用失败，使用模拟数据作为备用
        const mockResult = {
            code: '10000',
            msg: '成功!',
            content: {
                type: 'VIDEO',
                title: '示例视频标题',
                cover: 'https://picsum.photos/800/450',
                url: 'https://example.com/sample-video.mp4'
            }
        };
        handleParseResult(mockResult);
        showError(linkError, 'API调用失败，显示模拟数据');
    } finally {
        parseButton.disabled = false;
        parseButton.textContent = '开始解析';
    }
}

// 处理解析结果
function handleParseResult(result) {
    if (result.code === '10000' && result.content) {
        currentParseResult = result.content;
        
        // 清空之前的错误信息
        showError(linkError, '');
        
        // 显示结果
        videoTitle.textContent = result.content.title || '未获取到标题';
        
        // 根据类型显示相应的内容
        const contentType = result.content.type;
        if (contentType === 'VIDEO') {
            videoType.textContent = '视频';
            // 确保封面图片正确显示
            if (result.content.cover) {
                coverPreview.src = result.content.cover;
                coverPreview.alt = result.content.title || '视频封面';
            } else {
                // 如果没有封面，使用默认图片
                coverPreview.src = 'https://picsum.photos/800/450';
                coverPreview.alt = '默认封面';
            }
        } else if (contentType === 'IMAGE') {
            videoType.textContent = '图片';
            // 对于图集，使用第一张图片作为预览
            if (result.content.imageList && result.content.imageList.length > 0) {
                coverPreview.src = result.content.imageList[0];
            } else if (result.content.cover) {
                coverPreview.src = result.content.cover;
            } else {
                coverPreview.src = 'https://picsum.photos/800/800';
            }
            coverPreview.alt = result.content.title || '图片预览';
        } else {
            videoType.textContent = '未知类型';
            coverPreview.src = 'https://picsum.photos/800/450';
            coverPreview.alt = '预览';
        }
        
        // 监听图片加载错误，使用备用图片
        coverPreview.onerror = function() {
            this.src = 'https://picsum.photos/800/450';
            this.alt = '备用预览图';
        };
        
        // 显示结果区域
        resultSection.classList.add('active');
    } else {
        // 隐藏结果区域
        resultSection.classList.remove('active');
        currentParseResult = null;
        showError(linkError, result.msg || '解析失败，请稍后重试');
    }
}

// 下载封面
async function downloadCover() {
    if (!currentParseResult) {
        showNotification('请先解析视频', 'error');
        return;
    }
    
    let url = currentParseResult.cover;
    
    // 如果是图片类型且有imageList，使用第一张图片
    if (currentParseResult.type === 'IMAGE' && currentParseResult.imageList && currentParseResult.imageList.length > 0) {
        url = currentParseResult.imageList[0];
    }
    
    if (url) {
        // 创建文件名，使用视频标题作为前缀
        const title = currentParseResult.title ? 
            currentParseResult.title.replace(/[\/:*?"<>|]/g, '_').substring(0, 20) : 
            'cover';
        const filename = `${title}_${Date.now()}.jpg`;
        
        // 显示加载状态
        downloadCoverBtn.disabled = true;
        const originalText = downloadCoverBtn.textContent;
        downloadCoverBtn.textContent = '下载中...';
        
        try {
            await downloadFile(url, filename);
            showNotification('封面下载成功', 'success');
        } catch (error) {
            console.error('封面下载失败:', error);
            showNotification('封面下载失败，请重试', 'error');
        } finally {
            downloadCoverBtn.disabled = false;
            downloadCoverBtn.textContent = originalText;
        }
    } else {
        showNotification('没有可下载的封面', 'error');
    }
}

// 下载视频
async function downloadVideo() {
    if (!currentParseResult || !currentParseResult.url) {
        showNotification('请先解析视频', 'error');
        return;
    }
    
    // 创建文件名，使用视频标题作为前缀
    const title = currentParseResult.title ? 
        currentParseResult.title.replace(/[\/:*?"<>|]/g, '_').substring(0, 20) : 
        'video';
    const filename = `${title}_${Date.now()}.mp4`;
    
    // 显示加载状态
    downloadVideoBtn.disabled = true;
    const originalText = downloadVideoBtn.textContent;
    downloadVideoBtn.textContent = '下载中...';
    
    try {
        await downloadFile(currentParseResult.url, filename);
        showNotification('视频下载成功', 'success');
    } catch (error) {
        console.error('视频下载失败:', error);
        showNotification('视频下载失败，请重试', 'error');
        
        // 如果直接下载失败，尝试使用fetch方式
        try {
            await downloadFileWithFetch(currentParseResult.url, filename);
        } catch (fetchError) {
            console.error('备用下载方式也失败:', fetchError);
        }
    } finally {
        downloadVideoBtn.disabled = false;
        downloadVideoBtn.textContent = originalText;
    }
}

// 基本下载方法
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // 监听下载完成事件
        link.addEventListener('load', () => resolve());
        link.addEventListener('error', (e) => reject(e));
        
        document.body.appendChild(link);
        
        // 使用setTimeout确保事件监听器已注册
        setTimeout(() => {
            link.click();
            // 给浏览器足够的时间处理下载
            setTimeout(() => {
                document.body.removeChild(link);
                resolve();
            }, 100);
        }, 0);
    });
}

// 使用fetch API下载文件（备用方法）
async function downloadFileWithFetch(url, filename) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }, 100);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%) translateY(-100px)';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '8px';
    notification.style.backgroundColor = type === 'success' ? '#52c41a' : 
                                        type === 'error' ? '#ff4d4f' : '#1890ff';
    notification.style.color = 'white';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.3s ease';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = '500';
    
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // 3秒后隐藏通知
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);