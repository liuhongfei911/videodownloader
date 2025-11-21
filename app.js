// 全局变量
const CORRECT_PASSWORD = '123456';
const API_URL = 'https://api.guijianpan.com/waterRemoveDetail/xxmQsyByAk';
const API_KEY = 'b2d0603ff4cc4da48442f60d537fa28d';

// DOM元素
const passwordSection = document.getElementById('passwordSection');
const mainSection = document.getElementById('mainSection');
const passwordInput = document.getElementById('password');
const passwordError = document.getElementById('passwordError');
const verifyPasswordBtn = document.getElementById('verifyPassword');
const videoLinkInput = document.getElementById('videoLink');
const linkError = document.getElementById('linkError');
const parseButton = document.getElementById('parseButton');
const resultSection = document.getElementById('resultSection');
const videoTitle = document.getElementById('videoTitle');
const videoType = document.getElementById('videoType');
const coverPreview = document.getElementById('coverPreview');
const videoPreview = document.getElementById('videoPreview');
const videoSource = document.getElementById('videoSource');
const previewTitle = document.getElementById('previewTitle');
const downloadCoverBtn = document.getElementById('downloadCover');
const downloadVideoBtn = document.getElementById('downloadVideo');
const downloadAllBtn = document.getElementById('downloadAll');
const coverDownloadProgress = document.getElementById('coverDownloadProgress');
const videoDownloadProgress = document.getElementById('videoDownloadProgress');

// 当前解析的视频数据
let currentVideoData = null;

// 初始化事件监听
function initEventListeners() {
    // 密码验证
    verifyPasswordBtn.addEventListener('click', verifyPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyPassword();
    });
    
    // 解析按钮
    parseButton.addEventListener('click', parseVideoLink);
    videoLinkInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            parseVideoLink();
        }
    });
    
    // 下载按钮
    downloadCoverBtn.addEventListener('click', downloadCover);
    downloadVideoBtn.addEventListener('click', downloadVideo);
    downloadAllBtn.addEventListener('click', downloadAllContent);
}

