
/**
 * FILE MỚI: gemini_analysis.js
 * =============================
 * Version Final (Major Overhaul):
 * - Sửa lỗi không lấy được thông tin chi tiết (Chẩn đoán vào, ICD, thuốc, DVKT).
 * - Nâng cấp giao diện modal to hơn, chuyên nghiệp hơn.
 * - Thêm bộ lọc theo ngày để dễ dàng chọn hồ sơ.
 * - Thêm khu vực xem trước chi tiết hồ sơ trước khi phân tích.
 * - Thêm hướng dẫn lấy API Key.
 * - Thêm nút bật/tắt chế độ toàn màn hình.
 * - Nâng cấp prompt AI để cho ra kết quả phân tích chất lượng hơn.
 */

// Global helper function
const escapeBasicHtml = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Gemini Analysis feature (Major Overhaul) loaded.");

    // ===================================================================
    // BƯỚC 1: TIÊM CSS
    // ===================================================================
    const aiStyles = `
        .tab-button.has-dropdown { position: relative; }
        .ai-dropdown-content { display: none; position: absolute; top: 100%; left: 0; background-color: #f1f1f1; min-width: 100%; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1002; border-radius: 0 0 8px 8px; overflow: hidden; animation: fadeIn 0.3s ease-out; }
        .tab-button.has-dropdown:hover .ai-dropdown-content { display: block; }
        .ai-dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; text-align: left; font-size: 0.95em; }
        .ai-dropdown-content a:hover { background-color: #ddd; }
        body.dark .tab-button.has-dropdown .ai-dropdown-content { background-color: #1f2937; }
        body.dark .ai-dropdown-content a { color: #e5e7eb; }
        body.dark .ai-dropdown-content a:hover { background-color: #374151; }

        .ai-modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px); align-items: center; justify-content: center; }
        .ai-modal.show { display: flex; }
        .ai-modal-content { background-color: #fefefe; margin: auto; padding: 0; border: 1px solid #888; width: 90%; max-width: 1100px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: fadeInScale 0.4s ease-out; display: flex; flex-direction: column; max-height: 90vh; }
        body.dark .ai-modal-content { background: #0f172a; border-color: #374151; }
        .ai-modal-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        body.dark .ai-modal-header { border-bottom-color: #374151; }
        .ai-modal-header h2 { margin: 0; font-size: 1.5em; }
        .ai-modal-body { padding: 25px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
        .ai-modal-footer { padding: 20px; border-top: 1px solid #eee; text-align: right; }
        body.dark .ai-modal-footer { border-top-color: #374151; }
        
        .searchable-select-container { position: relative; }
        .searchable-select-input { width: 100%; cursor: pointer; }
        .searchable-select-options { display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 8px; background: white; z-index: 2001; }
        .searchable-select-options.show { display: block; }
        .searchable-select-options div { padding: 10px; cursor: pointer; }
        .searchable-select-options div:hover { background-color: #f0f0f0; }
        body.dark .searchable-select-options { background: #1f2937; border-color: #374151; }
        body.dark .searchable-select-options div:hover { background-color: #374151; }

        #aiAnalysisResult { font-size: 14px; line-height: 1.6; }
        #aiAnalysisResult h1 { font-size: 1.8em; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
        #aiAnalysisResult h2 { font-size: 1.4em; color: #3498db; margin-top: 25px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
        #aiAnalysisResult table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.95em; }
        #aiAnalysisResult th, #aiAnalysisResult td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        #aiAnalysisResult th { background-color: #f2f2f2; font-weight: bold; }
        #aiAnalysisResult pre { background-color: #f0f0f0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.9em; }
        body.dark #aiAnalysisResult h1 { color: #e5e7eb; border-bottom-color: #4f46e5; }
        body.dark #aiAnalysisResult h2 { color: #818cf8; border-bottom-color: #374151; }
        body.dark #aiAnalysisResult th { background-color: #2c3a4b; border-color: #374151; }
        body.dark #aiAnalysisResult td { border-color: #374151; }
        body.dark #aiAnalysisResult pre { background-color: #111827; border-color: #374151; }

        #aiPreviewContainer { margin-top: 20px; padding: 20px; border: 1px solid #e1e8ed; border-radius: 10px; background-color: #f8f9ff; display: none; }
        body.dark #aiPreviewContainer { background-color: #111827; border-color: #374151; }
        .preview-section h3 { font-size: 1.3em; color: #3498db; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dee2e6; display: flex; align-items: center; gap: 8px; }
        body.dark .preview-section h3 { border-bottom-color: #374151; }
        .preview-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px 25px; font-size: 1em; }
        .preview-info-grid div { display: flex; }
        .preview-info-grid div > span:first-child { font-weight: 600; color: #6c757d; margin-right: 8px; flex-shrink: 0; }
        body.dark .preview-info-grid div > span:first-child { color: #9ca3af; }
        .preview-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .preview-table th, .preview-table td { border: 1px solid #dee2e6; padding: 10px; text-align: left; font-size: 0.95em; }
        .preview-table th { background-color: #e9ecef; }
        body.dark .preview-table th, body.dark .preview-table td { border-color: #374151; }
        body.dark .preview-table th { background-color: #2c3a4b; }
        .api-key-help { display: flex; justify-content: space-between; align-items: center; } .api-key-howto-link { font-size: 0.9em; color: #3498db; cursor: pointer; text-decoration: none; } .api-key-howto-link:hover { text-decoration: underline; } .howto-modal-content { max-width: 700px; } .howto-modal-body ol { padding-left: 25px; } .howto-modal-body li { margin-bottom: 15px; line-height: 1.6; } .howto-modal-body code { background-color: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: monospace; } body.dark .howto-modal-body code { background-color: #374151; } .howto-modal-body img { max-width: 100%; border-radius: 8px; border: 1px solid #dee2e6; margin-top: 10px; } body.dark .howto-modal-body img { border-color: #374151; }
        .fullscreen-btn { background: none; border: none; cursor: pointer; font-size: 1.5em; color: #6c757d; padding: 5px; line-height: 1; transition: color 0.2s ease, transform 0.2s ease; } .fullscreen-btn:hover { color: #2c3e50; transform: scale(1.1); } body.dark .fullscreen-btn { color: #9ca3af; } body.dark .fullscreen-btn:hover { color: #e5e7eb; }
        .ai-modal-content.fullscreen { width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; border-radius: 0; }
        .ai-modal-body .filter-row { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; align-items: end; }
        @media (max-width: 768px) { .ai-modal-body .filter-row { grid-template-columns: 1fr; } }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = aiStyles;
    document.head.appendChild(styleSheet);

    // ===================================================================
    // BƯỚC 2: TIÊM HTML
    // ===================================================================
    const validatorTabButton = document.querySelector("button[onclick*=\"'validatorTab'\"]"); if (validatorTabButton) { validatorTabButton.classList.add('has-dropdown'); validatorTabButton.innerHTML = `<span>📋 Kiểm tra XML</span><div class="ai-dropdown-content"><a href="#" id="openAiAnalysisModal">Xem chi tiết hồ sơ 🤖</a></div>`; }
    const aiModalHTML = `<div id="aiAnalysisModal" class="ai-modal"><div class="ai-modal-content"><div class="ai-modal-header"><h2>Xem chi tiết Hồ sơ</h2><button id="fullscreenBtn" class="fullscreen-btn" title="Toàn màn hình">⛶</button></div><div class="ai-modal-body"><div class="filter-row"><div class="filter-group"><label for="aiDateFilter">1. Chọn ngày vào viện:</label><input type="date" id="aiDateFilter" class="filter-input"></div><div class="filter-group"><label for="patientSearchInput">2. Chọn hoặc tìm hồ sơ:</label><div class="searchable-select-container"><input type="text" id="patientSearchInput" class="filter-input searchable-select-input" placeholder="-- Vui lòng chọn ngày trước --" disabled><div id="patientOptions" class="searchable-select-options"></div></div><input type="hidden" id="patientSelectorValue"></div></div><div class="filter-group"><div class="api-key-help"><label for="apiKeyInput">3. Nhập Gemini API Key:</label><a href="#" id="showApiKeyHowTo" class="api-key-howto-link">Hướng dẫn lấy API Key?</a></div><input type="password" id="apiKeyInput" class="filter-input" placeholder="Dán API Key vào đây"></div><div id="aiPreviewContainer"></div><div class="loading" id="aiLoading"><div class="spinner"></div><p>AI đang phân tích hồ sơ...</p></div><div id="aiAnalysisResult"><p>Kết quả phân tích sẽ được hiển thị tại đây.</p></div></div><div class="ai-modal-footer"><button id="closeAiModalButton" class="btn btn-warning">Đóng</button><button id="downloadHtmlButton" class="btn btn-success" style="display: none;">📥 Tải HTML</button><button id="analyzeWithAiButton" class="btn btn-primary" disabled>🚀 Bắt đầu phân tích</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', aiModalHTML);
    const howtoModalHTML = `<div id="apiKeyHowtoModal" class="ai-modal"><div class="ai-modal-content howto-modal-content"><div class="ai-modal-header"><h2>Hướng Dẫn Lấy Gemini API Key</h2></div><div class="ai-modal-body howto-modal-body"><ol><li>Truy cập trang <b><a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a></b> và đăng nhập bằng tài khoản Google của bạn.</li><li>Nhấn vào nút <code>Create API key</code>.<img src="https://i.imgur.com/vH2w3Ab.png" alt="Bước 2"></li><li>Chọn <code>Create API key in new project</code>.<img src="https://i.imgur.com/k2YwX2s.png" alt="Bước 3"></li><li>Một cửa sổ sẽ hiện ra chứa API Key của bạn. Nhấn vào biểu tượng sao chép.<img src="https://i.imgur.com/YxV5n22.png" alt="Bước 4"></li><li>Quay lại đây và dán Key đã sao chép vào ô nhập liệu.</li></ol></div><div class="ai-modal-footer"><button id="closeHowtoModalButton" class="btn btn-primary">Đã hiểu</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', howtoModalHTML);

    // ===================================================================
    // BƯỚC 3: LOGIC VÀ SỰ KIỆN
    // ===================================================================
    const openAiModalButton = document.getElementById('openAiAnalysisModal'); const aiModal = document.getElementById('aiAnalysisModal'); const closeAiModalButton = document.getElementById('closeAiModalButton'); const patientSearchInput = document.getElementById('patientSearchInput'); const patientOptionsContainer = document.getElementById('patientOptions'); const patientSelectorValue = document.getElementById('patientSelectorValue'); const analyzeButton = document.getElementById('analyzeWithAiButton'); const apiKeyInput = document.getElementById('apiKeyInput'); const aiResultDiv = document.getElementById('aiAnalysisResult'); const aiLoading = document.getElementById('aiLoading'); const downloadHtmlButton = document.getElementById('downloadHtmlButton'); const aiPreviewContainer = document.getElementById('aiPreviewContainer');
    const aiDateFilter = document.getElementById('aiDateFilter');
    let currentAnalysisResult = { html: '', patient: null };

    openAiModalButton.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); populateDateFilter(); aiModal.classList.add('show'); });
    closeAiModalButton.addEventListener('click', () => aiModal.classList.remove('show'));
    aiModal.addEventListener('click', (e) => { if (e.target === aiModal) { aiModal.classList.remove('show'); } });
    const showHowtoButton = document.getElementById('showApiKeyHowTo'); const howtoModal = document.getElementById('apiKeyHowtoModal'); const closeHowtoButton = document.getElementById('closeHowtoModalButton'); showHowtoButton.addEventListener('click', (e) => { e.preventDefault(); howtoModal.classList.add('show'); }); closeHowtoButton.addEventListener('click', () => howtoModal.classList.remove('show')); howtoModal.addEventListener('click', (e) => { if (e.target === howtoModal) { howtoModal.classList.remove('show'); } });
    const fullscreenBtn = document.getElementById('fullscreenBtn'); const aiModalContent = aiModal.querySelector('.ai-modal-content'); fullscreenBtn.addEventListener('click', () => { if (!document.fullscreenElement) { aiModalContent.requestFullscreen().catch(err => { alert(`Lỗi khi bật chế độ toàn màn hình: ${err.message}`); }); } else { document.exitFullscreen(); } });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) { aiModalContent.classList.remove('fullscreen'); fullscreenBtn.innerHTML = '⛶'; fullscreenBtn.title = 'Toàn màn hình'; } else { aiModalContent.classList.add('fullscreen'); fullscreenBtn.innerHTML = '⛶'; fullscreenBtn.title = 'Thoát toàn màn hình'; } });

    aiDateFilter.addEventListener('change', populatePatientSelector);
    function populateDateFilter() { if (!globalData || !globalData.allRecords || globalData.allRecords.length === 0) return; const dates = [...new Set(globalData.allRecords.map(r => r.ngayVao.substring(0, 8)))]; dates.sort((a,b) => b.localeCompare(a)); aiDateFilter.innerHTML = '<option value="">-- Chọn ngày --</option>' + dates.map(d => { const dateObj = new Date(d.substring(0,4), d.substring(4,6)-1, d.substring(6,8)); const formatted = dateObj.toISOString().split('T')[0]; return `<option value="${formatted}">${formatDateTimeForDisplay(d)}</option>`; }).join(''); }
    function populatePatientSelector() { const selectedDate = aiDateFilter.value.replace(/-/g, ''); aiPreviewContainer.style.display = 'none'; patientSearchInput.value = ''; patientSelectorValue.value = ''; if (!selectedDate) { patientSearchInput.placeholder = '-- Vui lòng chọn ngày trước --'; patientSearchInput.disabled = true; patientOptionsContainer.innerHTML = ''; validateInputs(); return; } const recordsForDate = globalData.allRecords.filter(record => record.ngayVao.substring(0, 8) === selectedDate); if (recordsForDate.length === 0) { patientSearchInput.placeholder = '-- Không có hồ sơ cho ngày đã chọn --'; patientSearchInput.disabled = true; patientOptionsContainer.innerHTML = ''; validateInputs(); return; } patientSearchInput.disabled = false; patientSearchInput.placeholder = '-- Chọn hoặc gõ để tìm --'; const optionsHTML = recordsForDate.map((record, index) => `<div data-value="${record.maLk}" data-text="${index + 1}. ${record.hoTen} (Mã LK: ${record.maLk})">${index + 1}. ${record.hoTen} (Mã LK: ${record.maLk})</div>`).join(''); patientOptionsContainer.innerHTML = optionsHTML; patientOptionsContainer.querySelectorAll('div').forEach(option => { option.addEventListener('click', () => { patientSearchInput.value = option.dataset.text; patientSelectorValue.value = option.dataset.value; patientOptionsContainer.classList.remove('show'); renderPreview(option.dataset.value); validateInputs(); }); }); }
    patientSearchInput.addEventListener('click', (e) => { e.stopPropagation(); patientOptionsContainer.classList.toggle('show'); });
    patientSearchInput.addEventListener('input', () => { const filter = patientSearchInput.value.toLowerCase(); patientOptionsContainer.querySelectorAll('div').forEach(option => { const text = option.textContent.toLowerCase(); option.style.display = text.includes(filter) ? '' : 'none'; }); patientOptionsContainer.classList.add('show'); patientSelectorValue.value = ''; aiPreviewContainer.style.display = 'none'; validateInputs(); });
    document.addEventListener('click', () => { patientOptionsContainer.classList.remove('show'); });
    function validateInputs() { analyzeButton.disabled = !(patientSelectorValue.value && apiKeyInput.value); }
    apiKeyInput.addEventListener('input', validateInputs);
    analyzeButton.addEventListener('click', handleFullAnalysis);
    downloadHtmlButton.addEventListener('click', () => { if (currentAnalysisResult.html && currentAnalysisResult.patient) { const blob = new Blob([currentAnalysisResult.html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Phan_tich_AI_${currentAnalysisResult.patient.maLk}.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } });

    async function handleFullAnalysis() {
        const maLk = patientSelectorValue.value;
        const apiKey = apiKeyInput.value;
        if (!maLk || !apiKey) { alert("Vui lòng chọn hồ sơ và nhập API Key."); return; }
        aiLoading.classList.add('show');
        aiResultDiv.innerHTML = '';
        aiPreviewContainer.style.display = 'none';
        downloadHtmlButton.style.display = 'none';
        analyzeButton.disabled = true;
        try {
            const { originalHoSoData, generalFileInfo } = extractDataForAI(maLk);
            const anonymizedPatientInfo = anonymizePatientData(originalHoSoData.patientInfo, originalHoSoData.patientInfo.stt);
            const promptData = createAnonymizedRawDataString(originalHoSoData, generalFileInfo, anonymizedPatientInfo);
            const geminiResult = await getGeminiAnalysis(promptData, anonymizedPatientInfo, generalFileInfo, originalHoSoData, apiKey);
            if (geminiResult.success) {
                aiResultDiv.innerHTML = geminiResult.content;
                currentAnalysisResult.html = createPdfHtmlContent(geminiResult.content, originalHoSoData.patientInfo);
                currentAnalysisResult.patient = originalHoSoData.patientInfo;
                downloadHtmlButton.style.display = 'inline-block';
            } else {
                aiResultDiv.innerHTML = `<p style="color:red;"><b>Lỗi:</b> ${geminiResult.content}</p>`;
            }
        } catch (error) {
            console.error("Lỗi trong quá trình phân tích:", error);
            aiResultDiv.innerHTML = `<p style="color:red;"><b>Lỗi hệ thống:</b> ${error.message}</p>`;
        } finally {
            aiLoading.classList.remove('show');
            analyzeButton.disabled = false;
        }
    }
  function extractDataForAI(maLk) {
    const record = globalData.allRecords.find(r => r.maLk === maLk);
    if (!record) throw new Error("Không tìm thấy hồ sơ.");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(globalData.xmlDataContent, 'text/xml');
    let targetHosoNode = null;
    const hosoNodes = xmlDoc.getElementsByTagName('HOSO');
    for (const hosoNode of hosoNodes) {
        const maLkNode = hosoNode.querySelector('MA_LK');
        if (maLkNode && maLkNode.textContent.trim() === maLk) {
            targetHosoNode = hosoNode;
            break;
        }
    }
    if (!targetHosoNode) throw new Error("Không tìm thấy HOSO trong XML gốc.");
    const getText = (element, ...selectors) => { if (!element) return ''; for (const selector of selectors) { const node = element.querySelector(selector); if (node && node.textContent) { const text = node.textContent.trim(); if (text) return text; } } return ''; };
    const getFileContent = (type) => { for (const fileNode of targetHosoNode.children) { if (fileNode.nodeName === 'FILEHOSO' && getText(fileNode, 'LOAIHOSO') === type) { return fileNode.querySelector('NOIDUNGFILE'); } } return null; };
    
    const tongHopNode = getFileContent('XML1').querySelector('TONG_HOP');
    const updatedPatientInfo = { ...record };
    if(tongHopNode) {
        updatedPatientInfo.chanDoanVao = getText(tongHopNode, 'CHAN_DOAN_VAO');
        updatedPatientInfo.maBenh = getText(tongHopNode, 'MA_BENH_CHINH');
        updatedPatientInfo.diaChi = getText(tongHopNode, 'DIA_CHI');
        updatedPatientInfo.lyDoVaoVien = getText(tongHopNode, 'LY_DO_VV');
        updatedPatientInfo.maHSBA = getText(tongHopNode, 'MA_HSBA');
        updatedPatientInfo.ngayTaiKham = getText(tongHopNode, 'NGAY_TAI_KHAM');
        // === START CHANGE 1: Lấy Cân Nặng ===
        updatedPatientInfo.canNang = getText(tongHopNode, 'CAN_NANG'); // <--- THÊM DÒNG NÀY
        // === END CHANGE 1 ===
    }

    const chiTietThuocNode = getFileContent('XML2');
    const drugList = [];
    if(chiTietThuocNode) {
        chiTietThuocNode.querySelectorAll('CHI_TIET_THUOC').forEach((item, index) => {
            drugList.push({
                sttThuoc: index + 1,
                tenThuoc: getText(item, 'TEN_THUOC'),
                hamLuong: getText(item, 'HAM_LUONG'),
                lieuDung: getText(item, 'LIEU_DUNG'),
                cachDung: getText(item, 'CACH_DUNG'),
                soLuong: parseFloat(getText(item, 'SO_LUONG') || '0'),
                donGia: parseFloat(getText(item, 'DON_GIA_BH') || '0'),
                thanhTienBH: parseFloat(getText(item, 'THANH_TIEN_BH') || '0'),
                ngayYLenh: formatDateTimeForDisplay(getText(item, 'NGAY_YL')),
                ngayThYLenh: formatDateTimeForDisplay(getText(item, 'NGAY_TH_YL')),
                maBacSi: getText(item, 'MA_BAC_SI'),
                tyleTT: getText(item, 'TYLE_TT_BH'),
                // === START CHANGE 2: Lấy Mức Hưởng Thuốc ===
                mucHuong: getText(item, 'MUC_HUONG') // <--- THÊM DÒNG NÀY
                // === END CHANGE 2 ===
            });
        });
    }

    const chiTietDvktNode = getFileContent('XML3');
    const serviceList = [];
    if(chiTietDvktNode){
        chiTietDvktNode.querySelectorAll('CHI_TIET_DVKT').forEach((item, index) => {
             serviceList.push({
                sttDvkt: index + 1,
                maDvkt: getText(item, 'MA_DICH_VU'),
                tenDvkt: getText(item, 'TEN_DICH_VU'),
                soLuong: parseFloat(getText(item, 'SO_LUONG') || '0'),
                donGiaBH: parseFloat(getText(item, 'DON_GIA_BH') || '0'),
                thanhTienBH: parseFloat(getText(item, 'THANH_TIEN_BH') || '0'),
                ngayYLenh: formatDateTimeForDisplay(getText(item, 'NGAY_YL')),
                ngayThYLenh: formatDateTimeForDisplay(getText(item, 'NGAY_TH_YL')),
                maBacSi: getText(item, 'MA_BAC_SI'),
                nguoiThucHien: getText(item, 'NGUOI_THUC_HIEN'),
                tyleTT: getText(item, 'TYLE_TT_BH'),
                // === START CHANGE 3: Lấy Mức Hưởng DVKT ===
                mucHuong: getText(item, 'MUC_HUONG') // <--- THÊM DÒNG NÀY
                // === END CHANGE 3 ===
            });
        });
    }

    const xml4ContentNode = getFileContent('XML4');
    const xml4Details = [];
    if (xml4ContentNode) {
        xml4ContentNode.querySelectorAll('CHI_TIET_CLS').forEach((item, index) => {
            const maDichVu = getText(item, 'MA_DICH_VU');
            const correspondingService = serviceList.find(s => s.maDvkt === maDichVu);

            xml4Details.push({
                stt: index + 1,
                tenChiSo: getText(item, 'TEN_CHI_SO'),
                giaTri: getText(item, 'GIA_TRI'),
                donVi: getText(item, 'DON_VI_DO'),
                nguoiThucHien: correspondingService ? correspondingService.nguoiThucHien : '',
                maBsDocKq: getText(item, 'MA_BS_DOC_KQ'),
                ngayKQ: formatDateTimeForDisplay(getText(item, 'NGAY_KQ'))
            });
        });
    }

    const xml14ContentNode = getFileContent('XML14');
    let appointmentInfo = null;
    if (xml14ContentNode && xml14ContentNode.querySelector('CHI_TIEU_GIAYHEN_KHAMLAI')) {
        const henKhamNode = xml14ContentNode.querySelector('CHI_TIEU_GIAYHEN_KHAMLAI');
        appointmentInfo = {
            soGiayHen: getText(henKhamNode, 'SO_GIAYHEN_KL'),
            ngayHenKL: formatDateTimeForDisplay(getText(henKhamNode, 'NGAY_HEN_KL'))
        };
    }

    const originalHoSoData = {
        patientInfo: updatedPatientInfo,
        drugList: drugList,
        serviceList: serviceList,
        xml4Details: xml4Details,
        appointmentInfo: appointmentInfo,
        xml4RawContentForPrompt: xml4ContentNode ? xml4ContentNode.innerHTML.trim() : null,
        xml14RawContentForPrompt: xml14ContentNode ? xml14ContentNode.innerHTML.trim() : null,
    };

    const generalFileInfo = {
        maCSKCB: xmlDoc.querySelector('MACSKCB')?.textContent.trim(),
        ngayLapFile: formatDateTimeForDisplay(xmlDoc.querySelector('NGAYLAP')?.textContent.trim())
    };
    
    return { originalHoSoData, generalFileInfo };
}

    // ===================================================================
    // BƯỚC 4: CÁC HÀM LOGIC CHO AI (Client-side)
    // ===================================================================
function renderPreview(maLk) {
    const { originalHoSoData } = extractDataForAI(maLk);
    if (!originalHoSoData) return;
    
    const pInfo = originalHoSoData.patientInfo;
    const drugs = originalHoSoData.drugList;
    const services = originalHoSoData.serviceList;
    const xml4Details = originalHoSoData.xml4Details;
    const appointmentInfo = originalHoSoData.appointmentInfo;

    // Lấy thông tin trạng thái từ hồ sơ
    let statusClass = 'status-success';
    let statusText = '🟢 Hợp lệ';
    if (pInfo.errors.length > 0) {
        const hasCritical = pInfo.errors.some(e => e.severity === 'critical');
        if (hasCritical) {
            statusClass = 'status-error';
            statusText = `🔴 Nghiêm trọng (${pInfo.errors.length} lỗi)`;
        } else {
            statusClass = 'status-warning';
            statusText = `🟡 Cảnh báo (${pInfo.errors.length} lỗi)`;
        }
    }

    let previewHTML = `
        <div class="preview-section">
            <h3>
                📋 Thông tin Bệnh nhân
                <span class="status-badge ${statusClass}" style="margin-left: auto;">${statusText}</span>
            </h3>
            <div class="preview-info-grid">
                <div><span>Mã LK:</span> <span>${escapeBasicHtml(pInfo.maLk)}</span></div>
                <div><span>Họ tên:</span> <span>${escapeBasicHtml(pInfo.hoTen)}</span></div>
                <div><span>Mã thẻ BHYT:</span> <span>${escapeBasicHtml(pInfo.maThe)}</span></div>
                <div><span>Tuổi:</span> <span>${new Date().getFullYear() - parseInt(pInfo.ngaySinh.substring(0,4))}</span></div>
                <div><span>Giới tính:</span> <span>${pInfo.gioiTinh === '1' ? 'Nam' : 'Nữ'}</span></div>
                <div><span>Địa chỉ:</span> <span>${escapeBasicHtml(pInfo.diaChi || '')}</span></div>
                <div style="grid-column: 1 / -1;"><span>Chẩn đoán:</span> <span>${escapeBasicHtml(pInfo.chanDoan)} (ICD: ${escapeBasicHtml(pInfo.maBenh)})</span></div>
                <div><span>Lý do vào viện:</span> <span>${escapeBasicHtml(pInfo.lyDoVaoVien || 'N/A')}</span></div>
                <div><span>Thời gian điều trị:</span> <span>${formatDateTimeForDisplay(pInfo.ngayVao)} - ${formatDateTimeForDisplay(pInfo.ngayRa)}</span></div>
                <div><span>Ngày tái khám:</span> <span>${formatDateTimeForDisplay(pInfo.ngayTaiKham) || 'N/A'}</span></div>
                <div><span>Mã HSBA:</span> <span>${escapeBasicHtml(pInfo.maHSBA || 'N/A')}</span></div>
            </div>
        </div>
    `;

    if (drugs.length > 0) {
        previewHTML += `
            <div class="preview-section" style="margin-top: 20px;">
                <h3>💊 Danh sách thuốc</h3>
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên thuốc</th>
                            <th>Hàm lượng/Cách dùng</th>
                            <th>SL</th>
                            <th>Ngày TH Y lệnh</th>
                            <th>Tỉ lệ BH</th>
                            <th>Thành tiền BH</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${drugs.map((d, i) => {
                            const bsYLenh = staffNameMap.get(d.maBacSi) || d.maBacSi || 'N/A';
                            return `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${escapeBasicHtml(d.tenThuoc)}</td>
                                    <td>
                                        ${escapeBasicHtml(d.hamLuong || d.lieuDung)}
                                        <br><small>${escapeBasicHtml(d.cachDung)}</small>
                                    </td>
                                    <td>${d.soLuong.toFixed(3)}</td>
                                    <td>
                                        ${d.ngayThYLenh}
                                        <br>
                                        <small><b>BS Y lệnh:</b> ${bsYLenh}</small>
                                    </td>
                                    <td>${d.tyleTT}%</td>
                                    <td>${formatCurrency(d.thanhTienBH)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (services.length > 0) {
         previewHTML += `
            <div class="preview-section" style="margin-top: 20px;">
                <h3>💉 Dịch vụ kỹ thuật (XML3)</h3>
                <table class="preview-table">
                    <thead><tr><th>STT</th><th>Tên DVKT</th><th>Ngày TH Y lệnh</th><th>Tỉ lệ BH</th><th>Thành tiền BH</th></tr></thead>
                    <tbody>
                        ${services.map((s, i) => {
                            const bsYLenh = staffNameMap.get(s.maBacSi) || s.maBacSi || 'N/A';
                            return `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${escapeBasicHtml(s.tenDvkt)}</td>
                                    <td>
                                        ${s.ngayThYLenh}
                                        <br>
                                        <small><b>BS Y lệnh:</b> ${bsYLenh}</small>
                                    </td>
                                    <td>${s.tyleTT}%</td>
                                    <td>${formatCurrency(s.thanhTienBH)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (xml4Details.length > 0) {
        previewHTML += `
            <div class="preview-section" style="margin-top: 20px;">
                <h3>🔬 Chi tiết Cận lâm sàng (XML4)</h3>
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên Chỉ Số</th>
                            <th>Giá Trị</th>
                            <th>Đơn Vị</th>
                            <th>Người TH</th>
                            <th>BS Đọc KQ</th>
                            <th>Ngày KQ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${xml4Details.map((d, i) => {
                            const performerName = staffNameMap.get(d.nguoiThucHien) || d.nguoiThucHien || 'N/A';
                            const doctorName = staffNameMap.get(d.maBsDocKq) || d.maBsDocKq || 'N/A';
                            return `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${escapeBasicHtml(d.tenChiSo)}</td>
                                    <td>${escapeBasicHtml(d.giaTri)}</td>
                                    <td>${escapeBasicHtml(d.donVi)}</td>
                                    <td>${escapeBasicHtml(performerName)}</td>
                                    <td>${escapeBasicHtml(doctorName)}</td>
                                    <td>${d.ngayKQ}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (appointmentInfo) {
        previewHTML += `
            <div class="preview-section" style="margin-top: 20px;">
                <h3>🗓️ Giấy hẹn khám lại (XML14)</h3>
                <div class="preview-info-grid">
                    <div><span>Số giấy hẹn:</span> <span>${escapeBasicHtml(appointmentInfo.soGiayHen)}</span></div>
                    <div><span>Ngày hẹn khám lại:</span> <span>${appointmentInfo.ngayHenKL}</span></div>
                </div>
            </div>
        `;
    }
    
    aiPreviewContainer.innerHTML = previewHTML;
    aiPreviewContainer.style.display = 'block';
}

    function anonymizePatientData(patientInfo, index) { const dob = patientInfo.ngaySinh; let age = 'N/A'; if (dob && dob.length >= 4) { const birthYear = parseInt(dob.substring(0, 4)); const currentYear = new Date().getFullYear(); age = currentYear - birthYear; } return { stt: index, maLK: patientInfo.maLk, hoTen: `BN_${String(index).padStart(3, '0')}`, tuoi: age, gioiTinh: patientInfo.gioiTinh === '1' ? 'Nam' : 'Nữ', canNang: patientInfo.canNang || 'N/A', chanDoanVao: patientInfo.chanDoanVao || 'N/A', chanDoanRaVien: patientInfo.chanDoan, maBenh: patientInfo.maBenh, maTheBHYT: "[ĐÃ ẨN]", gtTheTu: "[ĐÃ ẨN]", gtTheDen: "[ĐÃ ẨN]", ngayVao: formatDateTimeForDisplay(patientInfo.ngayVao), ngayRa: formatDateTimeForDisplay(patientInfo.ngayRa), }; }
    function createAnonymizedRawDataString(originalHoSoData, generalFileInfo, anonymizedPatientInfoForPrompt) { let text = `Mã CSKCB (File): ${generalFileInfo.maCSKCB || 'N/A'}\n`; text += `Ngày lập File XML: ${generalFileInfo.ngayLapFile || 'N/A'}\n`; text += `\n--- Bệnh nhân (STT: ${anonymizedPatientInfoForPrompt.stt || 'N/A'}, Mã LK tham chiếu: ${originalHoSoData.patientInfo.maLk || 'N/A'}) --- \n`; text += `Họ tên: ${anonymizedPatientInfoForPrompt.hoTen}\n`; text += `Tuổi: ${anonymizedPatientInfoForPrompt.tuoi || 'N/A'}, Giới tính: ${anonymizedPatientInfoForPrompt.gioiTinh || 'N/A'}, Cân nặng: ${anonymizedPatientInfoForPrompt.canNang || 'N/A'} kg\n`; text += `Chẩn đoán vào viện: ${originalHoSoData.patientInfo.chanDoanVao || 'N/A'}\n`; text += `Chẩn đoán RV: ${anonymizedPatientInfoForPrompt.chanDoanRaVien || 'N/A'} (Mã: ${anonymizedPatientInfoForPrompt.maBenh || 'N/A'})\n`; text += `Thẻ BHYT: ${anonymizedPatientInfoForPrompt.maTheBHYT} (Từ ${anonymizedPatientInfoForPrompt.gtTheTu} đến ${anonymizedPatientInfoForPrompt.gtTheDen})\n`; text += `Ngày Vào: ${anonymizedPatientInfoForPrompt.ngayVao || 'N/A'} - Ngày Ra: ${anonymizedPatientInfoForPrompt.ngayRa || 'N/A'}\n`; if (originalHoSoData.drugList && originalHoSoData.drugList.length > 0) { text += "\n--- Thuốc ---\n"; originalHoSoData.drugList.forEach((drug) => { text += `- STT ${drug.sttThuoc}: ${drug.tenThuoc}, Liều: ${drug.lieuDung}, Cách dùng: ${drug.cachDung}, SL: ${drug.soLuong}, Ngày YL: ${drug.ngayYLenh}, Mức hưởng: ${drug.mucHuong || 'N/A'}%\n`; }); } if (originalHoSoData.serviceList && originalHoSoData.serviceList.length > 0) { text += "\n--- DVKT ---\n"; originalHoSoData.serviceList.forEach((service) => { text += `- STT ${service.sttDvkt}: ${service.tenDvkt}, SL: ${service.soLuong}, Ngày YL: ${service.ngayYLenh}, Mức hưởng: ${service.mucHuong || 'N/A'}%\n`; }); } if (originalHoSoData.xml4RawContentForPrompt) { text += "\n--- Dữ liệu XML4 (Kết quả CLS) ---\n"; text += originalHoSoData.xml4RawContentForPrompt + "\n"; } if (originalHoSoData.xml14RawContentForPrompt) { text += "\n--- Dữ liệu XML14 (Giấy hẹn) ---\n"; text += originalHoSoData.xml14RawContentForPrompt + "\n"; } return text; }
    function createPdfHtmlContent(analysisTextFromGemini, originalPatientInfo) { return `<html><head><meta charset="UTF-8"><title>Chi tiết HS và Phân tích AI - ${escapeBasicHtml(originalPatientInfo.maLk) || 'HoSo'}</title><style>body { font-family: 'DejaVu Sans', Arial, sans-serif; line-height: 1.5; margin: 20px; font-size: 11px; } h1 { color: #2c3e50; text-align: center; border-bottom: 1px solid #3498db; padding-bottom: 8px; font-size: 1.5em; margin-bottom: 15px;} h2 { color: #3498db; margin-top: 20px; border-bottom: 1px solid #bdc3c7; padding-bottom: 4px; font-size: 1.2em;} p { margin-bottom: 8px; text-align: justify;} hr { border: 0; height: 1px; background: #ccc; margin: 20px 0; } ul { margin-left: 20px; padding-left: 0;} li { margin-bottom: 5px; } pre { background-color: #f0f0f0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.85em; } table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.95em; } th, td { border: 1px solid #ccc; padding: 6px; text-align: left; } th { background-color: #f2f2f2; font-weight: bold; }</style></head><body>${analysisTextFromGemini}</body></html>`; }
   async function getGeminiAnalysis(promptData, patientInfoForPrompt, generalInfo, originalHoSoData, apiKey) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const fullPrompt = `Bạn là một bác sĩ đa khoa danh tiếng, dược sĩ nhiều năm kinh nghiệm, bạn sẽ không để sai xót trong điều trị và chỉ định thuốc sai và bạn cũng là chuyên gia về giám định bảo hiểm y tế (dựa vào công văn 4750/qđ-byt, 130/QĐ-BYT, Thông tư 27/2023/TT-BYT và các quy định mới nhất về BHYT).
Dựa trên thông tin hồ sơ bệnh án XML được cung cấp (bao gồm tất cả dữ liệu XML tóm tắt và thông tin tham khảo từ tìm kiếm web dưới đây), hãy tạo nội dung HTML cho một báo cáo tóm tắt "PHÂN TÍCH DỮ LIỆU KHÁM CHỮA BỆNH".

**KIỂM TRA CHI TIẾT:** Vui lòng phân tích kỹ và nhấn mạnh các điểm bất thường hoặc lỗi tiềm ẩn (dùng <b><font color='red'>[LỖI]</font></b> hoặc <b><font color='orange'>[CẢNH BÁO]</font></b>) dựa trên các quy tắc BHYT sau:

1. **THỜI GIAN ĐIỀU TRỊ:** - **Ngày Y Lệnh vs Ngày Ra Viện:** Ngày y lệnh ('NGAY_YL' trong XML2/XML3) của thuốc/dịch vụ KHÔNG được sau ngày ra viện ('NGAY_RA' trong XML1). Đánh dấu rõ các trường hợp sai có thể dẫn đến từ chối thanh toán BHYT.
   - **Thứ tự Thời gian hợp lý:** Kiểm tra thời gian nhập viện ('NGAY_VAO') đến ra viện ('NGAY_RA'), so với các ngày y lệnh thuốc/dịch vụ. Nhận diện các mốc thời gian mâu thuẫn.

2. **THUỐC & LIỀU DÙNG (XML2):** - **Mức hưởng: ('MUC_HUONG').
   - **Quy tắc liều dùng:** Kiểm tra chỉ định ('LIEU_DUNG') có tuân thủ theo tuổi/cân nặng và phác đồ chuẩn không? Tính toán cụ thể nếu có thể.
   - **Trùng lặp Thuốc:** Phát hiện thuốc kê trùng lặp cùng công dụng, cùng thời kỳ điều trị.
   - **Ngày Y lệnh:** Có nằm trong khoảng Ngày vào - Ngày ra?

3. **DỊCH VỤ KỸ THUẬT & CẬN LÂM SÀNG (XML3, XML4):**
   - **Tần suất hợp lý:** Kiểm tra các xét nghiệm/dịch vụ ('MA_DICH_VU' trong XML3) có tần suất bất thường không, đặc biệt các dịch vụ lặp lại nhiều lần trong thời gian ngắn.
   - **Mức hưởng: ('MUC_HUONG').
   - **Chỉ định theo định mức:** Đối chiếu dịch vụ kỹ thuật với chẩn đoán để đánh giá sự cần thiết y tế theo quy định BHYT.
   - **Kết quả CLS (XML4):** Phân tích kết quả cận lâm sàng có phù hợp với chẩn đoán và thuốc điều trị không. Sử dụng dữ liệu từ thẻ <CHITIEU_CHITIET_DICHVUCANLAMSANG> và <DSACH_CHI_TIET_CLS> nếu có trong phần tóm tắt XML4.
   - **Ngày Y lệnh/KQ:** Có nằm trong khoảng Ngày vào - Ngày ra? NGAY_KQ >= NGAY_YL?

4. **MÃ ICD & CHẨN ĐOÁN:**
   - **Tính chính xác của Mã ICD:** Kiểm tra mã ICD ('MA_BENH_CHINH' trong XML1) có chính xác và phù hợp với chẩn đoán ra viện không.
   - **Nhất quán trong chẩn đoán:** So sánh chẩn đoán ban đầu, chẩn đoán trong quá trình điều trị và chẩn đoán ra viện để phát hiện mâu thuẫn.

5. **THÔNG TIN HÀNH CHÍNH:**
   - **Thông tin Thẻ BHYT:** Dữ liệu thẻ BHYT ('MA_THE_BHYT', 'GT_THE_TU', 'GT_THE_DEN') đã được ẩn danh. Chỉ nhận xét về MUC_HUONG nếu có.
   - **Tỷ lệ thanh toán BHYT:** Kiểm tra tỷ lệ được hưởng BHYT ('MUC_HUONG' trong XML2 và XML3, hoặc TYLE_TT trong XML1) có phù hợp không.

**Nội dung báo cáo HTML cần tạo:**
Bắt đầu với các thông tin tóm tắt sau (LƯU Ý: Thông tin bệnh nhân như Họ tên, Mã thẻ BHYT đã được ẩn danh cho mục đích bảo mật khi gửi lên AI. Hãy giữ nguyên dạng ẩn danh đó trong báo cáo của bạn):
  <h1>PHÂN TÍCH DỮ LIỆU KHÁM CHỮA BỆNH DO AI CUNG CẤP</h1>
  <p><b>Mã CSKCB:</b> ${escapeBasicHtml(generalInfo.maCSKCB) || 'N/A'}</p>
  <p><b>Ngày lập hồ sơ:</b> ${escapeBasicHtml(generalInfo.ngayLapFile) || 'N/A'}</p>
  <p><b>Bệnh nhân (STT: ${escapeBasicHtml(patientInfoForPrompt.stt)}):</b> ${escapeBasicHtml(patientInfoForPrompt.hoTen)} - ${escapeBasicHtml(patientInfoForPrompt.tuoi?.toString()) || 'N/A'} tuổi - Giới tính: ${escapeBasicHtml(patientInfoForPrompt.gioiTinh) || 'N/A'} - Cân nặng: ${escapeBasicHtml(patientInfoForPrompt.canNang) || 'N/A'} kg</p>
  <p>
  <b>Thông tin thẻ BHYT:</b> ${escapeBasicHtml(patientInfoForPrompt.maTheBHYT)} 
  (Từ: ${escapeBasicHtml(patientInfoForPrompt.gtTheTu)} đến: ${escapeBasicHtml(patientInfoForPrompt.gtTheDen)})
</p>
  <p><b>Mã LK (tham chiếu nội bộ):</b> ${escapeBasicHtml(patientInfoForPrompt.maLK) || 'N/A'}</p>
  <p><b>Chẩn đoán vào viện:</b> ${escapeBasicHtml(patientInfoForPrompt.chanDoanVao) || 'N/A'}</p>
  <p><b>Chẩn đoán ra viện:</b> ${escapeBasicHtml(patientInfoForPrompt.chanDoanRaVien) || 'N/A'}</p>
  <p><b>Mã ICD CHÍNH:</b> ${escapeBasicHtml(patientInfoForPrompt.maBenh) || 'N/A'}</p>
  <p><b>Thời gian điều trị:</b> Từ ${escapeBasicHtml(patientInfoForPrompt.ngayVao)} đến ${escapeBasicHtml(patientInfoForPrompt.ngayRa) || 'N/A'}</p>
  <hr>

Tiếp theo, phân tích chi tiết theo các mục:
  <h2>1. Thông tin hành chính và quyền lợi BHYT:</h2>
       <p><i>Đánh giá quyền lợi BHYT:</i> (Phân tích MUC_HUONG, TYLE_TT. Lưu ý: Thông tin chi tiết thẻ BHYT đã được ẩn danh.)</p>
 
  <h2>2. Kiểm tra mã ICD và chẩn đoán:</h2>
       <p><i>Đánh giá mã ICD:</i> (Phân tích mã ICD có phù hợp với chẩn đoán ra viện không)</p>
       <p><i>Tính nhất quán:</i> (So sánh chẩn đoán các giai đoạn của quá trình điều trị)</p>
 
  <h2>3. Kiểm tra thời gian điều trị:</h2>
       <p><i>Tổng thời gian điều trị:</i> (Tính toán số ngày điều trị, đánh giá tính hợp lý, nếu thời gian trên 5 phút là hợp lí, không báo lỗi)</p>
       <p><i>Kiểm tra mốc thời gian:</i> (Phân tích có mâu thuẫn về thời gian không, ví dụ NGAY_YL so với NGAY_VAO, NGAY_RA)</p>
       <p style="color: red;"><i>Các y lệnh sau ngày ra viện:</i> (Liệt kê chi tiết các trường hợp y lệnh sau ngày ra viện)</p>
 
  <h2>4. Phân tích thuốc điều trị (XML2):</h2>
       <table border="1" style="width:100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
              <th>Tên thuốc</th><th>Liều dùng</th><th>Cách dùng</th><th>Số lượng</th><th>Mức hưởng</th><th>Ngày y lệnh (NGAY_YL)</th><th>Phù hợp chẩn đoán & Chống chỉ định?</th><th>Liều dùng hợp lý?</th><th>Lỗi/Cảnh báo</th>
          </tr>
          </table>
       <p><i>Liều dùng bất thường:</i> (Chi tiết các trường hợp liều dùng quá cao/thấp theo tuổi, cân nặng)</p>
       <p><i>Thuốc trùng lặp:</i> (Liệt kê các thuốc trùng lặp cùng công dụng)</p>
       <p><i>Thuốc không phù hợp/chống chỉ định:</i> (Chi tiết các thuốc không phù hợp hoặc có chống chỉ định với chẩn đoán, tuổi, giới tính)</p>
 
  <h2>5. Phân tích dịch vụ kỹ thuật (XML3):</h2>
       <table border="1" style="width:100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
              <th>Tên dịch vụ</th><th>Số lượng</th><th>Ngày y lệnh </th><th>Mức hưởng</th><th>Phù hợp chẩn đoán?</th><th>Tần suất hợp lý?</th><th>Lỗi/Cảnh báo</th>
          </tr>
          </table>
       <p><i>Dịch vụ tần suất bất thường:</i> (Liệt kê dịch vụ lặp lại nhiều lần trong thời gian ngắn)</p>
       <p><i>Dịch vụ không phù hợp chẩn đoán:</i> (Liệt kê các dịch vụ không phù hợp với chẩn đoán)</p>
 
  <h2>6. Phân tích kết quả cận lâm sàng (XML4):</h2>
   <p>Dưới đây là nội dung XML4 nếu có, hãy phân tích các chỉ số trong đó:</p>
   <pre>${originalHoSoData.xml4RawContentForPrompt ? escapeBasicHtml(originalHoSoData.xml4RawContentForPrompt) : "Không có dữ liệu XML4."}</pre>
   <table border="1" style="width:100%; border-collapse: collapse;">
       <tr style="background-color: #f2f2f2;">
           <th>STT CLS</th><th>Tên Chỉ Số/Dịch Vụ</th><th>Giá trị</th><th>Đơn vị</th><th>Mô tả/Kết luận</th><th>Ngày KQ</th><th>Bất thường/Phù hợp?</th>
       </tr>
       </table>
       <p><i>Các chỉ số bất thường:</i> (Liệt kê các kết quả CLS bất thường, ví dụ TEN_CHI_SO, GIA_TRI, MO_TA, KET_LUAN từ XML4)</p>
       <p><i>Tương quan với thuốc điều trị:</i> (Phân tích sự phù hợp giữa kết quả CLS và thuốc điều trị)</p>
 
  <h2>7. Kiểm tra giấy hẹn khám lại (XML14):</h2>
    <p>Dưới đây là nội dung XML14 nếu có:</p>
    <pre>${originalHoSoData.xml14RawContentForPrompt ? escapeBasicHtml(originalHoSoData.xml14RawContentForPrompt) : "Không có dữ liệu XML14."}</pre>
       <p><i>Thông tin hẹn khám:</i> (Phân tích thông tin hẹn khám NGAY_HEN_KL, SO_GIAYHEN_KL và tính hợp lý nếu có trong XML14)</p>
 
  <h2>8. Tổng hợp lỗi phát hiện:</h2>
       <div style="background-color: #ffebee; padding: 15px; border-radius: 5px;">
           <h3 style="color: #c62828;">Các lỗi nghiêm trọng (cần xem xét từ chối thanh toán):</h3>
           <ul></ul>
           <h3 style="color: #ff8f00;">Các cảnh báo cần lưu ý (có thể cần giải trình):</h3>
           <ul></ul>
       </div>
 
  <h2>9. Khuyến nghị:</h2>
       <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px;">
           <ul></ul>
       </div>
       
  <h2>10. Từ chối trách nhiệm:</h1>
 <div style="background-color: #fff3cd; padding: 15px; border: 2px solid #ffeeba; border-radius: 5px; margin: 15px 0;">
   <p style="font-weight: bold; color: #856404; font-size: 16px; text-align: center; text-transform: uppercase; margin-bottom: 10px;">⚠️ LƯU Ý QUAN TRỌNG ⚠️</p>
   <p style="font-weight: bold; text-align: center;">Báo cáo này được tạo bởi AI theo yêu cầu của Anh Khoa - IT Trung tâm Y tế Huyện Củ Chi.</p>
   <p style="text-align: center; font-weight: bold;">Đây CHỈ LÀ CÔNG CỤ HỖ TRỢ, mọi quyết định cuối cùng PHẢI do chuyên gia y tế và y bác sĩ đưa ra.</p>
</div>


Hãy đảm bảo toàn bộ phản hồi là HTML hoàn chỉnh, ngắn gọn, tuân thủ cấu trúc yêu cầu và nêu bật được các lỗi/bất thường theo quy tắc. Chỉ trả lời bằng nội dung HTML cho báo cáo.`;
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 10240 } }) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Lỗi API: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            let analysisHtmlContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "<p>Không có phản hồi từ AI.</p>";
            if (analysisHtmlContent.startsWith("```html")) {
                analysisHtmlContent = analysisHtmlContent.substring(7).trim();
            }
            if (analysisHtmlContent.endsWith("```")) {
                analysisHtmlContent = analysisHtmlContent.substring(0, analysisHtmlContent.length - 3).trim();
            }
            return { success: true, content: analysisHtmlContent };
        } catch (error) {
            console.error("Lỗi gọi Gemini API:", error);
            return { success: false, content: error.message };
        }
    }
});
