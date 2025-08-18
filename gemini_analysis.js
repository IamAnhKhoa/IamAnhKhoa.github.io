
/**
 * FILE MỚI: gemini_analysis.js
 * =============================


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
    const validatorTabButton = document.querySelector("button[onclick*=\"'validatorTab'\"]"); if (validatorTabButton) { validatorTabButton.classList.add('has-dropdown'); validatorTabButton.innerHTML = `<span>📋 Kiểm tra XML</span><div class="ai-dropdown-content"><a href="#" id="openAiAnalysisModal"> Xem chi tiết hồ sơ và 🤖 AI</a></div>`; }
    const aiModalHTML = `<div id="aiAnalysisModal" class="ai-modal"><div class="ai-modal-content"><div class="ai-modal-header"><h2>Phân tích Hồ sơ Bằng AI Gemini</h2><button id="fullscreenBtn" class="fullscreen-btn" title="Toàn màn hình">⛶</button></div><div class="ai-modal-body"><div class="filter-row"><div class="filter-group"><label for="aiDateFilter">1. Chọn ngày vào viện:</label><input type="date" id="aiDateFilter" class="filter-input"></div><div class="filter-group"><label for="patientSearchInput">2. Chọn hoặc tìm hồ sơ:</label><div class="searchable-select-container"><input type="text" id="patientSearchInput" class="filter-input searchable-select-input" placeholder="-- Vui lòng chọn ngày trước --" disabled><div id="patientOptions" class="searchable-select-options"></div></div><input type="hidden" id="patientSelectorValue"></div></div><div class="filter-group"><div class="api-key-help"><label for="apiKeyInput">3. Nhập Gemini API Key:</label><a href="#" id="showApiKeyHowTo" class="api-key-howto-link">Hướng dẫn lấy API Key?</a></div><input type="password" id="apiKeyInput" class="filter-input" placeholder="Dán API Key vào đây"></div><div id="aiPreviewContainer"></div><div class="loading" id="aiLoading"><div class="spinner"></div><p>AI đang phân tích hồ sơ...</p></div><div id="aiAnalysisResult"><p>Kết quả phân tích sẽ được hiển thị tại đây.</p></div></div><div class="ai-modal-footer"><button id="closeAiModalButton" class="btn btn-warning">Đóng</button><button id="downloadHtmlButton" class="btn btn-success" style="display: none;">📥 Tải HTML</button><button id="analyzeWithAiButton" class="btn btn-primary" disabled>🚀 Bắt đầu phân tích</button></div></div></div>`;
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

    let previewHTML = `
        <div class="preview-section">
            <h3>📋 Thông tin Bệnh nhân</h3>
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
                            <th>Liều/Cách dùng</th>
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
                                    <td>${escapeBasicHtml(d.lieuDung)}<br><small>${escapeBasicHtml(d.cachDung)}</small></td>
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
    }

    const chiTietThuocNode = getFileContent('XML2');
    const drugList = [];
    if(chiTietThuocNode) {
        chiTietThuocNode.querySelectorAll('CHI_TIET_THUOC').forEach((item, index) => {
            drugList.push({
                sttThuoc: index + 1,
                tenThuoc: getText(item, 'TEN_THUOC'),
                lieuDung: getText(item, 'LIEU_DUNG'),
                cachDung: getText(item, 'CACH_DUNG'),
                soLuong: parseFloat(getText(item, 'SO_LUONG') || '0'),
                donGia: parseFloat(getText(item, 'DON_GIA_BH') || '0'),
                thanhTienBH: parseFloat(getText(item, 'THANH_TIEN_BH') || '0'),
                ngayThYLenh: formatDateTimeForDisplay(getText(item, 'NGAY_TH_YL')),
                maBacSi: getText(item, 'MA_BAC_SI'),
                tyleTT: getText(item, 'TYLE_TT_BH')
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
                ngayThYLenh: formatDateTimeForDisplay(getText(item, 'NGAY_TH_YL')),
                maBacSi: getText(item, 'MA_BAC_SI'),
                nguoiThucHien: getText(item, 'NGUOI_THUC_HIEN'),
                tyleTT: getText(item, 'TYLE_TT_BH')
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


    function anonymizePatientData(patientInfo, index) { const dob = patientInfo.ngaySinh; let age = 'N/A'; if (dob && dob.length >= 4) { const birthYear = parseInt(dob.substring(0, 4)); const currentYear = new Date().getFullYear(); age = currentYear - birthYear; } return { stt: index, maLK: patientInfo.maLk, hoTen: `BN_${String(index).padStart(3, '0')}`, tuoi: age, gioiTinh: patientInfo.gioiTinh === '1' ? 'Nam' : 'Nữ', canNang: patientInfo.canNang || 'N/A', chanDoanVao: patientInfo.chanDoanVao || 'N/A', chanDoanRaVien: patientInfo.chanDoan, maBenh: patientInfo.maBenh, maTheBHYT: "[ĐÃ ẨN]", gtTheTu: "[ĐÃ ẨN]", gtTheDen: "[ĐÃ ẨN]", ngayVao: formatDateTimeForDisplay(patientInfo.ngayVao), ngayRa: formatDateTimeForDisplay(patientInfo.ngayRa), }; }
    function createAnonymizedRawDataString(originalHoSoData, generalFileInfo, anonymizedPatientInfoForPrompt) { let text = `Mã CSKCB (File): ${generalFileInfo.maCSKCB || 'N/A'}\n`; text += `Ngày lập File XML: ${generalFileInfo.ngayLapFile || 'N/A'}\n`; text += `\n--- Bệnh nhân (STT: ${anonymizedPatientInfoForPrompt.stt || 'N/A'}, Mã LK tham chiếu: ${originalHoSoData.patientInfo.maLk || 'N/A'}) --- \n`; text += `Họ tên: ${anonymizedPatientInfoForPrompt.hoTen}\n`; text += `Tuổi: ${anonymizedPatientInfoForPrompt.tuoi || 'N/A'}, Giới tính: ${anonymizedPatientInfoForPrompt.gioiTinh || 'N/A'}, Cân nặng: ${anonymizedPatientInfoForPrompt.canNang || 'N/A'} kg\n`; text += `Chẩn đoán vào viện: ${originalHoSoData.patientInfo.chanDoanVao || 'N/A'}\n`; text += `Chẩn đoán RV: ${anonymizedPatientInfoForPrompt.chanDoanRaVien || 'N/A'} (Mã: ${anonymizedPatientInfoForPrompt.maBenh || 'N/A'})\n`; text += `Thẻ BHYT: ${anonymizedPatientInfoForPrompt.maTheBHYT} (Từ ${anonymizedPatientInfoForPrompt.gtTheTu} đến ${anonymizedPatientInfoForPrompt.gtTheDen})\n`; text += `Ngày Vào: ${anonymizedPatientInfoForPrompt.ngayVao || 'N/A'} - Ngày Ra: ${anonymizedPatientInfoForPrompt.ngayRa || 'N/A'}\n`; if (originalHoSoData.drugList && originalHoSoData.drugList.length > 0) { text += "\n--- Thuốc ---\n"; originalHoSoData.drugList.forEach((drug) => { text += `- STT ${drug.sttThuoc}: ${drug.tenThuoc}, Liều: ${drug.lieuDung}, Cách dùng: ${drug.cachDung}, SL: ${drug.soLuong}, Ngày YL: ${drug.ngayYLenh}, Mức hưởng: ${drug.mucHuong || 'N/A'}%\n`; }); } if (originalHoSoData.serviceList && originalHoSoData.serviceList.length > 0) { text += "\n--- DVKT ---\n"; originalHoSoData.serviceList.forEach((service) => { text += `- STT ${service.sttDvkt}: ${service.tenDvkt}, SL: ${service.soLuong}, Ngày YL: ${service.ngayYLenh}, Mức hưởng: ${service.mucHuong || 'N/A'}%\n`; }); } if (originalHoSoData.xml4RawContentForPrompt) { text += "\n--- Dữ liệu XML4 (Kết quả CLS) ---\n"; text += originalHoSoData.xml4RawContentForPrompt + "\n"; } if (originalHoSoData.xml14RawContentForPrompt) { text += "\n--- Dữ liệu XML14 (Giấy hẹn) ---\n"; text += originalHoSoData.xml14RawContentForPrompt + "\n"; } return text; }
    function createPdfHtmlContent(analysisTextFromGemini, originalPatientInfo) { return `<html><head><meta charset="UTF-8"><title>Phan Tich AI - ${escapeBasicHtml(originalPatientInfo.maLk) || 'HoSo'}</title><style>body { font-family: 'DejaVu Sans', Arial, sans-serif; line-height: 1.5; margin: 20px; font-size: 11px; } h1 { color: #2c3e50; text-align: center; border-bottom: 1px solid #3498db; padding-bottom: 8px; font-size: 1.5em; margin-bottom: 15px;} h2 { color: #3498db; margin-top: 20px; border-bottom: 1px solid #bdc3c7; padding-bottom: 4px; font-size: 1.2em;} p { margin-bottom: 8px; text-align: justify;} hr { border: 0; height: 1px; background: #ccc; margin: 20px 0; } ul { margin-left: 20px; padding-left: 0;} li { margin-bottom: 5px; } pre { background-color: #f0f0f0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.85em; } table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.95em; } th, td { border: 1px solid #ccc; padding: 6px; text-align: left; } th { background-color: #f2f2f2; font-weight: bold; }</style></head><body>${analysisTextFromGemini}</body></html>`; }
    async function getGeminiAnalysis(promptData, patientInfoForPrompt, generalInfo, originalHoSoData, apiKey) { const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`; const fullPrompt = `Bạn là một bác sĩ đa khoa danh tiếng, dược sĩ nhiều năm kinh nghiệm, và chuyên gia giám định BHYT Việt Nam. Dựa trên dữ liệu XML tóm tắt được cung cấp, hãy tạo một báo cáo HTML chi tiết theo mẫu sau.\n\n**QUY TẮC PHÂN TÍCH:**\n1. **THỜI GIAN:** Ngày y lệnh ('NGAY_YL') không được sau ngày ra viện ('NGAY_RA'). Thời gian điều trị quá ngắn (dưới 5 phút) là một cảnh báo.\n2. **THUỐC (XML2):** Kiểm tra liều dùng ('LIEU_DUNG'), cách dùng ('CACH_DUNG'), thuốc trùng lặp, thuốc không phù hợp chẩn đoán.\n3. **DVKT & CLS (XML3, XML4):** Đánh giá tần suất, sự cần thiết của dịch vụ so với chẩn đoán. Phân tích kết quả CLS trong XML4.\n4. **GIẤY HẸN (XML14):** Phân tích tính hợp lệ của ngày hẹn.\n5. **TỔNG HỢP:** Liệt kê các điểm bất thường, đánh dấu <b><font color='red'>[LỖI]</font></b> cho các vi phạm rõ ràng và <b><font color='orange'>[CẢNH BÁO]</font></b> cho các điểm cần xem xét thêm.\n\n**YÊU CẦU ĐỊNH DẠNG HTML (TUÂN THỦ NGHIÊM NGẶT):**\n- Chỉ trả lời bằng nội dung HTML bên trong thẻ <body>. Không bao gồm thẻ <html>, <head>, hoặc <style>.\n- Bắt đầu bằng <h1>PHÂN TÍCH DỮ LIỆU KHÁM CHỮA BỆNH DO AI CUNG CẤP</h1>.\n- Điền đầy đủ thông tin tóm tắt bệnh nhân.\n- Tạo các mục <h2> cho từng phần phân tích.\n- Dùng bảng (<table>) với các cột đã chỉ định để trình bày chi tiết thuốc và DVKT.\n- Điền thông tin vào các mục "Tổng hợp lỗi" và "Khuyến nghị".\n- Kết thúc bằng phần "Từ chối trách nhiệm".\n\n--- START TEMPLATE ---\n<h1>PHÂN TÍCH DỮ LIỆU KHÁM CHỮA BỆNH DO AI CUNG CẤP</h1>\n<p><b>Mã CSKCB:</b> ${escapeBasicHtml(generalInfo.maCSKCB) || 'N/A'}</p>\n<p><b>Ngày lập hồ sơ:</b> ${escapeBasicHtml(generalInfo.ngayLapFile) || 'N/A'}</p>\n<p><b>Bệnh nhân (STT: ${escapeBasicHtml(patientInfoForPrompt.stt)}):</b> ${escapeBasicHtml(patientInfoForPrompt.hoTen)} - ${escapeBasicHtml(patientInfoForPrompt.tuoi?.toString()) || 'N/A'} tuổi - Giới tính: ${escapeBasicHtml(patientInfoForPrompt.gioiTinh) || 'N/A'} - Cân nặng: ${escapeBasicHtml(patientInfoForPrompt.canNang) || 'N/A'} kg</p>\n<p><b>Thông tin thẻ BHYT:</b> ${escapeBasicHtml(patientInfoForPrompt.maTheBHYT)} (Từ: ${escapeBasicHtml(patientInfoForPrompt.gtTheTu)} đến: ${escapeBasicHtml(patientInfoForPrompt.gtTheDen)})</p>\n<p><b>Mã LK (tham chiếu nội bộ):</b> ${escapeBasicHtml(patientInfoForPrompt.maLK) || 'N/A'}</p>\n<p><b>Chẩn đoán vào viện:</b> ${escapeBasicHtml(patientInfoForPrompt.chanDoanVao) || 'N/A'}</p>\n<p><b>Chẩn đoán ra viện:</b> ${escapeBasicHtml(patientInfoForPrompt.chanDoanRaVien) || 'N/A'}</p>\n<p><b>Mã ICD CHÍNH:</b> ${escapeBasicHtml(patientInfoForPrompt.maBenh) || 'N/A'}</p>\n<p><b>Thời gian điều trị:</b> Từ ${escapeBasicHtml(patientInfoForPrompt.ngayVao)} đến ${escapeBasicHtml(patientInfoForPrompt.ngayRa) || 'N/A'}</p>\n<hr>\n\n<h2>1. Thông tin hành chính và quyền lợi BHYT:</h2>\n<p><i>Đánh giá quyền lợi BHYT:</i> [Phân tích MUC_HUONG, TYLE_TT. Lưu ý: Thông tin chi tiết thẻ BHYT đã được ẩn danh.]</p>\n\n<h2>2. Kiểm tra mã ICD và chẩn đoán:</h2>\n<p><i>Đánh giá mã ICD:</i> [Phân tích mã ICD có phù hợp với chẩn đoán ra viện không]</p>\n<p><i>Tính nhất quán:</i> [So sánh chẩn đoán các giai đoạn của quá trình điều trị]</p>\n\n<h2>3. Kiểm tra thời gian điều trị:</h2>\n<p><i>Tổng thời gian điều trị:</i> [Tính toán số ngày/phút điều trị, đánh giá tính hợp lý]</p>\n<p><i>Kiểm tra mốc thời gian:</i> [Phân tích có mâu thuẫn về thời gian không, ví dụ NGAY_YL so với NGAY_VAO, NGAY_RA]</p>\n<p style="color: red;"><i>Các y lệnh sau ngày ra viện:</i> [Liệt kê chi tiết các trường hợp y lệnh sau ngày ra viện]</p>\n\n<h2>4. Phân tích thuốc điều trị (XML2):</h2>\n<table border="1" style="width:100%; border-collapse: collapse;">\n    <tr style="background-color: #f2f2f2;">\n        <th>Tên thuốc</th><th>Liều dùng</th><th>Cách dùng</th><th>Số lượng</th><th>Mức hưởng</th><th>Ngày y lệnh</th><th>Ghi chú phân tích</th>\n    </tr>\n    <!-- AI sẽ điền các dòng <tr> vào đây -->\n</table>\n\n<h2>5. Phân tích dịch vụ kỹ thuật (XML3):</h2>\n<table border="1" style="width:100%; border-collapse: collapse;">\n    <tr style="background-color: #f2f2f2;">\n        <th>Tên dịch vụ</th><th>Số lượng</th><th>Ngày y lệnh</th><th>Mức hưởng</th><th>Ghi chú phân tích</th>\n    </tr>\n    <!-- AI sẽ điền các dòng <tr> vào đây -->\n</table>\n\n<h2>6. Phân tích kết quả cận lâm sàng (XML4):</h2>\n<p><i>Đánh giá chung:</i> [Phân tích các chỉ số trong XML4, sự phù hợp với chẩn đoán và thuốc điều trị]</p>\n<pre>${originalHoSoData.xml4RawContentForPrompt ? escapeBasicHtml(originalHoSoData.xml4RawContentForPrompt) : "Không có dữ liệu XML4."}</pre>\n\n<h2>7. Kiểm tra giấy hẹn khám lại (XML14):</h2>\n<p><i>Thông tin hẹn khám:</i> [Phân tích thông tin hẹn khám và tính hợp lý nếu có trong XML14]</p>\n<pre>${originalHoSoData.xml14RawContentForPrompt ? escapeBasicHtml(originalHoSoData.xml14RawContentForPrompt) : "Không có dữ liệu XML14."}</pre>\n\n<h2>8. Tổng hợp lỗi phát hiện:</h2>\n<div style="background-color: #ffebee; padding: 15px; border-radius: 5px;">\n    <h3 style="color: #c62828;">Các lỗi nghiêm trọng (cần xem xét từ chối thanh toán):</h3>\n    <ul><!-- AI điền <li> vào đây --></ul>\n    <h3 style="color: #ff8f00;">Các cảnh báo cần lưu ý (có thể cần giải trình):</h3>\n    <ul><!-- AI điền <li> vào đây --></ul>\n</div>\n\n<h2>9. Khuyến nghị:</h2>\n<div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px;">\n    <ul><!-- AI điền <li> vào đây --></ul>\n</div>\n\n<h2>10. Từ chối trách nhiệm:</h2>\n<div style="background-color: #fff3cd; padding: 15px; border: 2px solid #ffeeba; border-radius: 5px; margin: 15px 0;">\n  <p style="font-weight: bold; color: #856404; font-size: 16px; text-align: center; text-transform: uppercase; margin-bottom: 10px;">⚠️ LƯU Ý QUAN TRỌNG ⚠️</p>\n  <p style="text-align: center; font-weight: bold;">Báo cáo này được tạo bởi AI theo yêu cầu của Anh Khoa - IT Trung tâm Y tế Huyện Củ Chi.</p>\n  <p style="text-align: center; font-weight: bold;">Đây CHỈ LÀ CÔNG CỤ HỖ TRỢ, mọi quyết định cuối cùng PHẢI do chuyên gia y tế và y bác sĩ đưa ra.</p>\n</div>\n--- END TEMPLATE ---`; try { const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192 } }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(`Lỗi API: ${errorData.error?.message || response.statusText}`); } const data = await response.json(); let analysisHtmlContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "<p>Không có phản hồi từ AI.</p>"; if (analysisHtmlContent.startsWith("```html")) { analysisHtmlContent = analysisHtmlContent.substring(7).trim(); } if (analysisHtmlContent.endsWith("```")) { analysisHtmlContent = analysisHtmlContent.substring(0, analysisHtmlContent.length - 3).trim(); } return { success: true, content: analysisHtmlContent }; } catch (error) { console.error("Lỗi gọi Gemini API:", error); return { success: false, content: error.message }; }
    }
});