// 密码验证功能
function verifyPassword() {
    const password = passwordInput.value.trim();
    
    if (password === '') {
        passwordError.textContent = '请输入密码';
        return;
    }
    
    if (password === CORRECT_PASSWORD) {
        passwordError.textContent = '';
        passwordSection.classList.remove('active');
        mainSection.classList.add('active');
        // 保存验证状态到localStorage，方便用户刷新后不需要重新输入密码
        localStorage.setItem('verified', 'true');
    } else {
        passwordError.textContent = '密码错误，请重试';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// 从文本中提取URL
function extractUrl(text) {
    // 正则表达式匹配http或https链接
    const urlRegex = /https?:\/\/[^\s"']+/g;
    const matches = text.match(urlRegex);
    
    if (matches && matches.length > 0) {
        return matches[0]; // 返回第一个匹配的URL
    }
    return null;
}

// 解析视频链接
async function parseVideoLink() {
    const inputText = videoLinkInput.value.trim();
    
    if (inputText === '') {
        linkError.textContent = '请输入视频链接';
        return;
    }
    
    // 提取URL
    const url = extractUrl(inputText);
    
    if (!url) {
        linkError.textContent = '未能从文本中提取有效的链接，请检查输入';
        return;
    }
    
    linkError.textContent = '';
    parseButton.disabled = true;
    parseButton.textContent = '解析中...';
    
    try {
        await fetchVideoData(url);
    } catch (error) {
        linkError.textContent = '解析失败：' + error.message;
        parseButton.disabled = false;
        parseButton.textContent = '开始解析';
    }
}

// 调用API获取视频数据
async function fetchVideoData(url) {
    const encodedUrl = encodeURIComponent(url);
    const fullApiUrl = `${API_URL}?ak=${API_KEY}&link=${encodedUrl}`;
    
    // 添加加载指示器
    parseButton.innerHTML = '<svg class="loading-icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="31.41592653589793 31.41592653589793" stroke-linecap="round" style="animation: rotate 1s linear infinite; opacity: 0.7;"></circle></svg> 解析中...';
    
    try {
        // 模拟网络延迟，提供更好的用户体验
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch(fullApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            // 注意：可能需要处理CORS问题
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 检查API返回的状态码
        if (data.code === '10000') {
            // 成功获取数据
            if (data.content && (data.content.url || data.content.imageList)) {
                displayVideoData(data.content);
            } else {
                throw new Error('API返回数据格式不正确，缺少必要的视频或图片信息');
            }
        } else {
            // API返回错误信息
            let errorMsg = data.msg || '解析失败，请稍后重试';
            
            // 根据不同的错误码提供更具体的提示
            if (data.code === '10001') {
                errorMsg = '链接格式不正确，请检查输入';
            } else if (data.code === '10002') {
                errorMsg = '不支持的链接类型';
            } else if (data.code === '10003') {
                errorMsg = 'API调用次数限制，请稍后再试';
            }
            
            throw new Error(errorMsg);
        }
    } catch (error) {
        // 处理不同类型的错误
        let errorMsg = error.message;
        
        // 网络错误处理
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('Network')) {
            errorMsg = '网络连接失败，请检查网络设置或稍后重试';
        } else if (errorMsg.includes('HTTP错误')) {
            errorMsg = '服务器响应错误，请稍后重试';
        }
        
        throw new Error(errorMsg);
    } finally {
        parseButton.disabled = false;
        parseButton.textContent = '开始解析';
    }
}

// 显示视频数据
function displayVideoData(data) {
    currentVideoData = data;
    
    // 更新界面
    videoTitle.textContent = data.title || '无标题';
    
    // 根据类型显示不同的描述
    if (data.type === 'VIDEO') {
        videoType.textContent = '视频';
        // 确保视频下载按钮可见
        downloadVideoBtn.querySelector('.btn-text').textContent = '下载视频';
        downloadVideoBtn.style.display = 'block';
        
        // 显示视频预览
        previewTitle.textContent = '视频预览';
        setupVideoPreview(data);
    } else if (data.type === 'IMAGE' && data.imageList) {
        videoType.textContent = `图集 (${Array.isArray(data.imageList) ? data.imageList.length : 0}张图片)`;
        // 对于图集，将下载按钮文本改为下载图片集
        downloadVideoBtn.querySelector('.btn-text').textContent = '下载图片集';
        downloadVideoBtn.style.display = 'block';
        
        // 显示封面预览
        previewTitle.textContent = '封面预览';
        setupCoverPreview(data);
    } else {
        videoType.textContent = '未知类型';
        downloadVideoBtn.style.display = 'none';
        
        // 仅显示封面预览
        previewTitle.textContent = '预览';
        setupCoverPreview(data);
    }
    
    // 确保下载按钮状态正确
    downloadCoverBtn.disabled = !data.cover;
    downloadVideoBtn.disabled = !(data.url || (data.imageList && Array.isArray(data.imageList) && data.imageList.length > 0));
    downloadAllBtn.disabled = !data.cover && !(data.url || (data.imageList && Array.isArray(data.imageList) && data.imageList.length > 0));
    
    // 重置进度条
    if (coverDownloadProgress) coverDownloadProgress.style.width = '0%';
    if (videoDownloadProgress) videoDownloadProgress.style.width = '0%';
    
    // 显示结果区域，添加动画效果
    resultSection.classList.add('active');
    
    // 重置滚动位置
    resultSection.scrollTop = 0;
    
    // 平滑滚动到结果区域
    setTimeout(() => {
        resultSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
    
    // 添加一个临时的成功提示
    showNotification('解析成功！', 'success');
}

// 设置封面预览
function setupCoverPreview(data) {
    // 隐藏视频播放器
    videoPreview.style.display = 'none';
    videoPreview.pause();
    videoSource.src = '';
    
    // 设置封面预览
    if (data.cover) {
        coverPreview.src = data.cover;
        coverPreview.alt = `${data.title || '内容'}封面`;
        coverPreview.style.display = 'block';
        
        // 添加加载状态
        coverPreview.onload = function() {
            this.style.opacity = '1';
        };
        coverPreview.style.opacity = '0.5';
    } else {
        coverPreview.style.display = 'none';
        coverPreview.src = '';
    }
}

// 设置视频预览
function setupVideoPreview(data) {
    // 重置预览状态
    resetPreviewState();
    
    // 首先设置封面预览作为视频的海报和回退选项
    if (data.cover) {
        // 使用代理或服务器转发方式加载封面，避免直接跨域访问
        coverPreview.src = data.cover;
        coverPreview.alt = `${data.title || '视频'}封面`;
        videoPreview.poster = data.cover;
        
        // 显示封面并添加加载状态
        coverPreview.style.display = 'block';
        coverPreview.onload = function() {
            this.style.opacity = '1';
        };
        coverPreview.onerror = function() {
            // 封面加载失败时显示占位图
            this.style.opacity = '0.5';
            showNotification('封面图片加载失败，显示默认图片', 'info');
        };
        coverPreview.style.opacity = '0.5';
    } else {
        coverPreview.style.display = 'none';
        coverPreview.src = '';
        videoPreview.poster = '';
    }
    
    // 如果有视频URL，尝试设置视频播放器
    if (data.url) {
        // 显示加载中状态
        previewTitle.textContent = '视频预览 - 准备中...';
        
        // 先显示封面作为预览
        coverPreview.style.display = 'block';
        videoPreview.style.display = 'none';
        
        // 添加用户交互，让用户点击后尝试加载视频
        coverPreview.style.cursor = 'pointer';
        coverPreview.onclick = function() {
            // 点击后尝试加载视频
            attemptVideoLoad(data.url);
        };
        
        // 添加提示文本
        const playOverlay = document.createElement('div');
        playOverlay.className = 'play-overlay';
        playOverlay.innerHTML = '<span>点击播放预览</span>';
        playOverlay.style.position = 'absolute';
        playOverlay.style.top = '50%';
        playOverlay.style.left = '50%';
        playOverlay.style.transform = 'translate(-50%, -50%)';
        playOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        playOverlay.style.color = 'white';
        playOverlay.style.padding = '10px 20px';
        playOverlay.style.borderRadius = '5px';
        playOverlay.style.fontSize = '16px';
        playOverlay.style.pointerEvents = 'none';
        
        // 确保有父容器可以添加覆盖层
        const coverParent = coverPreview.parentElement;
        if (coverParent) {
            coverParent.style.position = 'relative';
            // 移除已有的覆盖层
            const existingOverlay = coverParent.querySelector('.play-overlay');
            if (existingOverlay) {
                coverParent.removeChild(existingOverlay);
            }
            coverParent.appendChild(playOverlay);
        }
        
        // 显示通知，提示用户可能遇到的跨域问题
        showNotification('由于浏览器安全限制，视频预览可能受限，点击封面尝试播放', 'info');
    } else {
        // 没有视频URL，只显示封面
        videoPreview.style.display = 'none';
        videoSource.src = '';
        coverPreview.style.display = 'block';
    }
}

// 重置预览状态
function resetPreviewState() {
    // 重置视频播放器
    videoPreview.pause();
    videoSource.src = '';
    videoPreview.style.display = 'none';
    
    // 重置预览标题
    previewTitle.textContent = '视频预览';
    
    // 移除封面的点击事件
    coverPreview.style.cursor = 'default';
    coverPreview.onclick = null;
    
    // 移除播放覆盖层
    const coverParent = coverPreview.parentElement;
    if (coverParent) {
        const existingOverlay = coverParent.querySelector('.play-overlay');
        if (existingOverlay) {
            coverParent.removeChild(existingOverlay);
        }
        coverParent.style.position = 'static';
    }
}

// 尝试加载视频（添加用户交互触发，避免自动跨域加载）
function attemptVideoLoad(videoUrl) {
    // 显示加载状态
    previewTitle.textContent = '视频预览 - 加载中...';
    
    // 先隐藏封面，显示视频播放器
    coverPreview.style.display = 'none';
    videoPreview.style.display = 'block';
    
    // 设置视频源并尝试加载
    videoSource.src = videoUrl;
    
    try {
        videoPreview.load();
        
        // 添加视频加载状态处理
        videoPreview.onloadeddata = function() {
            previewTitle.textContent = '视频预览 - 已加载';
            showNotification('视频预览加载成功！', 'success');
        };
        
        videoPreview.onerror = function(e) {
            // 详细的错误处理
            handleVideoLoadError(e);
        };
        
        // 添加超时处理
        setTimeout(() => {
            if (videoPreview.readyState === 0) {
                handleVideoLoadError({ type: 'timeout' });
            }
        }, 10000); // 10秒超时
    } catch (error) {
        console.error('视频加载异常:', error);
        handleVideoLoadError({ type: 'exception' });
    }
}

// 处理视频加载错误
function handleVideoLoadError(error) {
    console.error('视频加载失败:', error);
    
    // 回退到封面预览
    previewTitle.textContent = '视频预览不可用';
    coverPreview.style.display = 'block';
    videoPreview.style.display = 'none';
    
    // 不同错误类型的处理
    let errorMessage = '';
    if (error.type === 'timeout') {
        errorMessage = '视频加载超时，请尝试直接下载';
    } else if (error.message && error.message.includes('blocked') || error.message && error.message.includes('CORS')) {
        errorMessage = '由于浏览器安全限制，无法预览视频，请直接下载';
    } else {
        errorMessage = '视频预览加载失败，请直接下载原始视频';
    }
    
    // 显示错误通知
    showNotification(errorMessage, 'error');
    
    // 禁用视频播放，确保用户知道需要下载
    downloadVideoBtn.disabled = false;
    if (downloadVideoBtn.querySelector('.btn-text')) {
        downloadVideoBtn.querySelector('.btn-text').textContent = '立即下载视频';
    }
    
    // 添加提示到封面预览
    const coverParent = coverPreview.parentElement;
    if (coverParent) {
        const errorNotice = document.createElement('div');
        errorNotice.className = 'error-notice';
        errorNotice.textContent = '预览受限，请下载';
        errorNotice.style.position = 'absolute';
        errorNotice.style.bottom = '10px';
        errorNotice.style.left = '50%';
        errorNotice.style.transform = 'translateX(-50%)';
        errorNotice.style.backgroundColor = 'rgba(255,0,0,0.8)';
        errorNotice.style.color = 'white';
        errorNotice.style.padding = '5px 15px';
        errorNotice.style.borderRadius = '3px';
        errorNotice.style.fontSize = '14px';
        
        // 移除已有的错误提示
        const existingNotice = coverParent.querySelector('.error-notice');
        if (existingNotice) {
            coverParent.removeChild(existingNotice);
        }
        coverParent.appendChild(errorNotice);
    }
}

// 下载封面
function downloadCover() {
    if (!currentVideoData || !currentVideoData.cover) {
        showNotification('没有可下载的封面', 'error');
        return;
    }
    
    const filename = `cover_${Date.now()}.jpg`;
    downloadFile(currentVideoData.cover, filename, coverDownloadProgress);
}

// 下载视频或图片集
function downloadVideo() {
    if (!currentVideoData) {
        showNotification('没有可下载的内容', 'error');
        return;
    }
    
    // 根据类型处理下载
    if (currentVideoData.type === 'VIDEO' && currentVideoData.url) {
        const filename = `video_${Date.now()}.mp4`;
        downloadFile(currentVideoData.url, filename, videoDownloadProgress);
    } else if (currentVideoData.type === 'IMAGE' && currentVideoData.imageList && Array.isArray(currentVideoData.imageList)) {
        if (currentVideoData.imageList.length === 0) {
            showNotification('图片集为空，无法下载', 'error');
            return;
        }
        
        // 如果只有一张图片，直接下载
        if (currentVideoData.imageList.length === 1) {
            const filename = `image_${Date.now()}.jpg`;
            downloadFile(currentVideoData.imageList[0], filename, videoDownloadProgress);
        } else {
            // 多张图片，使用批量下载
            showNotification(`开始下载 ${currentVideoData.imageList.length} 张图片`, 'info');
            batchDownloadImages(currentVideoData.imageList);
        }
    } else {
        showNotification('没有可下载的内容', 'error');
    }
}

// 下载全部内容（封面+视频/图片集）
function downloadAllContent() {
    if (!currentVideoData) {
        showNotification('没有可下载的内容', 'error');
        return;
    }
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const filesToDownload = [];
    
    // 添加封面
    if (currentVideoData.cover) {
        filesToDownload.push({
            url: currentVideoData.cover,
            filename: `cover_${timestamp}.${getUrlExtension(currentVideoData.cover) || 'jpg'}`
        });
    }
    
    // 添加视频
    if (currentVideoData.type === 'VIDEO' && currentVideoData.url) {
        filesToDownload.push({
            url: currentVideoData.url,
            filename: `video_${timestamp}.mp4`
        });
    }
    // 添加图片集
    else if (currentVideoData.type === 'IMAGE' && currentVideoData.imageList && Array.isArray(currentVideoData.imageList)) {
        currentVideoData.imageList.forEach((imageUrl, index) => {
            filesToDownload.push({
                url: imageUrl,
                filename: `image_${timestamp}_${index + 1}.${getUrlExtension(imageUrl) || 'jpg'}`
            });
        });
    }
    
    if (filesToDownload.length === 0) {
        showNotification('没有可下载的内容', 'error');
        return;
    }
    
    // 显示确认消息
    const confirmed = confirm(`确定要下载 ${filesToDownload.length} 个文件吗？`);
    if (!confirmed) {
        return;
    }
    
    // 禁用下载按钮
    if (downloadAllBtn) {
        downloadAllBtn.disabled = true;
        downloadAllBtn.dataset.originalText = downloadAllBtn.textContent;
        downloadAllBtn.textContent = '下载中...';
    }
    
    showNotification(`开始下载全部 ${filesToDownload.length} 个文件`, 'info');
    batchDownloadFiles(filesToDownload, () => {
        // 恢复按钮状态
        if (downloadAllBtn) {
            downloadAllBtn.disabled = false;
            downloadAllBtn.textContent = downloadAllBtn.dataset.originalText || '下载全部';
            delete downloadAllBtn.dataset.originalText;
        }
    });
}

// 批量下载图片
function batchDownloadImages(imageUrls) {
    // 显示确认消息
    const confirmed = confirm(`确定要下载 ${imageUrls.length} 张图片吗？`);
    if (!confirmed) {
        return;
    }
    
    let downloadedCount = 0;
    let failedCount = 0;
    const totalImages = imageUrls.length;
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 使用并发控制的方式下载，避免同时发起过多请求
    // 根据文件数量智能调整并发数
    const maxConcurrency = Math.min(4, Math.max(1, Math.floor(totalImages / 2)));
    const queue = [...imageUrls];
    
    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.id = 'images-progress-container';
    progressContainer.className = 'download-progress-container';
    
    // 进度条标题
    const progressTitle = document.createElement('div');
    progressTitle.textContent = '图片下载进度';
    progressTitle.className = 'progress-title';
    
    // 进度条背景
    const progressBackground = document.createElement('div');
    progressBackground.className = 'progress-background';
    
    // 进度条
    const progressBar = document.createElement('div');
    progressBar.id = 'images-progress-bar';
    progressBar.className = 'progress-bar progress-low';
    
    // 进度文本
    const progressText = document.createElement('div');
    progressText.textContent = '0/0 (0%)';
    progressText.className = 'progress-text';
    
    // 组装进度条
    progressBackground.appendChild(progressBar);
    progressContainer.appendChild(progressTitle);
    progressContainer.appendChild(progressBackground);
    progressContainer.appendChild(progressText);
    document.body.appendChild(progressContainer);
    
    function updateProgress() {
        const progress = Math.round(((downloadedCount + failedCount) / totalImages) * 100);
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${downloadedCount + failedCount}/${totalImages} (${progress}%) - 成功: ${downloadedCount}, 失败: ${failedCount}`;
        
        // 根据进度调整颜色
        progressBar.classList.remove('progress-low', 'progress-medium', 'progress-high');
        if (progress < 30) {
            progressBar.classList.add('progress-low');
        } else if (progress < 70) {
            progressBar.classList.add('progress-medium');
        } else {
            progressBar.classList.add('progress-high');
        }
    }
    
    function processNext() {
        if (queue.length === 0) {
            // 所有任务完成
            setTimeout(() => {
                if (document.body.contains(progressContainer)) {
                    document.body.removeChild(progressContainer);
                }
                showNotification(`图片下载完成：成功 ${downloadedCount} 个，失败 ${failedCount} 个`, downloadedCount > 0 ? 'success' : 'error');
            }, 500);
            return;
        }
        
        const imageUrl = queue.shift();
        const index = downloadedCount + failedCount + 1;
        const filename = `image_${timestamp}_${index}.${getUrlExtension(imageUrl) || 'jpg'}`;
        
        downloadFile(imageUrl, filename)
            .then(success => {
                if (success) {
                    downloadedCount++;
                } else {
                    failedCount++;
                }
                
                updateProgress();
                
                // 继续处理下一个（添加小延迟避免请求过于频繁）
                setTimeout(processNext, 200);
            })
            .catch(() => {
                failedCount++;
                updateProgress();
                // 失败时也继续下一个
                setTimeout(processNext, 200);
            });
    }
    
    // 启动并发下载
    for (let i = 0; i < Math.min(maxConcurrency, totalImages); i++) {
        setTimeout(() => processNext(), i * 100); // 错开启动时间
    }
}

// 批量下载文件
function batchDownloadFiles(files, onComplete = null) {
    // 添加下载确认
    if (files.length > 5) {
        const confirmDownload = window.confirm(`即将下载 ${files.length} 个文件，确定继续吗？`);
        if (!confirmDownload) {
            showNotification('下载已取消', 'info');
            return;
        }
    }
    
    let downloadedCount = 0;
    let failedCount = 0;
    let retryCount = 0;
    const maxRetries = 2; // 最大重试次数
    const totalFiles = files.length;
    
    // 使用并发控制的方式下载，根据文件数量智能调整并发数
    const maxConcurrency = Math.min(5, Math.max(1, Math.floor(totalFiles / 3)));
    const queue = [...files];
    
    // 为文件添加唯一标识符和重试计数
    const fileTasks = queue.map((file, index) => ({
        ...file,
        id: `file_${index}_${Date.now()}`,
        retriesLeft: maxRetries,
        status: 'pending',
        startTime: null,
        endTime: null,
        progressElement: null
    }));
    
    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.id = 'batch-progress-container';
    progressContainer.className = 'download-progress-container';
    
    // 进度条标题
    const progressTitle = document.createElement('div');
    progressTitle.textContent = '批量下载进度';
    progressTitle.className = 'progress-title';
    
    // 控制按钮区域
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'progress-controls';
    
    // 暂停按钮
    const pauseButton = document.createElement('button');
    pauseButton.textContent = '暂停';
    pauseButton.className = 'pause-button';
    pauseButton.addEventListener('click', togglePause);
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.className = 'close-button';
    closeButton.addEventListener('click', () => {
        if (document.body.contains(progressContainer)) {
            document.body.removeChild(progressContainer);
        }
        showNotification('下载已取消', 'info');
        if (typeof onComplete === 'function') {
            onComplete();
        }
    });
    
    controlsDiv.appendChild(pauseButton);
    controlsDiv.appendChild(closeButton);
    
    // 进度条背景
    const progressBackground = document.createElement('div');
    progressBackground.className = 'progress-background';
    
    // 进度条
    const progressBar = document.createElement('div');
    progressBar.id = 'batch-progress-bar';
    progressBar.className = 'progress-bar progress-low';
    
    // 进度文本
    const progressText = document.createElement('div');
    progressText.textContent = '0/0 (0%) - 准备中...';
    progressText.className = 'progress-text';
    
    // 文件列表标题
    const filesListTitle = document.createElement('div');
    filesListTitle.textContent = '文件状态';
    filesListTitle.className = 'files-list-title';
    
    // 文件状态容器
    const fileStatusContainer = document.createElement('div');
    fileStatusContainer.className = 'file-status-container';
    
    // 组装进度条
    progressBackground.appendChild(progressBar);
    progressContainer.appendChild(progressTitle);
    progressContainer.appendChild(controlsDiv);
    progressContainer.appendChild(progressBackground);
    progressContainer.appendChild(progressText);
    progressContainer.appendChild(filesListTitle);
    progressContainer.appendChild(fileStatusContainer);
    document.body.appendChild(progressContainer);
    
    // 暂停控制
    let isPaused = false;
    let queuedTasks = [];
    
    function togglePause() {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? '继续' : '暂停';
        
        // 使用CSS类而不是内联样式
        pauseButton.className = isPaused ? 'resume-button' : 'pause-button';
        
        // 显示通知
        showNotification(isPaused ? '下载已暂停' : '下载已恢复', 'info');
        
        if (!isPaused && queuedTasks.length > 0) {
            // 恢复暂停的任务
            queuedTasks.forEach(task => processTask(task));
            queuedTasks = [];
        }
    }
    
    // 正在下载的文件计数
    let activeDownloads = 0;
    
    // 文件任务映射
    const taskMap = new Map();
    
    function updateProgress() {
        const completedCount = downloadedCount + failedCount;
        const progress = Math.round((completedCount / totalFiles) * 100);
        progressBar.style.width = `${progress}%`;
        
        // 根据进度调整颜色
        progressBar.classList.remove('progress-low', 'progress-medium', 'progress-high');
        if (progress < 30) {
            progressBar.classList.add('progress-low');
        } else if (progress < 70) {
            progressBar.classList.add('progress-medium');
        } else {
            progressBar.classList.add('progress-high');
        }
        
        // 计算速度信息
        const now = Date.now();
        let totalDownloadedTime = 0;
        let totalCompletedFiles = 0;
        
        fileTasks.forEach(task => {
            if (task.startTime && task.endTime) {
                totalDownloadedTime += task.endTime - task.startTime;
                totalCompletedFiles++;
            }
        });
        
        let timeInfo = '';
        if (totalCompletedFiles > 0) {
            const avgTimePerFile = totalDownloadedTime / totalCompletedFiles;
            const remainingFiles = totalFiles - completedCount;
            const estimatedRemainingTime = remainingFiles * avgTimePerFile;
            
            if (estimatedRemainingTime > 0) {
                const seconds = Math.ceil(estimatedRemainingTime / 1000);
                timeInfo = seconds < 60 ? ` - 预计剩余 ${seconds} 秒` : 
                           ` - 预计剩余 ${Math.ceil(seconds / 60)} 分钟`;
            }
        }
        
        progressText.textContent = `${completedCount}/${totalFiles} (${progress}%) - 成功: ${downloadedCount}, 失败: ${failedCount}${timeInfo}`;
        

    }
    
    function addFileStatus(task) {
        // 检查任务是否已经有状态元素
        if (taskMap.has(task.id)) {
            return taskMap.get(task.id);
        }
        
        // 为每个文件创建一个状态容器
        const statusContainer = document.createElement('div');
        statusContainer.className = 'file-status-item';
        
        // 文件名
        const filenameElement = document.createElement('div');
        filenameElement.textContent = getShortFilename(task.filename);
        filenameElement.className = 'file-status-filename';
        
        // 状态文本
        const statusText = document.createElement('div');
        statusText.textContent = '等待中...';
        statusText.className = 'file-status-text';
        
        // 文件进度条背景
        const fileProgressBg = document.createElement('div');
        fileProgressBg.className = 'file-progress-background';
        
        // 文件进度条
        const fileProgressBar = document.createElement('div');
        fileProgressBar.className = 'file-progress-bar';
        
        fileProgressBg.appendChild(fileProgressBar);
        statusContainer.appendChild(filenameElement);
        statusContainer.appendChild(statusText);
        statusContainer.appendChild(fileProgressBg);
        
        // 限制显示的状态数量
        if (fileStatusContainer.children.length > 15) {
            const firstChild = fileStatusContainer.firstChild;
            if (firstChild) {
                // 获取文件名对应的任务ID
                const taskId = Array.from(taskMap.entries())
                    .find(([_, element]) => element === firstChild)?.[0];
                if (taskId) {
                    taskMap.delete(taskId);
                }
                fileStatusContainer.removeChild(firstChild);
            }
        }
        
        fileStatusContainer.appendChild(statusContainer);
        fileStatusContainer.scrollTop = fileStatusContainer.scrollHeight;
        
        // 保存进度条引用
        task.progressElement = fileProgressBar;
        
        // 保存到映射中
        taskMap.set(task.id, statusContainer);
        
        return statusContainer;
    }
    
    function updateFileStatus(task, status, progress = 0) {
        const statusContainer = taskMap.get(task.id);
        if (statusContainer) {
            // 更新状态文本
            const statusText = statusContainer.children[1];
            if (statusText) {
                statusText.textContent = status;
                
                // 根据状态设置颜色
                statusText.className = 'file-status-text';
                if (status.includes('下载中')) {
                    statusText.classList.add('info');
                } else if (status === '成功') {
                    statusText.classList.add('success');
                } else if (status.includes('失败')) {
                    statusText.classList.add('error');
                } else if (status.includes('重试')) {
                    statusText.classList.add('warning');
                }
            }
            
            // 更新进度条
            if (task.progressElement) {
                task.progressElement.style.width = `${progress}%`;
            }
        }
    }
    
    // 获取简短文件名
    function getShortFilename(filename) {
        if (filename.length <= 25) {
            return filename;
        }
        return filename.substring(0, 15) + '...' + filename.substring(filename.lastIndexOf('.'));
    }
    
    // 处理单个任务
    function processTask(task) {
        if (isPaused) {
            // 如果暂停，加入队列
            queuedTasks.push(task);
            return;
        }
        
        task.status = 'downloading';
        task.startTime = Date.now();
        
        // 添加文件状态
        addFileStatus(task);
        updateFileStatus(task, '下载中...', 0);
        
        // 为文件名添加时间戳，避免冲突
        const timestamp = new Date().getTime();
        const fileExtension = task.filename.lastIndexOf('.') !== -1 ? 
            task.filename.substring(task.filename.lastIndexOf('.')) : '';
        const baseName = task.filename.lastIndexOf('.') !== -1 ? 
            task.filename.substring(0, task.filename.lastIndexOf('.')) : task.filename;
        const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;
        
        // 创建临时进度条元素用于传递给downloadFile
        const tempProgressElement = document.createElement('div');
        
        // 监听进度更新
        Object.defineProperty(tempProgressElement, 'style', {
            get: () => ({
                width: tempProgressElement.currentWidth || '0%',
                set width(value) {
                    const progress = parseFloat(value);
                    tempProgressElement.currentWidth = value;
                    updateFileStatus(task, `下载中... ${Math.round(progress)}%`, progress);
                }
            })
        });
        
        downloadFile(task.url, uniqueFilename, tempProgressElement)
            .then(success => {
                activeDownloads--;
                task.endTime = Date.now();
                
                if (success) {
                    downloadedCount++;
                    task.status = 'success';
                    updateFileStatus(task, '成功', 100);
                } else {
                    if (task.retriesLeft > 0) {
                        // 尝试重试
                        retryCount++;
                        task.retriesLeft--;
                        task.status = 'retrying';
                        updateFileStatus(task, `重试中... (${task.retriesLeft}次剩余)`, 0);
                        
                        // 延迟重试，避免立即重试
                        setTimeout(() => {
                            processTask(task);
                        }, 1000 * (maxRetries - task.retriesLeft)); // 递增延迟
                    } else {
                        // 重试耗尽，标记为失败
                        failedCount++;
                        task.status = 'failed';
                        updateFileStatus(task, '失败', 0);
                    }
                }
                
                updateProgress();
                processQueue();
            })
            .catch(error => {
                activeDownloads--;
                task.endTime = Date.now();
                
                console.error(`下载文件失败: ${task.filename}`, error);
                
                if (task.retriesLeft > 0) {
                    // 尝试重试
                    retryCount++;
                    task.retriesLeft--;
                    task.status = 'retrying';
                    updateFileStatus(task, `重试中... (${task.retriesLeft}次剩余)`, 0);
                    
                    // 延迟重试
                    setTimeout(() => {
                        processTask(task);
                    }, 1000 * (maxRetries - task.retriesLeft));
                } else {
                    // 重试耗尽，标记为失败
                    failedCount++;
                    task.status = 'failed';
                    updateFileStatus(task, '失败', 0);
                }
                
                updateProgress();
                processQueue();
            });
    }
    
    // 处理队列
    function processQueue() {
        // 检查是否所有任务都已完成
        const completedCount = downloadedCount + failedCount;
        if (completedCount >= totalFiles && activeDownloads === 0) {
            setTimeout(() => {
                if (document.body.contains(progressContainer)) {
                    // 延迟删除以让用户看到最终状态
                    setTimeout(() => {
                        if (document.body.contains(progressContainer)) {
                            document.body.removeChild(progressContainer);
                        }
                    }, 2000);
                }
                
                let notificationType = 'success';
                let notificationMessage = `批量下载完成：成功 ${downloadedCount} 个`;
                
                if (failedCount > 0) {
                    notificationType = downloadedCount > failedCount ? 'warning' : 'error';
                    notificationMessage += `，失败 ${failedCount} 个`;
                }
                
                if (retryCount > 0) {
                    notificationMessage += `，重试 ${retryCount} 次`;
                }
                
                showNotification(notificationMessage, notificationType, 5000);
                
                // 调用完成回调
                if (typeof onComplete === 'function') {
                    onComplete({ downloadedCount, failedCount, retryCount });
                }
            }, 500);
            return;
        }
        
        // 继续处理队列中的任务，保持最大并发数
        while (activeDownloads < maxConcurrency && fileTasks.some(task => task.status === 'pending')) {
            const nextTask = fileTasks.find(task => task.status === 'pending');
            if (nextTask) {
                activeDownloads++;
                // 添加小延迟避免瞬时大量请求
                setTimeout(() => processTask(nextTask), Math.random() * 100);
            } else {
                break;
            }
        }
    }
    
    // 显示开始通知
    showNotification(`开始批量下载 ${totalFiles} 个文件`, 'info');
    
    // 启动下载队列
    processQueue();
}

// 从URL获取文件扩展名
function getUrlExtension(url) {
    try {
        const pathname = new URL(url).pathname;
        const parts = pathname.split('.');
        if (parts.length > 1) {
            const ext = parts[parts.length - 1].toLowerCase();
            // 检查是否为有效的扩展名（防止像查询参数那样的情况）
            if (ext.length <= 5 && /^[a-z0-9]+$/.test(ext)) {
                return ext;
            }
        }
    } catch (error) {
        console.error('解析URL扩展名失败:', error);
    }
    return null;
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    // 检查是否已存在通知，存在则移除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'}`;
    
    // 添加图标
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.innerHTML = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    notification.appendChild(icon);
    
    // 添加消息文本
    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);
    
    // 基础样式设置
    const style = notification.style;
    style.position = 'fixed';
    style.top = '80px';
    style.right = '20px';
    style.padding = '14px 20px';
    style.borderRadius = '8px';
    style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
    style.zIndex = '10000';
    style.opacity = '0';
    style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    style.transform = 'translateX(100%)'; // 从右侧滑入
    style.display = 'flex';
    style.alignItems = 'center';
    style.gap = '12px';
    style.fontSize = '14px';
    style.fontWeight = '500';
    style.cursor = 'pointer';
    style.userSelect = 'none';
    
    // 根据类型设置不同颜色
    if (type === 'error') {
        style.backgroundColor = '#fef2f2';
        style.color = '#b91c1c';
        style.border = '1px solid #fee2e2';
    } else if (type === 'success') {
        style.backgroundColor = '#f0fdf4';
        style.color = '#166534';
        style.border = '1px solid #dcfce7';
    } else {
        style.backgroundColor = '#f0f9ff';
        style.color = '#0c4a6e';
        style.border = '1px solid #bae6fd';
    }
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 点击通知可手动关闭
    notification.addEventListener('click', () => {
        hideNotification();
    });
    
    // 自动消失
    const autoHideTimer = setTimeout(hideNotification, duration);
    
    function hideNotification() {
        clearTimeout(autoHideTimer);
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            notification.remove();
        }, 400);
    }
}

// URL预处理函数，确保图片资源能正确触发下载
function preprocessDownloadUrl(url) {
    // 处理相对URL
    let processedUrl = url;
    
    // 如果是相对URL，转换为绝对URL
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        const baseUrl = window.location.origin + window.location.pathname;
        processedUrl = new URL(processedUrl, baseUrl).href;
    }
    
    // 确保URL编码正确
    try {
        const urlObj = new URL(processedUrl);
        
        // 对于图片URL，添加一个特殊参数以绕过浏览器默认打开行为
        if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlObj.pathname)) {
            // 添加一个时间戳参数，确保每次都是新的请求
            urlObj.searchParams.set('_dl', Date.now().toString());
            
            // 添加下载参数
            urlObj.searchParams.set('download', '1');
            
            // 对于已知的CDN或图片服务，可以添加特殊参数
            const knownImageServices = [
                'imgur.com', 'imgflip.com', 'giphy.com',
                'cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com',
                'picsum.photos', 'placehold.co', 'placekitten.com'
            ];
            
            const hostname = urlObj.hostname;
            if (knownImageServices.some(service => hostname.includes(service))) {
                urlObj.searchParams.set('force_download', 'true');
            }
        }
        
        processedUrl = urlObj.href;
    } catch (urlError) {
        console.warn('URL预处理失败，使用原始URL:', urlError);
    }
    
    return processedUrl;
}

// 清理URL中的特殊字符，确保文件名合法
function sanitizeFilename(inputFilename) {
    try {
        // 移除或替换特殊字符
        let filename = inputFilename.replace(/[<>"/\\|?*]/g, '_');
        
        // 限制文件名长度
        const maxLength = 200;
        if (filename.length > maxLength) {
            const nameParts = filename.split('.');
            if (nameParts.length > 1) {
                const extension = nameParts.pop();
                let baseName = nameParts.join('.');
                baseName = baseName.substring(0, maxLength - extension.length - 1);
                filename = `${baseName}.${extension}`;
            } else {
                filename = filename.substring(0, maxLength);
            }
        }
        
        return filename;
    } catch (error) {
        console.warn('文件名清理失败:', error);
        return `download_${Date.now()}.bin`;
    }
}

// 通用文件下载函数 - 支持进度显示和跨域处理
function downloadFile(url, filename, progressElement = null) {
    return new Promise((resolve, reject) => {
        // 应用URL预处理
        const processedUrl = preprocessDownloadUrl(url);
        
        // 设置取消控制标志
        let isCancelled = false;
        let timeoutId = null;
        
        // 根据预估文件大小调整超时时间（默认60秒，最大5分钟）
        const baseTimeout = 60000; // 基础60秒
        const maxTimeout = 300000; // 最大5分钟
        let currentTimeout = baseTimeout;
        
        // 更新超时函数
        function updateTimeout(newTimeout) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            currentTimeout = Math.min(newTimeout, maxTimeout);
            timeoutId = setTimeout(() => {
                if (!isCancelled) {
                    handleError(new Error('下载超时，请检查网络连接或文件大小'));
                }
            }, currentTimeout);
        }
        
        // 初始化超时
        updateTimeout(baseTimeout);
        
        // 取消下载的函数
        function cancelDownload() {
            isCancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // 重置进度条
            if (progressElement) {
                progressElement.style.width = '0%';
                delete progressElement.dataset.progress;
            }
            showNotification('下载已取消', 'info');
            reject(new Error('下载已取消'));
        }
        
        // 如果用户点击进度条，可以添加取消功能
        if (progressElement) {
            progressElement.style.cursor = 'pointer';
            progressElement.onclick = function(e) {
                if (e.ctrlKey || e.metaKey) {
                    // 按住Ctrl/Cmd点击取消下载
                    cancelDownload();
                }
            };
        }
        
        try {
            // 首先尝试使用CORS代理模式下载
            attemptDirectDownload()
            .catch((error) => {
                if (isCancelled) return;
                console.log('直接下载失败，尝试降级方案:', error.message);
                // 如果直接下载失败，尝试降级方案
                fallbackDownload();
            });
            
            // 尝试直接下载（使用withCredentials和自定义头部）
            function attemptDirectDownload() {
                return fetch(processedUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept-Encoding': 'identity' // 禁用压缩，避免处理gzip等格式
                    },
                    credentials: 'omit',
                    mode: 'cors', // 明确指定CORS模式
                    redirect: 'follow', // 自动跟随重定向
                    cache: 'no-cache', // 禁用缓存，确保获取最新文件
                    signal: AbortSignal.timeout(currentTimeout) // 内置的AbortSignal超时机制
                })
                .then(response => {
                    if (isCancelled) return;
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`下载失败: HTTP ${response.status} ${response.statusText}`);
                    }
                    
                    // 获取文件总大小
                    const contentLength = response.headers.get('content-length');
                    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
                    
                    // 根据文件大小调整超时时间（每MB增加5秒，但不超过最大限制）
                    if (totalBytes > 0) {
                        const estimatedTimeout = baseTimeout + (totalBytes / (1024 * 1024)) * 5000;
                        updateTimeout(estimatedTimeout);
                    }
                    
                    // 获取响应体的读取器
                    const reader = response.body.getReader();
                    const chunks = [];
                    let receivedBytes = 0;
                    let lastProgressUpdate = 0;
                    let startTime = Date.now();
                    let lastSpeedCalculation = startTime;
                    let lastReceivedBytes = 0;
                    let averageSpeed = 0;
                    
                    // 读取数据块
                    function readChunk() {
                        reader.read()
                            .then(({ done, value }) => {
                                if (isCancelled || done) {
                                    if (done) {
                                        // 所有数据读取完成
                                        const blob = new Blob(chunks);
                                        handleDownloadSuccess(blob);
                                    }
                                    return;
                                }
                                
                                // 添加数据块
                                chunks.push(value);
                                receivedBytes += value.length;
                                
                                // 优化进度条更新，避免过于频繁，300ms更新一次
                                const now = Date.now();
                                if (progressElement && totalBytes > 0 && (now - lastProgressUpdate > 300 || receivedBytes === totalBytes)) {
                                    const progress = Math.min(99, (receivedBytes / totalBytes) * 100); // 最大99%，完成时再设为100%
                                    progressElement.style.width = `${progress}%`;
                                    
                                    // 计算文件大小显示
                                    let sizeText;
                                    if (totalBytes < 1024) {
                                        sizeText = `${totalBytes} B`;
                                    } else if (totalBytes < 1024 * 1024) {
                                        sizeText = `${(totalBytes / 1024).toFixed(1)} KB`;
                                    } else if (totalBytes < 1024 * 1024 * 1024) {
                                        sizeText = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
                                    } else {
                                        sizeText = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                    }
                                    
                                    // 已下载大小
                                    let downloadedText;
                                    if (receivedBytes < 1024) {
                                        downloadedText = `${receivedBytes} B`;
                                    } else if (receivedBytes < 1024 * 1024) {
                                        downloadedText = `${(receivedBytes / 1024).toFixed(1)} KB`;
                                    } else if (receivedBytes < 1024 * 1024 * 1024) {
                                        downloadedText = `${(receivedBytes / (1024 * 1024)).toFixed(1)} MB`;
                                    } else {
                                        downloadedText = `${(receivedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                    }
                                    
                                    // 计算下载速度和剩余时间
                                    let progressText = `${Math.round(progress)}% (${downloadedText}/${sizeText})`;
                                    
                                    // 每1秒计算一次下载速度
                                    if (now - lastSpeedCalculation > 1000) {
                                        const bytesSinceLastCalc = receivedBytes - lastReceivedBytes;
                                        const speed = bytesSinceLastCalc / (now - lastSpeedCalculation) * 1000; // 字节/秒
                                        averageSpeed = averageSpeed * 0.7 + speed * 0.3; // 平滑计算
                                        
                                        lastSpeedCalculation = now;
                                        lastReceivedBytes = receivedBytes;
                                    }
                                    
                                    // 显示下载速度
                                    if (averageSpeed > 0) {
                                        let speedText;
                                        if (averageSpeed < 1024) {
                                            speedText = `${Math.round(averageSpeed)} B/s`;
                                        } else if (averageSpeed < 1024 * 1024) {
                                            speedText = `${(averageSpeed / 1024).toFixed(1)} KB/s`;
                                        } else {
                                            speedText = `${(averageSpeed / (1024 * 1024)).toFixed(1)} MB/s`;
                                        }
                                        
                                        // 计算剩余时间
                                        if (progress < 99) {
                                            const remainingBytes = totalBytes - receivedBytes;
                                            const estimatedSeconds = Math.round(remainingBytes / averageSpeed);
                                            let timeText;
                                            if (estimatedSeconds < 60) {
                                                timeText = `${estimatedSeconds}秒`;
                                            } else {
                                                const minutes = Math.floor(estimatedSeconds / 60);
                                                const seconds = estimatedSeconds % 60;
                                                timeText = `${minutes}分${seconds}秒`;
                                            }
                                            progressText += ` - ${speedText} - 剩余约${timeText}`;
                                        } else {
                                            progressText += ` - ${speedText}`;
                                        }
                                    }
                                    
                                    // 添加进度文本显示
                                    progressElement.dataset.progress = progressText;
                                    
                                    // 创建或更新进度文本元素
                                    let textElement = progressElement.parentNode.querySelector('.progress-text');
                                    if (!textElement) {
                                        textElement = document.createElement('div');
                                        textElement.className = 'progress-text';
                                        textElement.style.fontSize = '12px';
                                        textElement.style.marginTop = '5px';
                                        textElement.style.color = '#666';
                                        textElement.style.fontWeight = '500';
                                        progressElement.parentNode.appendChild(textElement);
                                    }
                                    textElement.textContent = progressText;
                                    
                                    // 根据进度改变进度条颜色和动画效果
                                    progressElement.classList.remove('progress-low', 'progress-medium', 'progress-high', 'progress-completing');
                                    if (progress < 30) {
                                        progressElement.classList.add('progress-low');
                                    } else if (progress < 70) {
                                        progressElement.classList.add('progress-medium');
                                    } else if (progress < 98) {
                                        progressElement.classList.add('progress-high');
                                    } else {
                                        progressElement.classList.add('progress-completing');
                                    }
                                    
                                    // 添加进度条脉动效果
                                    if (Math.random() > 0.8) { // 随机触发，避免所有进度条同时脉动
                                        progressElement.style.transition = 'width 0.3s ease, background-color 0.3s ease';
                                    }
                                    
                                    lastProgressUpdate = now;
                                }
                                
                                // 继续读取下一个数据块
                                readChunk();
                            })
                            .catch(error => {
                                if (isCancelled) return;
                                clearTimeout(timeoutId);
                                console.error('读取数据块失败:', error);
                                handleError(error);
                            });
                    }
                    
                    // 开始读取
                    readChunk();
                });
            }
            
            // 处理下载成功
            async function handleDownloadSuccess(blob) {
                if (isCancelled) return;
                
                try {
                    // 获取文件扩展名
                    let fileExtension = getFileExtension(filename);
                    
                    // 如果文件名没有扩展名，尝试从URL获取
                    if (!fileExtension) {
                        fileExtension = getUrlExtension(url);
                    }
                    
                    // 如果仍然没有扩展名，尝试从blob推断
                    if (!fileExtension && blob.type) {
                        fileExtension = blob.type.split('/')[1] || 'bin';
                    }
                    
                    // 确保文件名有扩展名
                    if (fileExtension && !filename.includes('.' + fileExtension)) {
                        filename += '.' + fileExtension;
                    }
                    
                    // 处理文件名中的特殊字符
                    filename = sanitizeFilename(filename);
                    
                    const blobType = getBlobType(fileExtension);
                    
                    // 创建带有正确MIME类型的blob
                    const typedBlob = new Blob([blob], { type: blobType });
                    
                    // 检查文件类型
                    const isImageFile = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
                    
                    // 创建一个强制使用二进制MIME类型的blob
                    const forcedBlob = new Blob([typedBlob], {
                        type: 'application/octet-stream; charset=binary; content-disposition=attachment'
                    });
                    
                    // 优先使用全新的强力下载方法，确保所有文件类型都直接触发下载对话框
                    const downloadSuccess = await forceDownloadWithForm(forcedBlob, filename);
                    if (downloadSuccess) {
                        cleanupAndComplete();
                        return;
                    }
                    
                    // 如果表单下载失败，对于图片文件使用特殊的强力处理
                    if (isImageFile) {
                        const imageDownloadSuccess = await downloadImageWithForce(typedBlob, filename);
                        if (imageDownloadSuccess) {
                            cleanupAndComplete();
                            return;
                        }
                    }
                    
                    // 尝试直接使用fetch API重新获取文件并强制下载
                    const fetchDownloadSuccess = await fetchAndForceDownload(url, filename);
                    if (fetchDownloadSuccess) {
                        cleanupAndComplete();
                        return;
                    }
                    
                    // 尝试降级方案：使用Blob URL和表单提交的组合
                    try {
                        const blobUrl = URL.createObjectURL(forcedBlob);
                        
                        // 创建一个隐藏的表单
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = blobUrl;
                        form.enctype = 'multipart/form-data';
                        form.style.display = 'none';
                        form.target = '_blank'; // 使用新窗口避免影响主页面
                        
                        // 添加content-disposition隐藏字段
                        const dispositionInput = document.createElement('input');
                        dispositionInput.type = 'hidden';
                        dispositionInput.name = 'content-disposition';
                        dispositionInput.value = `attachment; filename="${filename}"`;
                        form.appendChild(dispositionInput);
                        
                        document.body.appendChild(form);
                        
                        // 使用setTimeout确保浏览器有足够时间处理
                        setTimeout(() => {
                            try {
                                form.submit();
                                
                                // 清理
                                setTimeout(() => {
                                    if (document.body.contains(form)) {
                                        document.body.removeChild(form);
                                    }
                                    URL.revokeObjectURL(blobUrl);
                                }, 5000);
                                
                                cleanupAndComplete();
                                return;
                            } catch (formError) {
                                console.error('表单提交下载失败:', formError);
                                // 继续尝试其他方法
                            }
                        }, 100);
                    } catch (error) {
                        console.error('降级下载方法失败:', error);
                    }
                    
                    // 最后的备用方案：使用File System Access API
                    if ('showSaveFilePicker' in window) {
                        try {
                            const fileHandle = await window.showSaveFilePicker({
                                suggestedName: filename,
                                types: [{
                                    description: '文件',
                                    accept: {'*/*': ['.*']}
                                }]
                            });
                            
                            const writable = await fileHandle.createWritable();
                            await writable.write(forcedBlob);
                            await writable.close();
                            
                            cleanupAndComplete();
                            return;
                        } catch (fsError) {
                            console.error('文件系统API下载失败:', fsError);
                        }
                    }
                    
                    // 清理
                    function cleanupAndComplete() {
                        setTimeout(() => {
                            // 设置进度条为100%  
                            if (progressElement) {
                                progressElement.style.width = '100%';
                                progressElement.dataset.progress = '100%';
                                progressElement.style.backgroundColor = '#27ae60';
                                // 延迟重置进度条
                                setTimeout(() => {
                                    progressElement.style.width = '0%';
                                    delete progressElement.dataset.progress;
                                    progressElement.style.backgroundColor = ''; // 重置为默认颜色
                                    progressElement.onclick = null; // 移除取消事件
                                    progressElement.style.cursor = '';
                                }, 1500);
                            }
                        }, 300);
                        
                        // 显示下载成功通知
                        showNotification(`下载已开始: ${filename}`, 'success');
                        resolve(true);
                    }
                    
                    cleanupAndComplete();
                } catch (error) {
                    console.error('处理下载失败:', error);
                    handleError(error);
                }
            }
            
            // 使用表单提交技术强制下载文件（最强力的方法）
            async function forceDownloadWithForm(blob, filename) {
                return new Promise((resolve) => {
                    try {
                        // 创建FormData对象
                        const formData = new FormData();
                        
                        // 创建一个临时的iframe
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.name = 'downloadFrame';
                        document.body.appendChild(iframe);
                        
                        // 创建表单
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.target = 'downloadFrame';
                        form.style.display = 'none';
                        
                        // 使用Blob URL作为表单提交地址
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // 设置content-disposition头部信息到隐藏字段
                        const hiddenInput = document.createElement('input');
                        hiddenInput.type = 'hidden';
                        hiddenInput.name = '_download_';
                        hiddenInput.value = filename;
                        form.appendChild(hiddenInput);
                        
                        document.body.appendChild(form);
                        
                        // 创建下载链接（作为后备）
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        a.style.display = 'none';
                        a.setAttribute('type', 'application/octet-stream');
                        a.setAttribute('content-disposition', `attachment; filename="${filename}"`);
                        a.setAttribute('crossorigin', 'anonymous');
                        a.setAttribute('referrerpolicy', 'no-referrer');
                        document.body.appendChild(a);
                        
                        // 设置超时处理
                        const timeoutId = setTimeout(() => {
                            cleanup();
                            resolve(false);
                        }, 2000);
                        
                        // 清理函数
                        function cleanup() {
                            clearTimeout(timeoutId);
                            if (document.body.contains(iframe)) document.body.removeChild(iframe);
                            if (document.body.contains(form)) document.body.removeChild(form);
                            if (document.body.contains(a)) document.body.removeChild(a);
                            try { URL.revokeObjectURL(blobUrl); } catch (e) {}
                        }
                        
                        // 尝试表单提交
                        try {
                            form.submit();
                        } catch (formError) {
                            console.log('表单提交失败，尝试直接点击:', formError);
                        }
                        
                        // 同时尝试直接点击下载链接（双重保险）
                        try {
                            // 创建自定义点击事件
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                ctrlKey: false,
                                altKey: false,
                                shiftKey: false,
                                metaKey: false,
                                button: 0
                            });
                            
                            // 触发点击事件
                            a.dispatchEvent(clickEvent);
                            
                            // 对于Firefox等特殊浏览器，使用requestAnimationFrame确保异步处理
                            requestAnimationFrame(() => {
                                try {
                                    a.click();
                                } catch (clickError) {
                                    console.log('点击失败:', clickError);
                                }
                            });
                        } catch (clickError) {
                            console.error('直接点击下载失败:', clickError);
                        }
                        
                        // 短暂延迟后认为下载已启动
                        setTimeout(() => {
                            cleanup();
                            resolve(true);
                        }, 500);
                    } catch (error) {
                        console.error('表单强制下载失败:', error);
                        resolve(false);
                    }
                });
            }
            
            // 图片文件专用强力下载函数
            async function downloadImageWithForce(blob, filename) {
                return new Promise((resolve) => {
                    try {
                        // 将Blob转换为ArrayBuffer
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const arrayBuffer = reader.result;
                            
                            // 创建一个新的Blob，使用最强力的MIME类型设置
                            const forcedImageBlob = new Blob([arrayBuffer], {
                                type: 'application/octet-stream; charset=binary; content-disposition=attachment; filename="' + filename + '"'
                            });
                            
                            // 创建Blob URL
                            const imageUrl = URL.createObjectURL(forcedImageBlob);
                            
                            // 创建隐藏的iframe
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.onload = function() {
                                try {
                                    // 尝试在iframe中设置content-disposition
                                    if (iframe.contentWindow && iframe.contentDocument) {
                                        iframe.contentDocument.open();
                                        iframe.contentDocument.write('<html><body></body></html>');
                                        iframe.contentDocument.close();
                                    }
                                } catch (e) {
                                    console.log('iframe内容设置失败:', e);
                                }
                            };
                            document.body.appendChild(iframe);
                            
                            // 创建下载链接
                            const a = document.createElement('a');
                            a.href = imageUrl;
                            a.download = filename;
                            a.style.display = 'none';
                            a.setAttribute('type', 'application/octet-stream');
                            a.setAttribute('content-disposition', `attachment; filename="${filename}"`);
                            a.setAttribute('crossorigin', 'anonymous');
                            a.setAttribute('referrerpolicy', 'no-referrer');
                            document.body.appendChild(a);
                            
                            // 清理函数
                            const cleanup = () => {
                                setTimeout(() => {
                                    if (document.body.contains(iframe)) document.body.removeChild(iframe);
                                    if (document.body.contains(a)) document.body.removeChild(a);
                                    try { URL.revokeObjectURL(imageUrl); } catch (e) {}
                                }, 8000); // 延长清理时间，给浏览器足够时间处理图片下载
                            };
                            
                            // 使用setTimeout确保浏览器完全加载DOM元素
                            setTimeout(() => {
                                try {
                                    // 强制触发点击事件
                                    a.click();
                                    
                                    // 对于移动设备和某些浏览器，使用触摸事件
                                    if ('TouchEvent' in window) {
                                        const touchEvent = new TouchEvent('touchstart', {
                                            bubbles: true,
                                            cancelable: true,
                                            view: window
                                        });
                                        a.dispatchEvent(touchEvent);
                                        
                                        setTimeout(() => {
                                            const touchendEvent = new TouchEvent('touchend', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window
                                            });
                                            a.dispatchEvent(touchendEvent);
                                        }, 100);
                                    }
                                    
                                    cleanup();
                                    resolve(true);
                                } catch (clickError) {
                                    console.error('图片下载点击失败:', clickError);
                                    cleanup();
                                    resolve(false);
                                }
                            }, 100);
                        };
                        
                        reader.onerror = () => {
                            console.error('图片读取失败');
                            resolve(false);
                        };
                        
                        reader.readAsArrayBuffer(blob);
                    } catch (error) {
                        console.error('图片强力下载失败:', error);
                        resolve(false);
                    }
                });
            }
            
            // 使用fetch API重新获取并强制下载（绕过浏览器默认处理）
            async function fetchAndForceDownload(url, filename) {
                try {
                    // 重新获取文件，确保使用不同的请求头
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/octet-stream',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${filename}"`
                        },
                        credentials: 'omit',
                        mode: 'cors',
                        redirect: 'follow',
                        cache: 'no-cache'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`重新获取失败: HTTP ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    
                    // 创建强制下载的Blob
                    const forcedBlob = new Blob([blob], {
                        type: 'application/octet-stream; charset=binary'
                    });
                    
                    // 创建下载链接
                    const blobUrl = URL.createObjectURL(forcedBlob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    
                    // 使用requestAnimationFrame确保在正确的时机触发
                    requestAnimationFrame(() => {
                        try {
                            a.click();
                            
                            setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                            }, 5000);
                        } catch (clickError) {
                            console.error('重新获取后下载失败:', clickError);
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                        }
                    });
                    
                    return true;
                } catch (error) {
                    console.error('重新获取文件失败:', error);
                    return false;
                }
            }
            
            // 使用a标签下载（强制版）
            function tryDownloadWithAnchor(blob, filename) {
                try {
                    // 关键改进1: 强制设置MIME类型为application/octet-stream，确保所有浏览器都将其视为下载文件
                    const forcedBlob = new Blob([blob], { type: 'application/octet-stream' });
                    const blobUrl = URL.createObjectURL(forcedBlob);
                    const a = document.createElement('a');
                    
                    // 关键改进2: 只设置download属性，不使用target="_blank"避免在某些浏览器中打开新标签
                    a.href = blobUrl;
                    a.download = filename; // 这是强制下载的关键属性
                    a.rel = 'noopener noreferrer';
                    a.style.display = 'none';
                    
                    // 关键改进3: 添加额外的属性以增强下载行为
                    a.setAttribute('type', 'application/octet-stream');
                    a.setAttribute('download', filename); // 再次强调download属性
                    a.setAttribute('content-disposition', `attachment; filename="${filename}"`);
                    
                    // 关键改进4: IE/Edge支持
                    if (navigator.msSaveBlob) {
                        navigator.msSaveBlob(forcedBlob, filename);
                        setTimeout(() => {
                            URL.revokeObjectURL(blobUrl);
                        }, 1000);
                        return true;
                    }
                    
                    // 添加到文档
                    document.body.appendChild(a);
                    
                    // 关键改进5: 使用程序化点击，优先于事件触发
                    a.click();
                    
                    // 关键改进6: 如果普通点击不工作，尝试模拟鼠标事件
                    try {
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            button: 0,
                            ctrlKey: false,
                            metaKey: false
                        });
                        a.dispatchEvent(clickEvent);
                    } catch (e) {
                        console.log('鼠标事件模拟失败，使用备用方法');
                    }
                    
                    // 关键改进7: 延迟清理，确保下载过程有足够时间完成
                    setTimeout(() => {
                        if (document.body.contains(a)) {
                            document.body.removeChild(a);
                        }
                        URL.revokeObjectURL(blobUrl);
                    }, 3000); // 增加到3秒，确保下载有足够时间
                    
                    return true;
                } catch (error) {
                    console.error('Anchor下载失败:', error);
                    return false;
                }
            }
            
            // 使用File System Access API下载（现代浏览器，优先使用）
            async function tryFileSystemDownload(blob, filename) {
                try {
                    // 先检查权限
                    if (window.showSaveFilePicker) {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: filename,
                            types: [{
                                description: '文件',
                                accept: { '*/*': [] }
                            }]
                        });
                        
                        const writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                        
                        return true;
                    }
                    return false;
                } catch (error) {
                    // 用户取消选择不算错误
                    if (error.name === 'AbortError' || error.name === 'UserCanceledError') {
                        console.log('用户取消了文件保存');
                    } else {
                        console.error('File System Access API下载失败:', error);
                    }
                    return false;
                }
            }
            
            // 强制使用iframe下载（用于确保直接下载而不是导航）
            function attemptForceDownloadWithIframe(blob, filename) {
                try {
                    // 关键改进1: 强制使用application/octet-stream MIME类型
                    const forcedBlob = new Blob([blob], { type: 'application/octet-stream' });
                    const blobUrl = URL.createObjectURL(forcedBlob);
                    
                    // 关键改进2: 创建临时表单提交下载，这是最可靠的强制下载方式
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = blobUrl;
                    form.style.display = 'none';
                    
                    // 添加content-disposition隐藏字段
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = 'Content-Disposition';
                    hiddenField.value = `attachment; filename="${filename}"`;
                    form.appendChild(hiddenField);
                    
                    // 添加到文档并提交
                    document.body.appendChild(form);
                    form.submit();
                    
                    // 清理表单
                    setTimeout(() => {
                        if (document.body.contains(form)) {
                            document.body.removeChild(form);
                        }
                        URL.revokeObjectURL(blobUrl);
                    }, 3000);
                    
                    // 如果表单提交失败，回退到iframe方法
                    setTimeout(() => {
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.style.width = '0';
                        iframe.style.height = '0';
                        iframe.style.border = 'none';
                        
                        // 设置sandbox允许下载
                        iframe.sandbox = 'allow-downloads allow-same-origin';
                        
                        // 添加事件处理
                        iframe.onload = iframe.onerror = function() {
                            setTimeout(() => {
                                if (document.body.contains(iframe)) {
                                    document.body.removeChild(iframe);
                                }
                            }, 1000);
                        };
                        
                        // 设置src
                        iframe.src = blobUrl;
                        document.body.appendChild(iframe);
                    }, 500);
                    
                    return true;
                } catch (error) {
                    console.error('强制iframe下载失败:', error);
                    return false;
                }
            }
            
            // 降级下载方案 - 增强版
            function fallbackDownload() {
                if (isCancelled) return;
                
                clearTimeout(timeoutId);
                
                // 创建一个隐藏的下载按钮
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = '点击下载';
                downloadBtn.style.display = 'none';
                downloadBtn.onclick = function() {
                    // 尝试多种下载方式，按优先级顺序
                    const downloadAttempts = [
                        attemptNewTabDownload,
                        attemptIframeDownload,
                        attemptCopyToClipboard
                    ];
                    
                    let currentAttempt = 0;
                    
                    function tryNextMethod() {
                        if (isCancelled || currentAttempt >= downloadAttempts.length) {
                            if (!isCancelled) {
                                // 所有方法都失败了
                                const linkText = url.length > 50 ? url.substring(0, 50) + '...' : url;
                                showNotification(`所有下载方法都失败了，请手动复制链接下载\n${linkText}`, 'error', 15000);
                                
                                // 显示一个可复制的链接元素
                                showCopyableLink(url, filename);
                            }
                            resolve(false);
                            return;
                        }
                        
                        const method = downloadAttempts[currentAttempt];
                        currentAttempt++;
                        
                        try {
                            method()
                                .then(success => {
                                    if (isCancelled) return;
                                    if (success) {
                                        resolve(true);
                                    } else {
                                        // 方法返回false，表示需要尝试下一个方法
                                        tryNextMethod();
                                    }
                                })
                                .catch(() => {
                                    if (isCancelled) return;
                                    // 方法抛出异常，尝试下一个方法
                                    tryNextMethod();
                                });
                        } catch (error) {
                            if (isCancelled) return;
                            console.error(`下载方法 ${currentAttempt} 失败:`, error);
                            tryNextMethod();
                        }
                    }
                    
                    // 方案1: 直接打开新标签
                    function attemptNewTabDownload() {
                        return new Promise((resolve) => {
                            if (isCancelled) {
                                resolve(false);
                                return;
                            }
                            
                            try {
                                // 检查弹窗阻止器
                                const newTab = window.open('', '_blank');
                                if (!newTab) {
                                    showNotification('弹窗阻止器阻止了下载，请允许弹窗并重试', 'warning');
                                    resolve(false);
                                    return;
                                }
                                
                                // 延迟设置URL以避免某些浏览器的弹窗阻止
                                setTimeout(() => {
                                    if (isCancelled) {
                                        newTab.close();
                                        resolve(false);
                                        return;
                                    }
                                    
                                    newTab.location.href = url;
                                    showNotification('正在新标签页中打开下载链接...', 'info');
                                    
                                    // 检查标签页是否成功打开并可能下载文件
                                    setTimeout(() => {
                                        if (isCancelled) {
                                            resolve(false);
                                            return;
                                        }
                                        
                                        try {
                                            if (newTab.closed) {
                                                // 标签页已关闭，可能下载成功
                                                resolve(true);
                                            } else {
                                                // 如果标签页仍然打开，可能需要用户手动保存
                                                showNotification('请在新标签页中手动保存文件', 'info');
                                                // 不返回true，继续尝试其他方法
                                                setTimeout(() => {
                                                    if (!isCancelled) tryNextMethod();
                                                }, 2000);
                                            }
                                        } catch (e) {
                                            // 跨域安全限制可能阻止访问newTab.closed
                                            console.warn('无法检查标签页状态，继续尝试其他方法');
                                            setTimeout(() => {
                                                if (!isCancelled) tryNextMethod();
                                            }, 2000);
                                        }
                                    }, 3000);
                                }, 100);
                            } catch (error) {
                                console.error('新标签页下载失败:', error);
                                resolve(false);
                            }
                        });
                    }
                    
                    // 方案2: 使用iframe
                    function attemptIframeDownload() {
                        return new Promise((resolve) => {
                            if (isCancelled) {
                                resolve(false);
                                return;
                            }
                            
                            try {
                                const iframe = document.createElement('iframe');
                                iframe.style.display = 'none';
                                iframe.sandbox = 'allow-downloads allow-same-origin'; // 添加sandbox属性以增强安全性
                                iframe.src = url;
                                
                                // 设置多种事件监听器
                                iframe.onload = function() {
                                    if (isCancelled) {
                                        cleanup();
                                        resolve(false);
                                        return;
                                    }
                                    showNotification('尝试通过iframe下载...', 'info');
                                    resolve(true);
                                    setTimeout(cleanup, 5000);
                                };
                                
                                iframe.onerror = function() {
                                    console.error('Iframe加载失败');
                                    cleanup();
                                    resolve(false);
                                };
                                
                                // 监听可能的下载完成事件
                                const downloadCheckInterval = setInterval(() => {
                                    if (isCancelled) {
                                        clearInterval(downloadCheckInterval);
                                        cleanup();
                                        resolve(false);
                                        return;
                                    }
                                    // 这里可以添加一些检查逻辑，但iframe下载很难精确检测完成
                                }, 2000);
                                
                                function cleanup() {
                                    clearInterval(downloadCheckInterval);
                                    if (document.body.contains(iframe)) {
                                        document.body.removeChild(iframe);
                                    }
                                }
                                
                                document.body.appendChild(iframe);
                                
                                // 设置超时删除iframe
                                setTimeout(() => {
                                    cleanup();
                                }, 15000);
                                
                            } catch (iframeError) {
                                console.error('Iframe下载失败:', iframeError);
                                resolve(false);
                            }
                        });
                    }
                    
                    // 方案3: 复制链接到剪贴板
                    function attemptCopyToClipboard() {
                        return new Promise((resolve) => {
                            if (isCancelled) {
                                resolve(false);
                                return;
                            }
                            
                            try {
                                // 现代方法
                                if (navigator.clipboard && window.isSecureContext) {
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            if (isCancelled) {
                                                resolve(false);
                                                return;
                                            }
                                            showNotification(`下载失败，链接已复制到剪贴板，请手动粘贴并下载`, 'warning', 8000);
                                            resolve(true);
                                        })
                                        .catch(() => {
                                            if (isCancelled) {
                                                resolve(false);
                                                return;
                                            }
                                            // 降级到传统方法
                                            fallbackCopyToClipboard();
                                        });
                                } else {
                                    // 不支持现代剪贴板API，使用传统方法
                                    fallbackCopyToClipboard();
                                }
                            } catch (clipboardError) {
                                console.error('剪贴板操作失败:', clipboardError);
                                const linkText = url.length > 50 ? url.substring(0, 50) + '...' : url;
                                showNotification(`下载失败，请手动复制链接下载\n${linkText}`, 'error', 15000);
                                resolve(false);
                            }
                            
                            function fallbackCopyToClipboard() {
                                // 创建临时文本区域
                                const textArea = document.createElement('textarea');
                                textArea.value = url;
                                textArea.style.position = 'fixed';
                                textArea.style.left = '-999999px';
                                textArea.style.top = '-999999px';
                                textArea.setAttribute('readonly', ''); // 防止移动设备上弹出键盘
                                
                                try {
                                    document.body.appendChild(textArea);
                                    
                                    // 选择文本
                                    textArea.focus();
                                    textArea.select();
                                    
                                    // 对于移动设备的兼容性处理
                                    if (navigator.userAgent.match(/ipad|iphone|android/i)) {
                                        const range = document.createRange();
                                        range.selectNodeContents(textArea);
                                        const selection = window.getSelection();
                                        selection.removeAllRanges();
                                        selection.addRange(range);
                                    }
                                    
                                    // 使用传统的execCommand方法
                                    const success = document.execCommand('copy');
                                    
                                    if (success) {
                                        showNotification(`下载失败，链接已复制到剪贴板，请手动粘贴并下载`, 'warning', 8000);
                                        resolve(true);
                                    } else {
                                        throw new Error('execCommand copy failed');
                                    }
                                } catch (err) {
                                    console.error('传统剪贴板方法失败:', err);
                                    const linkText = url.length > 50 ? url.substring(0, 50) + '...' : url;
                                    showNotification(`下载失败，请手动复制链接下载\n${linkText}`, 'error', 15000);
                                    
                                    // 显示可复制的链接元素作为最后手段
                                    showCopyableLink(url, filename);
                                    
                                    resolve(false);
                                } finally {
                                    if (document.body.contains(textArea)) {
                                        document.body.removeChild(textArea);
                                    }
                                    // 清除选择
                                    window.getSelection().removeAllRanges();
                                }
                            }
                        });
                    }
                    
                    // 显示可复制的链接元素
                    function showCopyableLink(linkUrl, displayFilename) {
                        // 创建一个可复制的链接元素
                        const linkContainer = document.createElement('div');
                        linkContainer.style.cssText = `
                            position: fixed;
                            bottom: 20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: #333;
                            color: white;
                            padding: 15px;
                            border-radius: 5px;
                            z-index: 9999;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            max-width: 90%;
                            word-break: break-all;
                        `;
                        
                        const linkText = document.createElement('span');
                        linkText.textContent = `下载 ${displayFilename} 的链接:`;
                        linkText.style.marginRight = '10px';
                        
                        const urlSpan = document.createElement('span');
                        urlSpan.textContent = linkUrl;
                        urlSpan.style.flex = '1';
                        urlSpan.style.overflow = 'hidden';
                        urlSpan.style.textOverflow = 'ellipsis';
                        urlSpan.style.whiteSpace = 'nowrap';
                        
                        const copyBtn = document.createElement('button');
                        copyBtn.textContent = '复制';
                        copyBtn.style.backgroundColor = '#4CAF50';
                        copyBtn.style.color = white;
                        copyBtn.style.border = 'none';
                        copyBtn.style.padding = '5px 15px';
                        copyBtn.style.borderRadius = '3px';
                        copyBtn.style.cursor = 'pointer';
                        
                        copyBtn.onclick = function() {
                            navigator.clipboard.writeText(linkUrl).then(() => {
                                copyBtn.textContent = '已复制!';
                                copyBtn.style.backgroundColor = '#2196F3';
                                setTimeout(() => {
                                    if (document.body.contains(linkContainer)) {
                                        document.body.removeChild(linkContainer);
                                    }
                                }, 2000);
                            }).catch(() => {
                                showNotification('复制失败，请手动选择并复制链接', 'error');
                            });
                        };
                        
                        const closeBtn = document.createElement('button');
                        closeBtn.textContent = '关闭';
                        closeBtn.style.backgroundColor = '#f44336';
                        closeBtn.style.color = white;
                        closeBtn.style.border = 'none';
                        closeBtn.style.padding = '5px 10px';
                        closeBtn.style.borderRadius = '3px';
                        closeBtn.style.cursor = 'pointer';
                        
                        closeBtn.onclick = function() {
                            if (document.body.contains(linkContainer)) {
                                document.body.removeChild(linkContainer);
                            }
                        };
                        
                        linkContainer.appendChild(linkText);
                        linkContainer.appendChild(urlSpan);
                        linkContainer.appendChild(copyBtn);
                        linkContainer.appendChild(closeBtn);
                        
                        document.body.appendChild(linkContainer);
                        
                        // 30秒后自动关闭
                        setTimeout(() => {
                            if (document.body.contains(linkContainer)) {
                                document.body.removeChild(linkContainer);
                            }
                        }, 30000);
                    }
                    
                    // 开始尝试下载方法
                    tryNextMethod();
                };
                
                // 添加到页面并触发点击
                document.body.appendChild(downloadBtn);
                setTimeout(() => {
                    if (!isCancelled) {
                        downloadBtn.click();
                        // 延迟删除按钮，确保事件执行完成
                        setTimeout(() => {
                            if (document.body.contains(downloadBtn)) {
                                document.body.removeChild(downloadBtn);
                            }
                        }, 500);
                    }
                }, 100);
            }
            
            // 统一错误处理
            function handleError(error) {
                if (isCancelled) return;
                
                clearTimeout(timeoutId);
                console.error('下载错误:', error);
                
                // 重置进度条
                if (progressElement) {
                    progressElement.style.width = '0%';
                    delete progressElement.dataset.progress;
                    progressElement.style.backgroundColor = ''; // 重置为默认颜色
                    progressElement.onclick = null; // 移除取消事件
                    progressElement.style.cursor = '';
                }
                
                // 显示详细错误信息
                let errorMessage = '下载失败';
                let errorType = 'error';
                
                // 更详细的错误类型区分
                if (error.name === 'AbortError' || error.message.includes('timeout')) {
                    errorMessage = '下载超时，请检查网络连接或尝试较小的文件';
                } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                    errorMessage = '跨域限制，请尝试其他下载方式';
                    errorType = 'warning';
                } else if (error.message.includes('403')) {
                    errorMessage = '服务器拒绝访问，可能需要权限';
                } else if (error.message.includes('404')) {
                    errorMessage = '文件不存在或已被删除';
                } else if (error.message.includes('429')) {
                    errorMessage = '请求过于频繁，请稍后重试';
                    errorType = 'warning';
                } else if (error.message.includes('50')) {
                    errorMessage = '服务器错误，请稍后重试';
                    errorType = 'warning';
                } else if (navigator.onLine === false) {
                    errorMessage = '网络连接已断开';
                }
                
                // 显示错误通知
                showNotification(`${errorMessage}`, errorType, 8000);
                
                // 尝试降级下载
                fallbackDownload();
            }
            
            // 清理文件名中的特殊字符
            function sanitizeFilename(filename) {
                // 移除或替换可能导致问题的字符
                return filename
                    .replace(/[<>"/\\|?*]/g, '_') // 替换Windows不允许的字符
                    .replace(/^\.|\.$/g, '_') // 替换开头或结尾的点
                    .replace(/[\s]+/g, ' ') // 标准化空格
                    .trim() // 去除首尾空格
                    .substring(0, 255); // 限制长度
            }
            
            // 获取文件扩展名
            function getFileExtension(filename) {
                const parts = filename.split('.');
                return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
            }
            
            // 根据扩展名获取MIME类型
            function getBlobType(extension) {
                const mimeTypes = {
                    // 图片格式
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'bmp': 'image/bmp',
                    'svg': 'image/svg+xml',
                    'ico': 'image/x-icon',
                    
                    // 视频格式
                    'mp4': 'video/mp4',
                    'webm': 'video/webm',
                    'avi': 'video/x-msvideo',
                    'mov': 'video/quicktime',
                    'wmv': 'video/x-ms-wmv',
                    'flv': 'video/x-flv',
                    'mkv': 'video/x-matroska',
                    
                    // 音频格式
                    'mp3': 'audio/mpeg',
                    'wav': 'audio/wav',
                    'ogg': 'audio/ogg',
                    'flac': 'audio/flac',
                    'aac': 'audio/aac',
                    'm4a': 'audio/mp4',
                    
                    // 文档格式
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'xls': 'application/vnd.ms-excel',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'ppt': 'application/vnd.ms-powerpoint',
                    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'txt': 'text/plain',
                    'html': 'text/html',
                    'css': 'text/css',
                    'js': 'application/javascript',
                    'json': 'application/json',
                    'xml': 'application/xml',
                    
                    // 压缩文件
                    'zip': 'application/zip',
                    'rar': 'application/x-rar-compressed',
                    '7z': 'application/x-7z-compressed',
                    'tar': 'application/x-tar',
                    'gz': 'application/gzip',
                    
                    // 其他常见格式
                    'exe': 'application/x-msdownload',
                    'dmg': 'application/x-apple-diskimage',
                    'apk': 'application/vnd.android.package-archive',
                    'iso': 'application/x-iso9660-image',
                    'bin': 'application/octet-stream'
                };
                return mimeTypes[extension] || 'application/octet-stream';
            }
        } catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            console.error('下载过程出错:', error);
            
            // 重置进度条
            if (progressElement) {
                progressElement.style.width = '0%';
                delete progressElement.dataset.progress;
            }
            
            showNotification('下载初始化失败，请稍后重试', 'error');
            reject(error);
        }
    });
}

// 检查用户是否已验证
function checkVerificationStatus() {
    if (localStorage.getItem('verified') === 'true') {
        passwordSection.classList.remove('active');
        mainSection.classList.add('active');
    }
}

// 页面加载时执行
window.addEventListener('DOMContentLoaded', () => {
    checkVerificationStatus();
    initEventListeners();
});