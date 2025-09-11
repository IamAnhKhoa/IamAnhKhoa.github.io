let globalData = {
    allRecords: [],
    allDrugs: [],
    allServices: [],
    allXml4Details: new Map(),
    filteredRecords: [],
    currentPage: 1,
    pageSize: 50,
    xmlDataContent: null,
    xmlFile: null,
    excelFile: null,
    xmlRecords: new Map(),
    excelRecords: new Map(),
    comparisonResults: [],
    filteredComparisonResults: [],
    charts: {}
};
// Đặt đoạn code này ở phần đầu script của bạn
// Đặt đoạn code này ở phần đầu script của bạn

const indicationMap = new Map([
    // Ví dụ: Kê thuốc Mizho (05C.11) thì BẮT BUỘC phải có chẩn đoán K21, R10 hoặc K30
    ['05C.11', { 
        drugName: 'Mizho', 
        requiredIcdCodes: ['K21', 'R10', 'K30','U50.101'], 
        diseaseName: 'bệnh lý tiêu hóa' 
    }],
 ['40.677', {
        drugName: 'Omeprazol 20mg',
       requiredIcdCodes: ['K21','K25','K30'], 
        diseaseName: 'Loét dạ dày'
    }]
    // Bạn có thể thêm các quy tắc khác cho các thuốc khác ở đây
    // Ví dụ: ['MÃ_THUỐC', { requiredIcdCodes: ['ICD1', 'ICD2'], diseaseName: 'TÊN NHÓM BỆNH' }],
]);
const contraindicationMap = new Map([
   // --- Sheet: Hoastex, Hometex, Mizho ---
    ['05C.150', { drugName: 'Hoastex 45g; 11,25g; 83,7mg', icdCodes: ['E10', 'E11', 'E12', 'E13', 'E14'], diseaseName: 'Đái tháo đường' }],

    // --- Sheet: Acetylcystein (CẬP NHẬT MỚI) ---
    ['40.998', { drugName: 'Acetylcystein 200mg', icdCodes: ['J02', 'J45'], diseaseName: 'Viêm họng cấp' }],
    

    // --- Sheet: Katrypsin Fort, Dopolys - S ---
    ['40.67', { drugName: 'Katrypsin Fort', icdCodes: ['J02', 'J00', 'J45'], diseaseName: 'Viêm họng' }],
   ['40.734', { drugName: 'Dopolys - S', icdCodes: ['H81'], diseaseName: 'Chưa rõ, H81 sẽ xuất toán' }],

    // --- Sheet: Nhóm ức chế bơm proton ---
    ['01.01.01.12', { drugName: 'Lansoprazol 30mg', icdCodes: ['K29'], diseaseName: 'Viêm dạ dày' }],
   ['40.677', { drugName: 'Omeprazol 20mg', icdCodes: ['K29', 'J02', 'H81'], diseaseName: 'Viêm dạ dày' }],
    ['40.678', { drugName: 'Esomeprazol 40mg', icdCodes: ['K29'], diseaseName: 'Viêm dạ dày' }],

    // --- Sheet: Hoạt huyết dưỡng não, Midatan ---
    ['05C.127.1', { drugName: 'Hoạt huyết dưỡng não', icdCodes: ['I10', 'K25'], diseaseName: 'chưa rõ' }],
    ['40.155', { drugName: 'Midata', icdCodes: ['J20', 'J00', 'J45'], diseaseName: 'Kháng sinh không cần thiết cho viêm phế quản thông thường (thường do virus)' }],
]);


const ERROR_TYPES = {
  
    'NGAY_YL_THUOC_SAU_RA_VIEN': 'YL Thuốc - sau ra viện',
    'NGAY_YL_DVKT_SAU_RA_VIEN': 'YL DVKT - sau ra viện',
    'NGAY_TTOAN_SAU_RA_VIEN': 'Ngày TT sau ngày ra viện',
    'NGAY_VAO_SAU_NGAY_RA': 'Ngày vào sau ngày ra',
    'THE_BHYT_HET_HAN': 'Thẻ BHYT hết hạn',
    'KHAM_DUOI_5_PHUT': 'Thời gian khám dưới 5 phút',
    'NGAY_THYL_TRUOC_VAOVIEN': 'Ngày THYL trước ngày vào viện',
    'NGAY_THYL_SAU_RAVIEN': 'Ngày THYL sau ngày ra viện',
    'MA_MAY_TRUNG_THOI_GIAN': 'Trùng máy thực hiện cùng thời điểm',
    'BS_TRUNG_THOI_GIAN': 'Bác sĩ cho y lệnh trùng thời điểm',
    'BS_KHAM_CHONG_LAN': 'Chưa kết thúc BN cũ → khám BN mới (lãnh thuốc ko cls)',
    'DVKT_YL_TRUNG_NGAY_VAO': 'DVKT - Y lệnh trùng ngày vào',
    'DVKT_YL_TRUNG_NGAY_RA': 'DVKT - Y lệnh trùng ngày ra',
    'DVKT_THYL_TRUNG_NGAY_VAO': 'DVKT - THYL trùng ngày vào',
    'DVKT_THYL_TRUNG_NGAY_RA': 'DVKT - THYL trùng ngày ra',
    'THUOC_YL_NGOAI_GIO_HC': 'Thuốc - Y lệnh ngoài giờ HC',
    'THUOC_THYL_NGOAI_GIO_HC': 'Thuốc - Thực hiện YL ngoài giờ HC',
    'DVKT_YL_NGOAI_GIO_HC': 'DVKT - Y lệnh ngoài giờ HC',
    'DVKT_THYL_NGOAI_GIO_HC': 'DVKT - Thực hiện YL ngoài giờ HC',
    'XML4_MISSING_MA_BS_DOC_KQ': 'XML4 - Thiếu mã BS đọc KQ',
  'KQ_DVKT_SAU_YL_THUOC': 'XML3. NGÀY TH Y lệnh DVKT sau thời gian y lệnh THUỐC lỗi ở NGAY_KQ',
    'BS_KHAM_TRONG_NGAY_NGHI': 'Bác sỹ chấm công nghỉ nhưng phát sinh chi phí KCB BHYT', 
  'THUOC_DVKT_THYL_TRUNG_GIO': 'XML3. NGÀY TH Y lệnh DVKT bằng hoặc sau NGÀY TH Y lệnh THUỐC', // <-- SỬA DÒNG NÀY
    'NGAY_TAI_KHAM_NO_XML14': 'Có ngày tái khám nhưng không có Giấy hẹn (XML14)',
  
  'BS_KHAM_VUOT_DINH_MUC': 'BS khám vượt định mức (>=65 ca/ngày)',
    'THUOC_CHONG_CHI_DINH_ICD': 'Thuốc chống chỉ định với chẩn đoán (ICD)', 'THUOC_KHONG_PHU_HOP_ICD': 'Thuốc không có chẩn đoán phù hợp' // <-- THÊM DÒNG NÀY
    
};

let validationSettings = {};

const staffNameMap = new Map([
    ['003539/HCM-CCHN', 'Trương Tấn Hùng'],
    ['014331/HCM-CCHN', 'Dương Thị Thủy'],
    ['003960/HCM-CCHN', 'Nguyễn Minh Cang'],
    ['13075/CCHN-D-SYT-HCM', 'Nguyễn Thanh Tùng'],
    ['0033048/HCM-CCHN', 'Huỳnh Thanh Danh'],
    ['0008435/ĐNAI-CCHN', 'Lê Thị Dịu Linh'],
    ['0025015/HCM-CCHN', 'Huỳnh Thị Thùy Dung'],
    ['046446/HCM-CCHN', 'Trang Thị Mộng Tuyền'],
    ['0021030/HCM-CCHN', 'Huỳnh Đức Thọ'],
    ['0029511/HCM-CCHN', 'Trần Thị Ngọc Mến'],
    ['051530/HCM-CCHN', 'Võ Nguyễn Lệ Tâm'],
    ['051522/HCM-CCHN', 'Lâm Tuấn Kiệt'],
    ['0027596/HCM-CCHN', 'Lê Hồ Ngọc Hạnh'],
    ['051518/HCM-CCHN', 'Nguyễn Thị Hồng Hải'],
    ['051532/HCM-CCHN', 'Nguyễn Hoàng Thắng'],
    ['0033072/HCM-CCHN', 'Lương Hoài Thanh'],
    ['000465/HCM-GPHN', 'Lê Văn Thương'],
    ['0032340/HCM-CCHN', 'Huỳnh Thị Hiền'],
    ['010995/HCM-CCHN', 'Huỳnh Thị Mỹ Lan'],
    ['0019929/HCM-CCHN', 'Phan Thị Trường An'],
    ['0019312/HCM-CCHN', 'Trần Thị Diễm'],
    ['0032357/HCM-CCHN', 'Trần Huỳnh Lý'],
    ['0032379/HCM-CCHN', 'Công Tằng Tôn Nữ Thị Thanh Xuân'],
    ['0028445/HCM-CCHNN', 'Hồ Thị Thùy Linh']
]);

// Utility functions
const formatDateTimeForDisplay = (dateString) => {
    if (!dateString) return '';
    const s = String(dateString).trim();
    if (s.length >= 8) {
        const year = s.substring(0, 4);
        const month = s.substring(4, 6);
        const day = s.substring(6, 8);
        let formatted = `${day}/${month}/${year}`;
        if (s.length >= 12) {
            const hour = s.substring(8, 10);
            const minute = s.substring(10, 12);
            formatted += ` ${hour}:${minute}`;
        }
        return formatted;
    }
    return dateString;
};

const flexibleFormatDate = (dateInput) => {
    if (!dateInput) return 'N/A';

    if (dateInput instanceof Date) {
        const day = String(dateInput.getDate()).padStart(2, '0');
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const year = dateInput.getFullYear();
        const hours = String(dateInput.getHours()).padStart(2, '0');
        const minutes = String(dateInput.getMinutes()).padStart(2, '0');
        if (hours === '00' && minutes === '00') {
            return `${day}/${month}/${year}`;
        }
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    if (typeof dateInput === 'string' && /^\d{8,}/.test(dateInput)) {
        return formatDateTimeForDisplay(dateInput);
    }

    return dateInput.toString();
};

const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
        const year = dateInput.getFullYear();
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    if (typeof dateInput === 'string' && dateInput.length >= 8) {
        return dateInput.substring(0, 8);
    }
    return null;
};

const normalizeDateTime = (dateInput) => {
    if (!dateInput) return null;

    if (dateInput instanceof Date) {
        const year = dateInput.getFullYear();
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getDate()).padStart(2, '0');
        const hours = String(dateInput.getHours()).padStart(2, '0');
        const minutes = String(dateInput.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}`;
    }

    if (typeof dateInput === 'string') {
        const s = dateInput.trim();
        if (s.length >= 12) {
            return s.substring(0, 12);
        }
        if (s.length >= 8) {
            return s.substring(0, 8);
        }
    }
    return null;
};

const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(num);
};

const isOutsideWorkingHours = (dateTimeString) => {
    if (!dateTimeString || dateTimeString.length < 12) {
        return false;
    }
    const timePart = parseInt(dateTimeString.substring(8, 12)); // HHmm
    
    const morningStart = 730;
    const morningEnd = 1130;
    const afternoonStart = 1330;
    const afternoonEnd = 1630;

    const isMorning = timePart >= morningStart && timePart <= morningEnd;
    const isAfternoon = timePart >= afternoonStart && timePart <= afternoonEnd;

    return !(isMorning || isAfternoon);
};

// NEW: helper—only assign cost when rule is set to critical
const costIfCritical = (ruleKey, base) =>
  (validationSettings[ruleKey]?.severity === 'critical' ? (Number(base) || 0) : 0);
/**
 * Lấy nội dung text của một phần tử XML một cách an toàn.
 * Hàm sẽ thử lần lượt các selector được cung cấp cho đến khi tìm thấy một giá trị.
 * @param {Element} element - Phần tử XML cha để bắt đầu tìm kiếm.
 * @param {...string} selectors - Một hoặc nhiều CSS selector để tìm phần tử con.
 * @returns {string} - Nội dung text của phần tử tìm thấy, hoặc chuỗi rỗng nếu không tìm thấy.
 */
function getText(element, ...selectors) {
    if (!element) {
        return ''; // Trả về rỗng nếu phần tử cha không tồn tại
    }
    for (const selector of selectors) {
        const node = element.querySelector(selector);
        // Kiểm tra xem node có tồn tại và có nội dung text hay không
        if (node && node.textContent) {
            const text = node.textContent.trim(); // Lấy nội dung và xóa khoảng trắng thừa
            if (text) {
                return text; // Trả về ngay khi tìm thấy giá trị
            }
        }
    }
    return ''; // Trả về rỗng nếu thử hết các selector mà không thấy
}
// ============================= TAB MANAGEMENT =============================
function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
    
    if (tabName === 'dashboardTab' && globalData.allRecords.length > 0) {
        updateDashboard();
    } else if (tabName === 'denialTab' && globalData.allRecords.length > 0) {
        updateDenialProjectionTab();
    } else if (tabName === 'reportsTab' && globalData.allRecords.length > 0) {
        generateReport();
    }
}

function toggleFilterVisibility(filterContainerId) {
    const filterContent = document.querySelector(`#${filterContainerId} .filter-content`);
    const toggleButton = document.querySelector(`#${filterContainerId} .filter-toggle`);
    if (filterContent.style.display === 'none' || !filterContent.style.display) {
        filterContent.style.display = 'grid';
        if(document.querySelector(`#${filterContainerId} .filter-actions`)) {
            document.querySelector(`#${filterContainerId} .filter-actions`).style.display = 'flex';
        }
        toggleButton.textContent = 'Thu gọn';
    } else {
        filterContent.style.display = 'none';
        if(document.querySelector(`#${filterContainerId} .filter-actions`)) {
            document.querySelector(`#${filterContainerId} .filter-actions`).style.display = 'none';
        }
        toggleButton.textContent = 'Mở rộng';
    }
}

// ============================= DASHBOARD & REPORTS FUNCTIONALITY =============================
function updateDashboard() {
    if (globalData.allRecords.length === 0) return;

    const stats = calculateGlobalStats(globalData.allRecords);
    
    document.getElementById('totalBncct').textContent = formatCurrency(stats.totalBncct);
    document.getElementById('totalRecords').textContent = stats.totalRecords.toLocaleString('vi-VN');
    document.getElementById('errorCount').textContent = stats.errorRecordsCount.toLocaleString('vi-VN');
    document.getElementById('totalAmount').textContent = formatCurrency(stats.totalAmount);
    
    updateChart('errorTypesChart', 'doughnut', {
        labels: Object.keys(stats.errorTypes).map(key => ERROR_TYPES[key] || key),
        datasets: [{ data: Object.values(stats.errorTypes), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }]
    }, 'Phân bố loại lỗi');

    const sortedTimeline = Object.entries(stats.timeline).sort(([a], [b]) => a.localeCompare(b));
    updateChart('timelineChart', 'line', {
        labels: sortedTimeline.map(([day]) => `${day.substring(6,8)}/${day.substring(4,6)}`),
        datasets: [{ label: 'Số hồ sơ', data: sortedTimeline.map(([, count]) => count), borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.1)', fill: true, tension: 0.4 }]
    }, 'Xu hướng theo ngày');

    const sortedDepartments = Object.entries(stats.departments).sort(([,a], [,b]) => b - a).slice(0, 10);
    updateChart('departmentChart', 'bar', {
        labels: sortedDepartments.map(([name]) => name || 'Không xác định'),
        datasets: [{ label: 'Số hồ sơ', data: sortedDepartments.map(([, count]) => count), backgroundColor: 'rgba(75, 192, 192, 0.8)' }]
    }, 'Top 10 Khoa có nhiều hồ sơ nhất');
    
    updateChart('amountChart', 'bar', {
        labels: Object.keys(stats.amounts),
        datasets: [{ label: 'Số hồ sơ', data: Object.values(stats.amounts), backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1']}]
    }, 'Phân bố chi phí BHYT TT');

    renderDrugAndServiceDashboard();
}

function renderDrugAndServiceDashboard() {
    const drugCosts = {};
    globalData.allDrugs.forEach(drug => {
        const key = `${drug.ten_thuoc} (${drug.ma_thuoc})`;
        drugCosts[key] = (drugCosts[key] || 0) + drug.thanh_tien_bh;
    });
    const topDrugs = Object.entries(drugCosts).sort(([,a],[,b]) => b-a).slice(0, 10);
    updateChart('topDrugsChart', 'bar', {
        labels: topDrugs.map(([name]) => name),
        datasets: [{ label: 'Tổng chi phí BHYT', data: topDrugs.map(([,cost])=>cost), backgroundColor: 'rgba(255, 99, 132, 0.8)' }]
    }, 'Top 10 Thuốc có chi phí BHYT cao nhất');

    const serviceCosts = {};
    globalData.allServices.forEach(service => {
        const key = `${service.ten_dich_vu} (${service.ma_dich_vu})`;
        serviceCosts[key] = (serviceCosts[key] || 0) + service.thanh_tien_bh;
    });
    const topServices = Object.entries(serviceCosts).sort(([,a],[,b]) => b-a).slice(0, 10);
    updateChart('topServicesChart', 'bar', {
        labels: topServices.map(([name]) => name),
        datasets: [{ label: 'Tổng chi phí BHYT', data: topServices.map(([,cost])=>cost), backgroundColor: 'rgba(54, 162, 235, 0.8)' }]
    }, 'Top 10 DVKT có chi phí BHYT cao nhất');
}

function calculateGlobalStats(records) {
    const totalRecords = records.length;
    if (totalRecords === 0) {
        return { totalRecords: 0, errorRecordsCount: 0, errorRate: 0, totalAmount: 0, totalBncct: 0, errorTypes: {}, timeline: {}, departments: {}, amounts: {} };
    }

    const errorRecordsCount = records.filter(r => r.errors && r.errors.length > 0).length;
    const errorRate = (errorRecordsCount / totalRecords) * 100;
    
    const stats = {
        totalRecords,
        errorRecordsCount,
        errorRate,
        totalAmount: 0,
        totalBncct: 0,
        errorTypes: {},
        timeline: {},
        departments: {},
        amounts: { '< 1tr': 0, '1-5tr': 0, '5-10tr': 0, '10-50tr': 0, '> 50tr': 0 }
    };

    records.forEach(r => {
        stats.totalAmount += r.t_bhtt || 0;
        stats.totalBncct += r.t_bncct || 0;
        if (r.errors) r.errors.forEach(err => { stats.errorTypes[err.type] = (stats.errorTypes[err.type] || 0) + 1; });
        if (r.ngayVao) {
            const day = String(r.ngayVao).substring(0, 8);
            stats.timeline[day] = (stats.timeline[day] || 0) + 1;
        }
        if(r.maKhoa) stats.departments[r.maKhoa] = (stats.departments[r.maKhoa] || 0) + 1;

        const cost = r.t_bhtt || 0;
        if (cost < 1000000) stats.amounts['< 1tr']++;
        else if (cost <= 5000000) stats.amounts['1-5tr']++;
        else if (cost <= 10000000) stats.amounts['5-10tr']++;
        else if (cost <= 50000000) stats.amounts['10-50tr']++;
        else stats.amounts['> 50tr']++;
    });
    
    return stats;
}

function updateChart(canvasId, type, data, titleText) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (globalData.charts[canvasId]) globalData.charts[canvasId].destroy();
    
    globalData.charts[canvasId] = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: type === 'bar' && data.labels.length > 5 ? 'y' : 'x',
            plugins: {
                title: { display: true, text: titleText, font: {size: 16} },
                legend: { display: (data.datasets[0].label && type !== 'doughnut' && type !== 'pie') }
            },
            scales: (type === 'bar' || type === 'line') ? { y: { beginAtZero: true } } : {}
        }
    });
}

// ============================= VALIDATOR FUNCTIONALITY =============================
function initializeValidator() {
    const fileInput = document.getElementById('validatorFileInput');
    const uploadArea = document.getElementById('validatorUploadArea');
    
    fileInput.addEventListener('change', (e) => handleFileUpload(e, 'validator'));
    document.getElementById('validatorProcessButton').addEventListener('click', processXmlFile);
    
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (eventName === 'dragover') uploadArea.classList.add('drag-over');
            if (eventName === 'dragleave' || eventName === 'drop') uploadArea.classList.remove('drag-over');
            if (eventName === 'drop' && e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileUpload({ target: { files: e.dataTransfer.files } }, 'validator');
            }
        });
    });
}

function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (type === 'validator' || type === 'xml') {
        if (!file.name.toLowerCase().endsWith('.xml')) {
            alert('Vui lòng chọn file có định dạng .xml!');
            event.target.value = '';
            return;
        }
    }

    const fileInfoDiv = document.getElementById(type === 'validator' ? 'validatorFileInfo' : (type === 'xml' ? 'xmlStatus' : 'excelStatus'));
    const processButton = document.getElementById(type === 'validator' ? 'validatorProcessButton' : 'compareButton');
    
    fileInfoDiv.innerHTML = `<strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfoDiv.style.display = 'block';

    if (type === 'validator') {
        processButton.disabled = false;
    } else {
        if (type === 'xml') globalData.xmlFile = file;
        if (type === 'excel') globalData.excelFile = file;
        document.getElementById('compareButton').disabled = !(globalData.xmlFile && globalData.excelFile);
    }
}

function processXmlContent(xmlContent, messageId) { // Nhận thêm "messageId"
    console.log("Bắt đầu xử lý nội dung..."); // <-- DÒNG THEO DÕI SỐ 1
    const { records, drugs, services, xml4Details } = validateXmlContent(xmlContent);
    globalData.allRecords = records;
    globalData.allDrugs = drugs;
    globalData.allServices = services;
    globalData.allXml4Details = xml4Details;
    globalData.filteredRecords = records;
    
    displayValidatorResults();
    hideLoading('validatorLoading');
    
    document.getElementById('validatorFilters').style.display = 'block';
    document.getElementById('validatorResults').style.display = 'block';
    
    updateDashboard();
    updateDenialProjectionTab();

    // === TÍNH TOÁN KẾT QUẢ VÀ HIỂN THỊ POPUP ===
    const total = globalData.allRecords.length;
    // **SỬA LỖI 1**: Chỉ khai báo totalErrorRecords một lần ở đây
   const totalErrorRecords = globalData.allRecords.filter(r => r.errors.length > 0).length;
    const validRecords = total - totalErrorRecords;
    let criticalErrorRecords = 0;
    let totalDenialAmount = 0;
     globalData.allRecords.forEach(r => {
        if (r.errors.length > 0) {
            if (r.errors.some(e => e.severity === 'critical')) criticalErrorRecords++;
            r.errors.forEach(e => {
                if (e.severity === 'critical' && e.cost > 0) totalDenialAmount += e.cost;
            });
        }
    });

    const summaryStats = {
        maCskcb: getText(new DOMParser().parseFromString(xmlContent, 'text/xml'), 'MACSKCB', 'MA_CSKCB'),
        total: total,
        totalError: totalErrorRecords,
        valid: validRecords,
        criticalError: criticalErrorRecords,
        warningOnly: totalErrorRecords - criticalErrorRecords,
        denialAmount: totalDenialAmount
    };

    showSummaryPopup(summaryStats);
    
    console.log("Đã tính toán xong stats, chuẩn bị cập nhật Telegram..."); // <-- DÒNG THEO DÕI SỐ 2
    console.log("Đang gọi updateTelegramLog với messageId:", messageId); // <-- DÒNG THEO DÕI SỐ 3

    // CẬP NHẬT tin nhắn Telegram đã có với kết quả chi tiết
    updateTelegramLog(messageId, summaryStats);
}

// HÀM BẮT ĐẦU QUÁ TRÌNH
async function processXmlFile() { // Thêm "async" ở đây
    const file = document.getElementById('validatorFileInput').files[0];
    if (!file) {
        alert('Vui lòng chọn file XML!');
        return;
    }
    
    showLoading('validatorLoading');

    // Gửi log "Bắt đầu" và chờ để lấy message_id
    const messageId = await sendTelegramStartLog(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            globalData.xmlDataContent = e.target.result;
            // Truyền messageId vào hàm xử lý nội dung
            setTimeout(() => processXmlContent(globalData.xmlDataContent, messageId), 100);
        } catch (error) {
            hideLoading('validatorLoading');
            alert('Lỗi đọc file: ' + error.message);
        }
    };
    reader.readAsText(file, 'UTF-8');
}


function performCrossRecordValidation(records) {
    const machineTimeMap = new Map();
    const doctorTimeMap = new Map();
    const doctorKhamCountMap = new Map();

    // ===================================================================
    // BƯỚC 1: GOM DỮ LIỆU
    // ===================================================================
    records.forEach(record => {
        if (record.services) {
            record.services.forEach(service => {
                // Dữ liệu cho lỗi Trùng máy
                if (service.ma_may && service.ngay_th_yl) {
                    const key = `${service.ma_may}_${service.ngay_th_yl}`;
                    if (!machineTimeMap.has(key)) machineTimeMap.set(key, []);
                    machineTimeMap.get(key).push({ maLk: record.maLk, tenDv: service.ten_dich_vu, cost: service.thanh_tien_bh });
                }

                // Dữ liệu cho lỗi Vượt định mức khám
                const isKham = (service.ten_dich_vu || '').toLowerCase().includes('khám');
                if (isKham && service.ma_bac_si && service.ngay_th_yl) {
                    const datePart = service.ngay_th_yl.substring(0, 8);
                    const key = `${service.ma_bac_si}_${datePart}`;
                    if (!doctorKhamCountMap.has(key)) {
                        doctorKhamCountMap.set(key, { count: 0, records: [] });
                    }
                    const entry = doctorKhamCountMap.get(key);
                    entry.count++;
                    // **CẬP NHẬT**: Thêm ngay_th_yl để sắp xếp
                    entry.records.push({
                        maLk: record.maLk,
                        tenDv: service.ten_dich_vu,
                        cost: service.thanh_tien_bh,
                        ngay_th_yl: service.ngay_th_yl 
                    });
                }
            });
        }
        if (record.drugs) {
            record.drugs.forEach(drug => {
                // Dữ liệu cho lỗi Bác sĩ YL thuốc trùng
                if (drug.ma_bac_si && drug.ngay_yl) {
                    const key = `${drug.ma_bac_si}_${drug.ngay_yl}`;
                    if (!doctorTimeMap.has(key)) doctorTimeMap.set(key, []);
                    doctorTimeMap.get(key).push({ maLk: record.maLk, tenThuoc: drug.ten_thuoc, cost: drug.thanh_tien_bh });
                }
            });
        }
    });

    // ===================================================================
    // XỬ LÝ CÁC LỖI KHÁC (Giữ nguyên)
    // ===================================================================
    
    // Xử lý lỗi trùng máy...
    machineTimeMap.forEach((conflicts, key) => {
        const uniqueMaLks = new Set(conflicts.map(c => c.maLk));
        if (uniqueMaLks.size > 1) {
            const [maMay, ngayThYl] = key.split('_');
            uniqueMaLks.forEach(currentMaLk => {
                const recordToUpdate = records.find(r => r.maLk === currentMaLk);
                if (recordToUpdate) {
                    const conflictDetails = conflicts.find(c => c.maLk === currentMaLk);
                    const otherMaLks = Array.from(uniqueMaLks).filter(maLk => maLk !== currentMaLk)
                        .map(maLk => {
                            const r = records.find(rec => rec.maLk === maLk);
                            return r ? `${r.hoTen} (${r.maBn || r.maLk})` : maLk;
                        }).join(', ');
                    const ruleKey = 'MA_MAY_TRUNG_THOI_GIAN';
                    if (validationSettings[ruleKey]?.enabled) {
                         recordToUpdate.errors.push({
                            type: ruleKey,
                            severity: validationSettings[ruleKey].severity,
                            message: `DV "${conflictDetails.tenDv}" (Máy: ${maMay}) trùng thời điểm [${formatDateTimeForDisplay(ngayThYl)}] với các ca: ${otherMaLks}`,
                            cost: costIfCritical(ruleKey, conflictDetails.cost),
                            itemName: conflictDetails.tenDv
                        });
                    }
                }
            });
        }
    });

    // Xử lý lỗi trùng bác sĩ cho y lệnh thuốc...
    doctorTimeMap.forEach((conflicts, key) => {
        const uniqueMaLks = new Set(conflicts.map(c => c.maLk));
        if (uniqueMaLks.size > 1) {
            const [maBs, ngayYl] = key.split('_');
            const tenBacSi = staffNameMap.get(maBs) || maBs;
            uniqueMaLks.forEach(currentMaLk => {
                const recordToUpdate = records.find(r => r.maLk === currentMaLk);
                if (recordToUpdate) {
                    const conflictDetails = conflicts.find(c => c.maLk === currentMaLk);
                    const otherMaLks = Array.from(uniqueMaLks).filter(maLk => maLk !== currentMaLk)
                        .map(maLk => {
                            const r = records.find(rec => rec.maLk === maLk);
                            return r ? `${r.hoTen} (${r.maBn || r.maLk})` : maLk;
                        }).join(', ');
                    const ruleKey = 'BS_TRUNG_THOI_GIAN';
                    if (validationSettings[ruleKey]?.enabled) {
                        recordToUpdate.errors.push({
                            type: ruleKey,
                            severity: validationSettings[ruleKey].severity,
                            message: `BS ${tenBacSi} cho y lệnh thuốc "${conflictDetails.tenThuoc}" trùng thời điểm [${formatDateTimeForDisplay(ngayYl)}] với các ca khác: ${otherMaLks}`,
                            cost: costIfCritical(ruleKey, conflictDetails.cost),
                            itemName: conflictDetails.tenThuoc
                        });
                    }
                }
            });
        }
    });
    
    // Xử lý lỗi khám chồng lấn...
    const doctorXml3Windows = new Map();
    const take12 = s => (typeof s === 'string' && s.length >= 12 ? s.substring(0, 12) : null);
    const isKhamService = (svc) => (svc.ten_dich_vu || '').toLowerCase().includes('khám');
    records.forEach(record => {
        if (!record.services || record.services.length === 0) return;
        let hasKham = false;
        let hasNonKham = false;
        record.services.forEach(svc => {
            if (isKhamService(svc)) hasKham = true; else hasNonKham = true;
        });
        if (!hasKham || hasNonKham) return;
        record.services.forEach(svc => {
            if (!isKhamService(svc)) return;
            const maBs = svc.ma_bac_si;
            const th = take12(svc.ngay_th_yl);
            const kq = take12(svc.ngay_kq);
            if (!maBs || !th || !kq) return;
            if (!doctorXml3Windows.has(maBs)) doctorXml3Windows.set(maBs, new Map());
            const byRecord = doctorXml3Windows.get(maBs);
            if (!byRecord.has(record.maLk)) {
                byRecord.set(record.maLk, { startTHYL: th, endKQ: kq, khamOnly: true });
            } else {
                const win = byRecord.get(record.maLk);
                if (th < win.startTHYL) win.startTHYL = th;
                if (kq > win.endKQ) win.endKQ = kq;
            }
        });
    });
    doctorXml3Windows.forEach((byRecord, maBs) => {
        const tenBacSi = staffNameMap.get(maBs) || maBs;
        const windows = Array.from(byRecord.entries())
            .map(([maLk, w]) => ({ maLk, ...w }))
            .filter(w => w.khamOnly && w.startTHYL && w.endKQ);
        const containsMap = new Map();
        for (let i = 0; i < windows.length; i++) {
            for (let j = 0; j < windows.length; j++) {
                if (i === j) continue;
                const A = windows[i];
                const B = windows[j];
                if (B.startTHYL >= A.startTHYL && B.endKQ <= A.endKQ) {
                    if (!containsMap.has(B.maLk)) containsMap.set(B.maLk, { Bwin: B, Aset: new Set() });
                    containsMap.get(B.maLk).Aset.add(A.maLk);
                }
            }
        }
        const ruleKey = 'BS_KHAM_CHONG_LAN';
        if (validationSettings[ruleKey]?.enabled) {
            containsMap.forEach(({ Bwin, Aset }, bMaLk) => {
                if (Aset.size === 0) return;
                const recordB = records.find(r => r.maLk === bMaLk);
                if (!recordB) return;
                const idB = recordB.maBn || recordB.maLk;
                const B_TH = formatDateTimeForDisplay(Bwin.startTHYL);
                const B_KQ = formatDateTimeForDisplay(Bwin.endKQ);
                const AInfo = Array.from(Aset).map(aLk => records.find(r => r.maLk === aLk)).filter(Boolean).map(recA => {
                    const idA = recA.maBn || recA.maLk;
                    const wA = byRecord.get(recA.maLk);
                    const A_TH = formatDateTimeForDisplay(wA.startTHYL);
                    const A_KQ = formatDateTimeForDisplay(wA.endKQ);
                    return { textShort: `"${recA.hoTen}" (${idA})`, detailLine: `• ${recA.hoTen} (${idA}): [TH_YL: ${A_TH} → KQ: ${A_KQ}]` };
                });
                const headerAs = AInfo.map(a => a.textShort).join(', ');
                const sumKhamCost = (rec) => {
                    if (!rec || !rec.services) return 0;
                    return rec.services.filter(svc => isKhamService(svc)).reduce((acc, svc) => acc + (Number(svc.thanh_tien_bh) || 0), 0);
                };
                const khamCost = sumKhamCost(recordB);
                const msg = `BS ${tenBacSi} khám chồng (XML 3 công khám): Khoảng thời gian của "${recordB.hoTen}" (${idB}) ` +
                            `[TH_YL: ${B_TH} → KQ: ${B_KQ}] nằm TRONG ${AInfo.length} ca khác: ${headerAs}.` +
                            `<br><strong>Chi tiết CÔNG KHÁM (XML 3):</strong><br>` +
                            `${AInfo.map(a => a.detailLine).join('<br>')}`;
                recordB.errors.push({ type: ruleKey, severity: validationSettings[ruleKey].severity, message: msg, cost: costIfCritical(ruleKey, khamCost), itemName: 'Công khám' });
            });
        }
    });

    // ===================================================================
    // BƯỚC 3: XỬ LÝ LỖI MỚI - VƯỢT ĐỊNH MỨC KHÁM (LOGIC ĐÃ SỬA)
    // ===================================================================
    const ruleKeyVuotMuc = 'BS_KHAM_VUOT_DINH_MUC';
    if (validationSettings[ruleKeyVuotMuc]?.enabled) {
        doctorKhamCountMap.forEach((value, key) => {
            // **SỬA ĐỔI 1**: Điều kiện là > 65 (tức là từ ca 66 trở đi)
            if (value.count > 65) {
                const [maBS, datePart] = key.split('_');
                const tenBS = staffNameMap.get(maBS) || maBS;
                
                // **SỬA ĐỔI 2**: Sắp xếp các ca khám theo thời gian
                const sortedRecords = value.records.sort((a, b) =>
                    (a.ngay_th_yl || '').localeCompare(b.ngay_th_yl || '')
                );

                // **SỬA ĐỔI 3**: Chỉ lấy ra các ca khám từ thứ 66 trở đi
                const excessRecords = sortedRecords.slice(65);

                // **SỬA ĐỔI 4**: Chỉ thêm lỗi cho các ca vượt định mức này
                excessRecords.forEach((khamRecord, index) => {
                    const recordToUpdate = records.find(r => r.maLk === khamRecord.maLk);
                    if (recordToUpdate) {
                        recordToUpdate.errors.push({
                            type: ruleKeyVuotMuc,
                            severity: validationSettings[ruleKeyVuotMuc].severity,
                            // Thông báo lỗi rõ ràng hơn, cho biết đây là ca thứ bao nhiêu
                            message: `BS "${tenBS}" khám vượt định mức. Đây là ca thứ ${66 + index} trong ngày [${formatDateTimeForDisplay(datePart)}]. (Tổng: ${value.count} ca)`,
                            cost: costIfCritical(ruleKeyVuotMuc, khamRecord.cost),
                            itemName: khamRecord.tenDv
                        });
                    }
                });
            }
        });
    }
}

// ============================= XML PARSE & VALIDATION PER RECORD =============================
function validateXmlContent(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    if (xmlDoc.querySelector('parsererror')) throw new Error('File XML không hợp lệ.');

    const records = [];
    let allDrugs = []; 
    let allServices = []; 
    const xml4Details = new Map();

    const hosoElements = xmlDoc.getElementsByTagName('HOSO');
    for (let hoso of hosoElements) {
        const result = validateSingleHoso(hoso);
        if (result) {
            records.push(result.record);
            allDrugs.push(...result.drugs);
            allServices.push(...result.record.services);
            if(result.xml4Data.length > 0) {
                xml4Details.set(result.record.maLk, result.xml4Data);
            }
        }
    }

    performCrossRecordValidation(records);

    records.sort((a, b) => a.ngayVao.localeCompare(b.ngayVao));
    return { records, drugs: allDrugs, services: allServices, xml4Details };
}

function validateSingleHoso(hoso) {
  
    const findFileContent = (type) => {
        for (const fileNode of hoso.children) {
            if (fileNode.nodeName === 'FILEHOSO') {
                const loaiHoso = getText(fileNode, 'LOAIHOSO');
                if (loaiHoso === type) {
                    return fileNode.querySelector('NOIDUNGFILE');
                }
            }
        }
        return null;
    };

    const tongHopNodeContent = findFileContent('XML1');
    if (!tongHopNodeContent) return null;
    const tongHopNode = tongHopNodeContent.querySelector('TONG_HOP');
    if (!tongHopNode) return null;

    const chiTietThuocNode = findFileContent('XML2');
    const chiTietDvktNode = findFileContent('XML3');
    const chiTietCLSNode = findFileContent('XML4');
    const giayHenNode = findFileContent('XML14'); 

    const maLk = getText(tongHopNode, 'MA_LK');
    
    const record = {
        maLk: maLk, 
        hoTen: getText(tongHopNode,'HO_TEN'), 
        ngayVao: getText(tongHopNode,'NGAY_VAO'),
        ngayRa: getText(tongHopNode,'NGAY_RA'),
        ngayTtoan: getText(tongHopNode,'NGAY_TTOAN'), 
        maBn: getText(tongHopNode,'MA_BN'), 
        maThe: getText(tongHopNode,'MA_THE_BHYT'),
        t_tongchi: parseFloat(getText(tongHopNode, 'T_TONGCHI') || '0'),
        t_bhtt: parseFloat(getText(tongHopNode, 'T_BHTT') || '0'),
        t_bncct: parseFloat(getText(tongHopNode, 'T_BNCCT') || '0'),
        t_thuoc: parseFloat(getText(tongHopNode, 'T_THUOC') || '0'),
        t_vtyt: parseFloat(getText(tongHopNode, 'T_VTYT') || '0'),
        t_xn: parseFloat(getText(tongHopNode, 'T_XN') || '0'),
        t_cdha: parseFloat(getText(tongHopNode, 'T_CDHA') || '0'),
        t_kham: parseFloat(getText(tongHopNode, 'T_KHAM') || '0'),
        t_giuong: parseFloat(getText(tongHopNode, 'T_GIUONG') || '0'),
        t_mau: parseFloat(getText(tongHopNode, 'T_MAU') || '0'),
        t_pttt: parseFloat(getText(tongHopNode, 'T_PTTT') || '0'),
        t_vanchuyen: parseFloat(getText(tongHopNode, 'T_VANCHUYEN') || '0'),
        gioiTinh: getText(tongHopNode,'GIOI_TINH'),
        ngaySinh: getText(tongHopNode,'NGAY_SINH'), 
      chanDoan: getText(tongHopNode, 'MA_BENH_CHINH'), // Chỉ lấy mã bệnh chính
      maBenhKemTheo: getText(tongHopNode, 'MA_BENH_KT'), 
    maBenhYHCT: getText(tongHopNode, 'MA_BENH_YHCT'), 
        maKhoa: getText(tongHopNode,'MA_KHOA'),
        isSimpleCase: false,
        mainDoctor: null,
        has_kham_and_dvkt: false,
        has_xml4: !!chiTietCLSNode && !!chiTietCLSNode.querySelector('CHI_TIET_CLS'),
        has_xml14: !!giayHenNode && !!giayHenNode.querySelector('CHI_TIEU_GIAYHEN_KHAMLAI'), 
        bac_si_chi_dinh: new Set(),
        nguoi_thuc_hien: new Set(),
        errors: [],
        services: [],
        drugs: []
    };
    if (!record.maLk || !record.hoTen || !record.ngayVao || !record.ngayRa) return null;

    const drugsForGlobalList = [];
    if (chiTietThuocNode) {
        chiTietThuocNode.querySelectorAll('CHI_TIET_THUOC').forEach(item => {
            const tenThuoc = getText(item, 'TEN_THUOC');
            const thanhTienBH = parseFloat(getText(item, 'THANH_TIEN_BH') || '0');
            const maBacSiStr = getText(item, 'MA_BAC_SI');
            const ngayYl = getText(item, 'NGAY_YL');
           const ngayThYl = getText(item, 'NGAY_TH_YL');
        const maThuoc = getText(item, 'MA_THUOC'); // Lấy mã thuốc
        const maBenhChinh = record.chanDoan; // Lấy mã bệnh chính của bệnh nhân
            drugsForGlobalList.push({
                ma_lk: maLk, ma_thuoc: getText(item, 'MA_THUOC'), ten_thuoc: tenThuoc,
                so_luong: parseFloat(getText(item, 'SO_LUONG') || '0'),
                thanh_tien_bh: thanhTienBH
            });
            if(maBacSiStr && ngayYl) {
            // Lấy người thực hiện, nếu không có thì lấy BS chỉ định đầu tiên
            const performer = getText(item, 'NGUOI_THUC_HIEN') || maBacSiStr.split(/[,;]/)[0].trim();
            
            record.drugs.push({
                ma_bac_si: maBacSiStr,
                ngay_yl: ngayYl,
                ten_thuoc: tenThuoc,
                thanh_tien_bh: thanhTienBH,
                ngay_th_yl: ngayThYl, // <-- Thêm thuộc tính này
                performer: performer   // <-- Thêm thuộc tính này
            });
                if (!record.mainDoctor) {
                    record.mainDoctor = maBacSiStr.split(/[,;]/)[0].trim();
                }
            }

         if (ngayYl && ngayYl > record.ngayRa) record.errors.push({ type: 'NGAY_YL_THUOC_SAU_RA_VIEN', severity: 'critical', message: `Thuốc "${tenThuoc}": YL [${formatDateTimeForDisplay(ngayYl)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]`, cost: thanhTienBH, itemName: tenThuoc });
            
            // Gom tất cả các mã bệnh của bệnh nhân vào một mảng để tái sử dụng
            const patientDiagnoses = [
                record.chanDoan,
                ...(record.maBenhKemTheo || '').split(/[;,]/),
                ...(record.maBenhYHCT || '').split(/[;,]/)
            ].map(d => d.trim()).filter(Boolean);

            // ===============================================================
            // KHỐI 1: KIỂM TRA CHỐNG CHỈ ĐỊNH (LOGIC CŨ ĐƯỢC NÂNG CẤP)
            // ===============================================================
            if (contraindicationMap.has(maThuoc)) {
                const rule = contraindicationMap.get(maThuoc);
                let matchingIcd = null;
                const isContraindicated = patientDiagnoses.some(patientIcd => {
                    if (rule.icdCodes.some(icdPrefix => patientIcd.startsWith(icdPrefix))) {
                        matchingIcd = patientIcd;
                        return true;
                    }
                    return false;
                });
                if (isContraindicated) {
                    record.errors.push({
                        type: 'THUOC_CHONG_CHI_DINH_ICD',
                        severity: 'critical',
                        message: `Thuốc "${tenThuoc}" chống chỉ định với chẩn đoán "${matchingIcd}" (${rule.diseaseName}).`,
                        cost: thanhTienBH,
                        itemName: tenThuoc
                    });
                }
            }

            // ===============================================================
            // KHỐI 2: KIỂM TRA CHỈ ĐỊNH BẮT BUỘC (LOGIC MỚI THÊM VÀO)
            // ===============================================================
           // ===============================================================
// BẮT ĐẦU: LOGIC KIỂM TRA CHỈ ĐỊNH BẮT BUỘC (ĐÃ CẬP NHẬT LẠI)
// ===============================================================
if (indicationMap.has(maThuoc)) {
    const rule = indicationMap.get(maThuoc);

    // Dùng lại mảng chẩn đoán đã được tách ở phần kiểm tra chống chỉ định
    const patientDiagnoses = [
        record.chanDoan,
        ...(record.maBenhKemTheo || '').split(/[;,]/),
        ...(record.maBenhYHCT || '').split(/[;,]/)
    ].map(d => d.trim()).filter(Boolean);

    // Kiểm tra xem bệnh nhân có ÍT NHẤT MỘT chẩn đoán phù hợp không
    const hasRequiredDiagnosis = patientDiagnoses.some(patientIcd => 
        rule.requiredIcdCodes.some(requiredPrefix => patientIcd.startsWith(requiredPrefix))
    );

    // Nếu không tìm thấy bất kỳ chẩn đoán phù hợp nào, tạo lỗi
    if (!hasRequiredDiagnosis) {
        // Lấy chuỗi các chẩn đoán thực tế của bệnh nhân
        const actualDiagnoses = patientDiagnoses.join(', ');
        
        record.errors.push({
            type: 'THUOC_KHONG_PHU_HOP_ICD',
            severity: 'critical', 
            // CẬP NHẬT LẠI THÔNG BÁO LỖI ĐỂ RÕ RÀNG HƠN
            message: `Thuốc "${tenThuoc}" yêu cầu chẩn đoán (${rule.diseaseName}: ${rule.requiredIcdCodes.join(', ')}), nhưng chẩn đoán của bệnh nhân là [${actualDiagnoses}].`,
            cost: thanhTienBH,
            itemName: tenThuoc
        });
    }
}
// ===============================================================
// KẾT THÚC: LOGIC KIỂM TRA CHỈ ĐỊNH BẮT BUỘC
// ===============================================================


            if (ngayThYl) {
                if (ngayThYl < record.ngayVao) record.errors.push({ type: 'NGAY_THYL_TRUOC_VAOVIEN', severity: 'critical', message: `Thuốc "${tenThuoc}": Ngày THYL [${formatDateTimeForDisplay(ngayThYl)}] trước ngày vào [${formatDateTimeForDisplay(record.ngayVao)}]`, cost: thanhTienBH, itemName: tenThuoc });
                if (ngayThYl > record.ngayRa) record.errors.push({ type: 'NGAY_THYL_SAU_RAVIEN', severity: 'critical', message: `Thuốc "${tenThuoc}": Ngày THYL [${formatDateTimeForDisplay(ngayThYl)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]`, cost: thanhTienBH, itemName: tenThuoc });
            }

            const ruleKeyYlThuoc = 'THUOC_YL_NGOAI_GIO_HC';
            if (validationSettings[ruleKeyYlThuoc]?.enabled && isOutsideWorkingHours(ngayYl)) {
                 record.errors.push({ 
                    type: ruleKeyYlThuoc, 
                    severity: validationSettings[ruleKeyYlThuoc].severity, 
                    message: `Thuốc "${tenThuoc}" có YL ngoài giờ HC [${formatDateTimeForDisplay(ngayYl)}]`, 
                    cost: 0, 
                    itemName: tenThuoc 
                });
            }
            const ruleKeyThylThuoc = 'THUOC_THYL_NGOAI_GIO_HC';
            if (validationSettings[ruleKeyThylThuoc]?.enabled && isOutsideWorkingHours(ngayThYl)) {
                 record.errors.push({ 
                    type: ruleKeyThylThuoc, 
                    severity: validationSettings[ruleKeyThylThuoc].severity, 
                    message: `Thuốc "${tenThuoc}" có THYL ngoài giờ HC [${formatDateTimeForDisplay(ngayThYl)}]`, 
                    cost: 0, 
                    itemName: tenThuoc 
                });
            }

            if(maBacSiStr) {
                maBacSiStr.split(/[,;]/).map(c => c.trim()).filter(Boolean).forEach(code => record.bac_si_chi_dinh.add(code));
            }
        });
    }

    let hasKham = false, hasOtherDvkt = false;
    let tongTienDVKTKhacKham = 0;
    if (chiTietDvktNode) {
        chiTietDvktNode.querySelectorAll('CHI_TIET_DVKT').forEach(item => {
            const tenDV = getText(item, 'TEN_DICH_VU');
            const thanhTienBH = parseFloat(getText(item, 'THANH_TIEN_BH') || '0');
            const ngayYl = getText(item, 'NGAY_YL');
            const ngayThYl = getText(item, 'NGAY_TH_YL');
            const maBacSiStr = getText(item, 'MA_BAC_SI');
            const nguoiThucHienStr = getText(item, 'NGUOI_THUC_HIEN', 'MA_NGUOI_THIEN');

            record.services.push({
                ma_lk: maLk,
                ma_dich_vu: getText(item, 'MA_DICH_VU'),
                ten_dich_vu: tenDV,
                ma_nhom: getText(item, 'MA_NHOM'),
                so_luong: parseFloat(getText(item, 'SO_LUONG') || '0'),
                thanh_tien_bh: thanhTienBH,
                ma_may: getText(item, 'MA_MAY'),
                ngay_th_yl: ngayThYl,
                ngay_yl: ngayYl,
                ma_bac_si: maBacSiStr,
                nguoi_thuc_hien: nguoiThucHienStr,
                ngay_kq: getText(item, 'NGAY_KQ')
            });

            if (tenDV.toLowerCase().includes('khám')) {
                hasKham = true;
            } else {
                tongTienDVKTKhacKham += thanhTienBH;
                hasOtherDvkt = true;
            }

            if (ngayYl && ngayYl > record.ngayRa) record.errors.push({ type: 'NGAY_YL_DVKT_SAU_RA_VIEN', severity: 'critical', message: `DVKT "${tenDV}": YL [${formatDateTimeForDisplay(ngayYl)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]`, cost: thanhTienBH, itemName: tenDV });
            if (ngayThYl) {
                if (ngayThYl < record.ngayVao) record.errors.push({ type: 'NGAY_THYL_TRUOC_VAOVIEN', severity: 'critical', message: `DVKT "${tenDV}": Ngày THYL [${formatDateTimeForDisplay(ngayThYl)}] trước ngày vào [${formatDateTimeForDisplay(record.ngayVao)}]`, cost: thanhTienBH, itemName: tenDV });
                if (ngayThYl > record.ngayRa) record.errors.push({ type: 'NGAY_THYL_SAU_RAVIEN', severity: 'critical', message: `DVKT "${tenDV}": Ngày THYL [${formatDateTimeForDisplay(ngayThYl)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]`, cost: thanhTienBH, itemName: tenDV });
            }
            
            if (!tenDV.toLowerCase().includes('khám')) {
                if (ngayYl && ngayYl === record.ngayVao) record.errors.push({ type: 'DVKT_YL_TRUNG_NGAY_VAO', severity: 'warning', message: `DVKT "${tenDV}" có ngày y lệnh [${formatDateTimeForDisplay(ngayYl)}] trùng với ngày vào viện.`, cost: 0, itemName: tenDV });
                if (ngayYl && ngayYl === record.ngayRa) record.errors.push({ type: 'DVKT_YL_TRUNG_NGAY_RA', severity: 'warning', message: `DVKT "${tenDV}" có ngày y lệnh [${formatDateTimeForDisplay(ngayYl)}] trùng với ngày ra viện.`, cost: 0, itemName: tenDV });
                if (ngayThYl && ngayThYl === record.ngayVao) record.errors.push({ type: 'DVKT_THYL_TRUNG_NGAY_VAO', severity: 'warning', message: `DVKT "${tenDV}" có ngày THYL [${formatDateTimeForDisplay(ngayThYl)}] trùng với ngày vào viện.`, cost: 0, itemName: tenDV });
                if (ngayThYl && ngayThYl === record.ngayRa) record.errors.push({ type: 'DVKT_THYL_TRUNG_NGAY_RA', severity: 'warning', message: `DVKT "${tenDV}" có ngày THYL [${formatDateTimeForDisplay(ngayThYl)}] trùng với ngày ra viện.`, cost: 0, itemName: tenDV });

                const ruleKeyYlDvkt = 'DVKT_YL_NGOAI_GIO_HC';
                if (validationSettings[ruleKeyYlDvkt]?.enabled && isOutsideWorkingHours(ngayYl)) {
                    record.errors.push({ 
                        type: ruleKeyYlDvkt, 
                        severity: validationSettings[ruleKeyYlDvkt].severity, 
                        message: `DVKT "${tenDV}" có YL ngoài giờ HC [${formatDateTimeForDisplay(ngayYl)}]`, 
                        cost: 0, 
                        itemName: tenDV 
                    });
                }
                const ruleKeyThylDvkt = 'DVKT_THYL_NGOAI_GIO_HC';
                if (validationSettings[ruleKeyThylDvkt]?.enabled && isOutsideWorkingHours(ngayThYl)) {
                    record.errors.push({ 
                        type: ruleKeyThylDvkt, 
                        severity: validationSettings[ruleKeyThylDvkt].severity, 
                        message: `DVKT "${tenDV}" có THYL ngoài giờ HC [${formatDateTimeForDisplay(ngayThYl)}]`, 
                        cost: 0, 
                        itemName: tenDV 
                    });
                }
            }

            if(maBacSiStr) {
                 maBacSiStr.split(/[,;]/).map(c => c.trim()).filter(Boolean).forEach(code => record.bac_si_chi_dinh.add(code));
            }
            if(nguoiThucHienStr) {
                nguoiThucHienStr.split(/[,;]/).map(c => c.trim()).filter(Boolean).forEach(code => record.nguoi_thuc_hien.add(code));
            }
        });
    }
    record.has_kham_and_dvkt = hasKham && hasOtherDvkt;

    const xml4Data = [];
    if (record.has_xml4) {
        chiTietCLSNode.querySelectorAll('CHI_TIET_CLS').forEach(cls => {
            const maDichVu = getText(cls, 'MA_DICH_VU');
            const tenChiSo = getText(cls, 'TEN_CHI_SO');
            const maBsDocKq = getText(cls, 'MA_BS_DOC_KQ');
            const correspondingService = record.services.find(s => s.ma_dich_vu === maDichVu);
            const nguoiThucHien = correspondingService ? correspondingService.nguoi_thuc_hien : '';

            xml4Data.push({
                ma_dich_vu: maDichVu,
                ten_chi_so: tenChiSo,
                gia_tri: getText(cls, 'GIA_TRI'),
                don_vi_do: getText(cls, 'DON_VI_DO'),
                ngay_kq: formatDateTimeForDisplay(getText(cls, 'NGAY_KQ')),
                ma_bs_doc_kq: maBsDocKq,
                nguoi_thuc_hien: nguoiThucHien
            });

            const ruleKey = 'XML4_MISSING_MA_BS_DOC_KQ';
            if (validationSettings[ruleKey]?.enabled && !maBsDocKq) {
                const associatedService = record.services.find(s => s.ma_dich_vu === maDichVu);
                const serviceCost = associatedService ? associatedService.thanh_tien_bh : 0;
                const serviceName = associatedService ? associatedService.ten_dich_vu : `DV có mã ${maDichVu}`;

                record.errors.push({
                    type: ruleKey,
                    severity: validationSettings[ruleKey].severity,
                    message: `CLS "${serviceName}" thiếu mã bác sĩ đọc kết quả.`,
                    cost: serviceCost,
                    itemName: serviceName
                });
            }
        });
    }
    
    if (record.ngayVao > record.ngayRa) record.errors.push({ type: 'NGAY_VAO_SAU_NGAY_RA', severity: 'critical', message: `Ngày vào [${formatDateTimeForDisplay(record.ngayVao)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]` });
    
    const ruleNgayTToan = 'NGAY_TTOAN_SAU_RA_VIEN';
    if (validationSettings[ruleNgayTToan]?.enabled && record.ngayTtoan && record.ngayTtoan.substring(0, 8) > record.ngayRa.substring(0, 8)) {
        record.errors.push({ type: ruleNgayTToan, severity: validationSettings[ruleNgayTToan].severity, message: `Ngày TT [${formatDateTimeForDisplay(record.ngayTtoan)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]` });
    }

    const ruleKhamNgan = 'KHAM_DUOI_5_PHUT';
    if (validationSettings[ruleKhamNgan]?.enabled && record.ngayVao.length >= 12 && record.ngayRa.length >= 12) {
        const dateVao = new Date(
            record.ngayVao.substring(0,4), record.ngayVao.substring(4,6)-1, record.ngayVao.substring(6,8),
            record.ngayVao.substring(8,10), record.ngayVao.substring(10,12)
        );
        const dateRa = new Date(
            record.ngayRa.substring(0,4), record.ngayRa.substring(4,6)-1, record.ngayRa.substring(6,8),
            record.ngayRa.substring(8,10), record.ngayRa.substring(10,12)
        );
        const diffInMinutes = (dateRa - dateVao) / 60000;
        if(diffInMinutes >= 0 && diffInMinutes < 5) {
            record.errors.push({ type: ruleKhamNgan, severity: validationSettings[ruleKhamNgan].severity, message: `Thời gian ĐT: ${diffInMinutes.toFixed(1)} phút` });
        }
    }
    
    const ngayTaiKham = getText(tongHopNode, 'NGAY_TAI_KHAM');
    const ruleKeyTaiKham = 'NGAY_TAI_KHAM_NO_XML14';
    if (validationSettings[ruleKeyTaiKham]?.enabled && ngayTaiKham && !record.has_xml14) {
        record.errors.push({
            type: ruleKeyTaiKham,
            severity: validationSettings[ruleKeyTaiKham].severity,
            message: `Có ngày tái khám [${formatDateTimeForDisplay(ngayTaiKham)}] nhưng không có Giấy hẹn khám lại (XML14).`,
            cost: record.t_bhtt,
            itemName: `Hồ sơ có hẹn tái khám`
        });
    }

 // =================================================================
   // BẮT ĐẦU: KIỂM TRA NGÀY KẾT QUẢ DVKT SAU NGÀY Y LỆNH THUỐC
// =================================================================
const ruleKeyKqDvktSauThuoc = 'KQ_DVKT_SAU_YL_THUOC';
if (validationSettings[ruleKeyKqDvktSauThuoc]?.enabled && record.drugs.length > 0 && record.services.length > 0) {
    
    // 1. Tìm thời gian Y LỆNH (NGAY_YL) của thuốc sớm nhất
    const drugYlTimes = record.drugs.map(d => d.ngay_yl).filter(Boolean);
    if (drugYlTimes.length > 0) {
        const earliestDrugYl = drugYlTimes.reduce((min, current) => current < min ? current : min, drugYlTimes[0]);

        // 2. Lặp qua các dịch vụ để so sánh NGAY_KQ
        record.services.forEach(service => {
            const serviceNameLower = (service.ten_dich_vu || '').toLowerCase();
            
            // 3. Loại trừ các dịch vụ đặc biệt (khám, tải lượng, cd4)
            const isExcludedService = serviceNameLower.includes('khám') ||
                                      serviceNameLower.includes('cd4') ||
                                      serviceNameLower.includes('tải lượng');

            // 4. Áp dụng điều kiện: NGAY_KQ của DVKT > NGAY_YL của thuốc sớm nhất
            if (!isExcludedService && service.ngay_kq && service.ngay_kq > earliestDrugYl) {
                record.errors.push({
                    type: ruleKeyKqDvktSauThuoc,
                    severity: validationSettings[ruleKeyKqDvktSauThuoc].severity,
                    // Cập nhật thông báo lỗi cho chính xác
                    message: `DVKT "${service.ten_dich_vu}" có Ngày KQ [${formatDateTimeForDisplay(service.ngay_kq)}] sau Y lệnh thuốc đầu tiên [${formatDateTimeForDisplay(earliestDrugYl)}].`,
                    cost: costIfCritical(ruleKeyKqDvktSauThuoc, service.thanh_tien_bh),
                    itemName: service.ten_dich_vu
                });
            }
        });
    }
}
// =================================================================
// KẾT THÚC
// ==================================================================================================================================
     // BẮT ĐẦU: KIỂM TRA BÁC SĨ KHÁM TRONG NGÀY NGHỈ
    // =================================================================
    const ruleKeyBsNghi = 'BS_KHAM_TRONG_NGAY_NGHI';
    const hasSchedules = typeof doctorSchedules !== 'undefined' && Object.keys(doctorSchedules).length > 0;

    if (validationSettings[ruleKeyBsNghi]?.enabled && hasSchedules && record.bac_si_chi_dinh.size > 0) {
        const ngayKhamStr = record.ngayVao.substring(0, 8);
        const ngayKhamFormatted = `${ngayKhamStr.substring(0,4)}-${ngayKhamStr.substring(4,6)}-${ngayKhamStr.substring(6,8)}`;

        record.bac_si_chi_dinh.forEach(maBS => {
            const doctorSchedule = doctorSchedules[maBS];
            if (doctorSchedule && doctorSchedule.includes(ngayKhamFormatted)) {
                const tenBS = staffNameMap.get(maBS) || maBS;
                record.errors.push({
                    type: ruleKeyBsNghi,
                    severity: validationSettings[ruleKeyBsNghi].severity,
                    message: `BS CĐ ${tenBS} có lịch nghỉ vào ngày khám [${formatDateTimeForDisplay(record.ngayVao)}].`,
                    cost: record.t_bhtt,
                    itemName: `Toàn bộ hồ sơ do BS ${tenBS} chỉ định`
                });
            }
        });
    }
    // =================================================================
    // KẾT THÚC: KIỂM TRA BÁC SĨ KHÁM TRONG NGÀY NGHỈ
    // =================================================================
  // =================================================================
// BẮT ĐẦU: KIỂM TRA THYL DVKT (KHÁC KHÁM) TRÙNG VỚI THYL THUỐC
// =================================================================
const ruleKeyThylConflict = 'THUOC_DVKT_THYL_TRUNG_GIO';
// Giả định rằng ruleKeyThylConflict đã được định nghĩa là 'DVKT_THYL_SAU_THUOC_THYL'
// hoặc một mã lỗi tương ứng cho quy tắc này.
if (validationSettings[ruleKeyThylConflict]?.enabled && record.drugs.length > 0 && record.services.length > 0) {
    
    // 1. Lấy tất cả các mốc thời gian THYL của thuốc và lọc ra các giá trị hợp lệ
    const drugThylTimes = record.drugs.map(d => d.ngay_th_yl).filter(Boolean);

    if (drugThylTimes.length > 0) {
        // 2. Tìm ra thời gian THYL của thuốc sớm nhất để làm mốc so sánh
        const earliestDrugThyl = drugThylTimes.reduce((min, current) => current < min ? current : min, drugThylTimes[0]);

        // 3. Lặp qua các dịch vụ trong cùng hồ sơ
        record.services.forEach(service => {
            const isKham = (service.ten_dich_vu || '').toLowerCase().includes('khám');
            
            // 4. ĐIỀU KIỆN ĐÃ SỬA: Kiểm tra nếu THYL của dịch vụ BẰNG HOẶC SAU THYL của thuốc sớm nhất
            if (!isKham && service.ngay_th_yl && service.ngay_th_yl >= earliestDrugThyl) {
                
                record.errors.push({
                    type: ruleKeyThylConflict,
                    severity: validationSettings[ruleKeyThylConflict].severity,
                    // 5. Cập nhật thông báo lỗi để phản ánh đúng logic "bằng hoặc sau"
                    message: `DVKT "${service.ten_dich_vu}" có THYL [${formatDateTimeForDisplay(service.ngay_th_yl)}] bằng hoặc sau THYL của thuốc đầu tiên [${formatDateTimeForDisplay(earliestDrugThyl)}].`,
                    cost: costIfCritical(ruleKeyThylConflict, service.thanh_tien_bh),
                    itemName: service.ten_dich_vu
                });
            }
        });
    }
}
// =================================================================
// KẾT THÚC
// =================================================================

    const isSimple = record.t_thuoc > 0 &&
        record.t_xn === 0 &&
        record.t_cdha === 0 &&
        record.t_pttt === 0 &&
        record.t_vtyt === 0 &&
        record.t_mau === 0 &&
        record.t_giuong === 0 &&
        record.t_vanchuyen === 0 &&
        tongTienDVKTKhacKham === 0;
    record.isSimpleCase = isSimple;
    
    return { record, drugs: drugsForGlobalList, xml4Data };
}


function displayValidatorResults() {
    updateErrorTypeFilter();
    applyFilters();
}

function updateErrorTypeFilter() {
    const errorTypeFilter = document.getElementById('errorTypeFilter');
    const errorTypes = new Set(globalData.allRecords.flatMap(r => r.errors.map(e => e.type)));
    errorTypeFilter.innerHTML = '<option value="">Tất cả loại lỗi</option>';
    errorTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = ERROR_TYPES[type] || type;
        errorTypeFilter.appendChild(option);
    });
}

function applyFilters() {
    const filters = {
        errorType: document.getElementById('errorTypeFilter').value,
        severity: document.getElementById('severityFilter').value,
        searchText: document.getElementById('searchBox').value.toLowerCase(),
        staffName: document.getElementById('maBsFilter').value.toLowerCase().trim(),
        dateFrom: document.getElementById('dateFromFilter').value.replace(/-/g, ''),
        dateTo: document.getElementById('dateToFilter').value.replace(/-/g, ''),
        gender: document.getElementById('genderFilter').value,
        bncct: document.getElementById('bncctFilter').value,
        dvkt: document.getElementById('dvktFilter').value,
        missingXml4: document.getElementById('missingXml4Filter').value
    };

    globalData.filteredRecords = globalData.allRecords.filter(r => {
        if (filters.errorType && !r.errors.some(e => e.type === filters.errorType)) return false;
        if (filters.severity) {
            if (filters.severity === 'success' && r.errors.length > 0) return false;
            if (filters.severity === 'critical' && !r.errors.some(e => e.severity === 'critical')) return false;
            if (filters.severity === 'warning' && (!r.errors.some(e => e.severity === 'warning') || r.errors.some(e => e.severity === 'critical'))) return false;
        }
        if (filters.searchText && !`${r.hoTen} ${r.maLk} ${r.maBn}`.toLowerCase().includes(filters.searchText)) return false;
        
        if (filters.staffName) {
            const staffCodes = [...r.bac_si_chi_dinh, ...r.nguoi_thuc_hien];
            const hasMatchingStaff = staffCodes.some(code => {
                const name = staffNameMap.get(code);
                return name && name.toLowerCase().includes(filters.staffName);
            });
            if (!hasMatchingStaff) return false;
        }

        const recordDate = String(r.ngayVao).substring(0, 8);
        if (filters.dateFrom && recordDate < filters.dateFrom) return false;
        if (filters.dateTo && recordDate > filters.dateTo) return false;
        if (filters.gender && r.gioiTinh !== filters.gender) return false;
        
        if (filters.bncct === 'yes' && (!r.t_bncct || r.t_bncct <= 0)) return false;
        if (filters.bncct === 'no' && r.t_bncct && r.t_bncct > 0) return false;

        if (filters.dvkt === 'yes' && !r.has_kham_and_dvkt) return false;
        if (filters.dvkt === 'no' && r.has_kham_and_dvkt) return false;
        
        if (filters.missingXml4 === 'yes' && !(r.has_kham_and_dvkt && !r.has_xml4)) return false;

        return true;
    });
    
    globalData.currentPage = 1;
    updateResultsTable();
}

function updateResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    const startIndex = (globalData.currentPage - 1) * globalData.pageSize;
    const pageRecords = globalData.filteredRecords.slice(startIndex, startIndex + globalData.pageSize);
    
    tbody.innerHTML = '';
    pageRecords.forEach((record, index) => {
        const row = tbody.insertRow();
        row.onclick = () => handleRowClick(record);
        if(record.has_xml4) {
            row.classList.add('has-xml4');
        }

        let statusClass = 'status-success', statusText = '🟢 Hợp lệ';
        if (record.errors.length > 0) {
            const hasCritical = record.errors.some(e => e.severity === 'critical');
            statusClass = hasCritical ? 'status-error' : 'status-warning';
            statusText = hasCritical ? `🔴 Có ${record.errors.length} lỗi` : `🟡 Có ${record.errors.length} cảnh báo`;
        }

        const errorDetails = record.errors.map(e => `<div class="error-detail"><span class="status-badge ${e.severity === 'critical' ? 'status-error' : 'status-warning'}">${ERROR_TYPES[e.type] || e.type}</span> <small>${e.message}</small></div>`).join('');
        
        const formatStaffInfo = (staffSet) => {
            if (!staffSet || staffSet.size === 0) return '';
            return Array.from(staffSet).map(code => {
                const name = staffNameMap.get(code);
                return name ? `${name} (${code})` : code;
            }).join(',<br>');
        };

        const bsInfo = formatStaffInfo(record.bac_si_chi_dinh);
        const nthInfo = formatStaffInfo(record.nguoi_thuc_hien);

        row.innerHTML = `
            <td>${record.has_xml4 ? '<span class="xml4-indicator"></span>' : ''}${startIndex + index + 1}</td>
            <td>
                <strong>${record.hoTen}</strong><br>
                <small class="copyable" onclick="copyToClipboard(event, '${record.maLk}')">LK: ${record.maLk}</small>
                ${record.maBn ? `<br><small class="copyable" onclick="copyToClipboard(event, '${record.maBn}')">BN: ${record.maBn}</small>` : ''}
            </td>
            <td><strong>Vào:</strong> ${formatDateTimeForDisplay(record.ngayVao)}<br><strong>Ra:</strong> ${formatDateTimeForDisplay(record.ngayRa)}</td>
            <td>
                ${formatCurrency(record.t_bhtt)}
                ${record.ngayTtoan ? `<br><small style="color: #555;">TT: ${formatDateTimeForDisplay(record.ngayTtoan)}</small>` : ''}
            </td>
            <td>${bsInfo ? `<strong>BS CĐ:</strong> ${bsInfo}` : ''}${nthInfo ? `<br><strong>Người TH:</strong> ${nthInfo}`: ''}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${errorDetails || '<span class="status-badge status-success">Không có lỗi</span>'}</td>
        `;
    });
    
    updatePagination();
    updateResultsInfo();
}

function copyToClipboard(event, text) {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
        alert(`Đã sao chép: ${text}`);
    }).catch(err => {
        console.error('Không thể sao chép: ', err);
    });
}

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    const totalPages = Math.ceil(globalData.filteredRecords.length / globalData.pageSize);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <button onclick="changePage(1)" ${globalData.currentPage === 1 ? 'disabled' : ''}>« Đầu</button>
        <button onclick="changePage(${globalData.currentPage - 1})" ${globalData.currentPage === 1 ? 'disabled' : ''}>‹ Trước</button>
        <span class="page-info">Trang ${globalData.currentPage} / ${totalPages}</span>
        <button onclick="changePage(${globalData.currentPage + 1})" ${globalData.currentPage === totalPages ? 'disabled' : ''}>Tiếp ›</button>
        <button onclick="changePage(${totalPages})" ${globalData.currentPage === totalPages ? 'disabled' : ''}>Cuối »</button>
    `;
}

function changePage(page) {
    globalData.currentPage = page;
    updateResultsTable();
}

function updateResultsInfo() {
    const info = document.getElementById('resultsInfo');
    const total = globalData.filteredRecords.length;
    const start = total > 0 ? (globalData.currentPage - 1) * globalData.pageSize + 1 : 0;
    const end = Math.min(globalData.currentPage * globalData.pageSize, total);
    info.textContent = `Hiển thị ${start}-${end} trong tổng số ${total.toLocaleString('vi-VN')} kết quả`;
}

function clearFilters() {
    document.getElementById('validatorFilters').querySelectorAll('input, select').forEach(el => {
        if (el.type !== 'button') el.value = '';
    });
    applyFilters();
}

function exportToExcel(errorsOnly = false) {
    const recordsToExport = errorsOnly 
        ? globalData.filteredRecords.filter(r => r.errors.length > 0)
        : globalData.filteredRecords;

    if (recordsToExport.length === 0) return alert('Không có dữ liệu để xuất!');
    
    const wb = XLSX.utils.book_new();
    
    const stats = calculateGlobalStats(recordsToExport);
    const summaryData = [
        ['BÁO CÁO KIỂM TRA FILE XML BHYT'],
        ['Thời gian tạo:', new Date().toLocaleString('vi-VN')], [],
        ['THỐNG KÊ TỔNG QUAN'],
        ['Tổng hồ sơ đã lọc:', recordsToExport.length],
        ['Tổng chi phí BHYT TT:', stats.totalAmount],
        ['Tỷ lệ lỗi:', `${stats.errorRate.toFixed(2)}%`], [],
        ['PHÂN BỐ LỖI'],
        ['Loại lỗi', 'Số lượng']
    ];
    Object.entries(stats.errorTypes).forEach(([type, count]) => {
        summaryData.push([ERROR_TYPES[type] || type, count]);
    });
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Quan');

    const data = recordsToExport.map((r, i) => ({
        'STT': i + 1, 'Họ Tên': r.hoTen, 'Mã LK': r.maLk, 'Mã BN': r.maBn,
        'Ngày Vào': formatDateTimeForDisplay(r.ngayVao), 'Ngày Ra': formatDateTimeForDisplay(r.ngayRa),
        'BHYT TT': r.t_bhtt, 'BN CCT': r.t_bncct, 'Tổng Chi': r.t_tongchi,
        'Trạng Thái': r.errors.length > 0 ? (r.errors.some(e => e.severity === 'critical') ? 'Lỗi nghiêm trọng' : 'Cảnh báo') : 'Hợp lệ',
        'Chi Tiết Lỗi': r.errors.map(e => `${ERROR_TYPES[e.type] || e.type}: ${e.message}`).join('\n')
    }));
    const wsData = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, wsData, 'Chi_Tiet');

    XLSX.writeFile(wb, errorsOnly ? 'BaoCaoLoi_BHYT.xlsx' : 'BaoCaoKiemTra_BHYT.xlsx');
}

function exportDvktPlusKham() {
    const recordsToExport = globalData.allRecords.filter(r => r.has_kham_and_dvkt);
    if (recordsToExport.length === 0) {
        alert('Không có hồ sơ nào vừa có công khám, vừa có DVKT khác.');
        return;
    }

    const data = recordsToExport.map((r, i) => ({
        'STT': i + 1, 'Mã LK': r.maLk, 'Họ Tên': r.hoTen, 'Mã BN': r.maBn,
        'Ngày Vào': formatDateTimeForDisplay(r.ngayVao),
        'Tổng tiền Khám (BH)': r.tong_tien_kham,
        'Tổng tiền DVKT khác (BH)': r.tong_tien_dvkt_khac,
        'Tổng BHYT TT': r.t_bhtt
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DVKT_va_Kham');
    XLSX.writeFile(wb, 'BaoCao_DVKT_va_Kham.xlsx');
}

// ============================= XML4 MODAL =============================
function handleRowClick(record) {
    if (record.has_xml4) {
        displayXml4Details(record.maLk);
    } else {
        alert('Không có dữ liệu CLS (XML4) cho hồ sơ này.');
    }
}

function displayXml4Details(maLk) {
    const details = globalData.allXml4Details.get(maLk);
    if (!details || details.length === 0) {
        alert('Không tìm thấy dữ liệu chi tiết CLS (XML4).');
        return;
    }

    const modal = document.getElementById('xml4Modal');
    const title = document.getElementById('xml4ModalTitle');
    const container = document.getElementById('xml4DetailsTableContainer');
    
    const record = globalData.allRecords.find(r => r.maLk === maLk);
    title.textContent = `Chi tiết CLS - BN: ${record.hoTen} (${record.maLk})`;

    // MỚI: Thêm 2 cột mới vào header của bảng
    let tableHTML = `<table class="results-table"><thead><tr>
        <th>STT</th>
        <th>Mã Dịch Vụ</th>
        <th>Tên Chỉ Số</th>
        <th>Giá Trị</th>
        <th>Đơn Vị</th>
        <th>Ngày Kết Quả</th>
        <th>Người Thực Hiện</th>
        <th>BS Đọc KQ</th>
    </tr></thead><tbody>`;

    details.forEach((item, index) => {
        // Map mã sang tên cho Người thực hiện và BS đọc KQ
        const performerName = staffNameMap.get(item.nguoi_thuc_hien) || item.nguoi_thuc_hien || 'N/A';
        const doctorName = staffNameMap.get(item.ma_bs_doc_kq) || item.ma_bs_doc_kq || 'N/A';

        tableHTML += `<tr>
            <td>${index + 1}</td>
            <td>${item.ma_dich_vu}</td>
            <td>${item.ten_chi_so}</td>
            <td>${item.gia_tri}</td>
            <td>${item.don_vi_do}</td>
            <td>${item.ngay_kq}</td>
            <td>${performerName}</td>
            <td>${doctorName}</td>
        </tr>`;
    });

    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
    modal.style.display = 'block';
}

function closeXml4Modal() {
    document.getElementById('xml4Modal').style.display = 'none';
}

// ============================= SUMMARY POPUP =============================
function showSummaryPopup(stats) {
    document.getElementById('summaryTotal').textContent = stats.total.toLocaleString('vi-VN');
    document.getElementById('summaryError').textContent = stats.totalError.toLocaleString('vi-VN');
    document.getElementById('summaryCritical').textContent = stats.criticalError.toLocaleString('vi-VN');
    document.getElementById('summaryWarningOnly').textContent = stats.warningOnly.toLocaleString('vi-VN');
    document.getElementById('summaryDenialAmount').textContent = formatCurrency(stats.denialAmount);
    document.getElementById('summaryValid').textContent = stats.valid.toLocaleString('vi-VN');
    document.getElementById('summaryModal').style.display = 'block';
}

function closeSummaryPopup() {
    document.getElementById('summaryModal').style.display = 'none';
}

// ============================= SETTINGS MODAL =============================
function openSettingsModal() {
    const tbody = document.getElementById('settingsTableBody');
    tbody.innerHTML = ''; 

    Object.entries(validationSettings).forEach(([key, setting]) => {
        if (!setting.isConfigurable) return;

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>
                <label class="switch">
                    <input type="checkbox" data-key="${key}" class="setting-enabled" ${setting.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </td>
            <td>${ERROR_TYPES[key] || key}</td>
            <td>
                <select class="filter-select setting-severity" data-key="${key}" style="padding: 5px 10px;">
                    <option value="warning" ${setting.severity === 'warning' ? 'selected' : ''}>🟡 Cảnh báo</option>
                    <option value="critical" ${setting.severity === 'critical' ? 'selected' : ''}>🔴 Nghiêm trọng</option>
                </select>
            </td>
        `;
    });
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    document.querySelectorAll('#settingsTableBody tr').forEach(row => {
        const enabledCheckbox = row.querySelector('.setting-enabled');
        const severitySelect = row.querySelector('.setting-severity');
        const key = enabledCheckbox.dataset.key;

        if (validationSettings[key]) {
            validationSettings[key].enabled = enabledCheckbox.checked;
            validationSettings[key].severity = severitySelect.value;
        }
    });
    closeSettingsModal();
    
    if (globalData.xmlDataContent) {
        alert('Đã lưu cài đặt. Đang áp dụng lại quy tắc kiểm tra...');
        showLoading('validatorLoading');
        setTimeout(() => processXmlContent(globalData.xmlDataContent), 100);
    } else {
        alert('Đã lưu cài đặt. Thay đổi sẽ được áp dụng cho lần kiểm tra tiếp theo.');
    }
}

window.onclick = function(event) {
    const xmlModal = document.getElementById('xml4Modal');
    const summaryModal = document.getElementById('summaryModal');
    const settingsModal = document.getElementById('settingsModal');
    if (event.target == xmlModal) xmlModal.style.display = "none";
    if (event.target == summaryModal) summaryModal.style.display = "none";
    if (event.target == settingsModal) settingsModal.style.display = "none";
}

// ============================= COMPARATOR FUNCTIONALITY (UPGRADED) =============================
function initializeComparator() {
    document.getElementById('comparatorXmlInput').addEventListener('change', (e) => handleFileUpload(e, 'xml'));
    document.getElementById('comparatorExcelInput').addEventListener('change', (e) => handleFileUpload(e, 'excel'));
    document.getElementById('compareButton').addEventListener('click', performComparison);
}

function findKey(obj, possibleKeys) {
    if(!obj) return null;
    const upperKeys = possibleKeys.map(k => k.toUpperCase().replace(/ /g, ''));
    for (const key in obj) {
        if (upperKeys.includes(key.trim().toUpperCase().replace(/ /g, ''))) {
            return key;
        }
    }
    return null;
}

async function performComparison() {
    showLoading('comparatorLoading');
    try {
        const xmlContent = await globalData.xmlFile.text();
        const { records: xmlRecordsRaw } = validateXmlContent(xmlContent);
        globalData.xmlRecords.clear();
        xmlRecordsRaw.forEach(r => globalData.xmlRecords.set(String(r.maLk), r));

        globalData.excelRecords.clear();
        const file = globalData.excelFile;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const excelJson = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { cellDates: true });

            excelJson.forEach(row => {
                const maLkKey = findKey(row, ['MA_LK', 'MÃ LK', 'MÃ LIÊN KẾT']);
                if(maLkKey && row[maLkKey]) {
                    globalData.excelRecords.set(String(row[maLkKey]), row);
                }
            });
            
            const allKeys = new Set([...globalData.xmlRecords.keys(), ...globalData.excelRecords.keys()]);
            globalData.comparisonResults = [];
            for (const key of allKeys) {
                const xmlRec = globalData.xmlRecords.get(key);
                const excelRec = globalData.excelRecords.get(key);
                
                let result = { key, xmlRec, excelRec, status: 'mismatch', details: [] };
                
                if (xmlRec && excelRec) {
                    const t_bhtt_xml = xmlRec.t_bhtt || 0;
                    const t_bhtt_excel_key = findKey(excelRec, ['BẢO HIỂM TT', 'BAOHIEMTT', 'T_BHTT']);
                    const t_bhtt_excel = t_bhtt_excel_key ? (parseFloat(excelRec[t_bhtt_excel_key]) || 0) : 0;
                    if(Math.abs(t_bhtt_xml - t_bhtt_excel) > 1) { 
                        result.details.push(`BHYT TT: XML=${formatCurrency(t_bhtt_xml)} vs Excel=${formatCurrency(t_bhtt_excel)}`);
                    }
                    
                    const t_bncct_xml = xmlRec.t_bncct || 0;
                    const t_bncct_excel_key = findKey(excelRec, ['BỆNH NHÂN CCT', 'BENHNHANCCT', 'T_BNCCT']);
                    const t_bncct_excel = t_bncct_excel_key ? (parseFloat(excelRec[t_bncct_excel_key]) || 0) : 0;
                    if(Math.abs(t_bncct_xml - t_bncct_excel) > 1) {
                        result.details.push(`BN CCT: XML=${formatCurrency(t_bncct_xml)} vs Excel=${formatCurrency(t_bncct_excel)}`);
                    }

                    const displayVaoXML = flexibleFormatDate(xmlRec.ngayVao);
                    const excelVaoKey = findKey(excelRec, ['NGAY_VAO', 'NGÀY VÀO']);
                    const displayVaoExcel = flexibleFormatDate(excelRec[excelVaoKey]);

                    if (displayVaoXML !== 'N/A' && displayVaoExcel !== 'N/A' && displayVaoXML !== displayVaoExcel) {
                        result.details.push(`Ngày vào: XML=${displayVaoXML} vs Excel=${displayVaoExcel}`);
                    }

                    const displayRaXML = flexibleFormatDate(xmlRec.ngayRa);
                    const excelRaKey = findKey(excelRec, ['NGAY_RA', 'NGÀY RA']);
                    const displayRaExcel = flexibleFormatDate(excelRec[excelRaKey]);

                    if (displayRaXML !== 'N/A' && displayRaExcel !== 'N/A' && displayRaXML !== displayRaExcel) {
                        result.details.push(`Ngày ra: XML=${displayRaXML} vs Excel=${displayRaExcel}`);
                    }

                    const xmlChanDoan = (xmlRec.chanDoan || '').trim().toUpperCase();
                    const excelChanDoanKey = findKey(excelRec, ['CHAN_DOAN_RV', 'CHẨN ĐOÁN', 'MA_BENH', 'MÃ BỆNH']);
                    const excelChanDoan = excelChanDoanKey ? (String(excelRec[excelChanDoanKey]) || '').trim().toUpperCase() : '';
                    if (xmlChanDoan && excelChanDoan && !xmlChanDoan.startsWith(excelChanDoan)) {
                        result.details.push(`Chẩn đoán: XML=${xmlChanDoan} vs Excel=${excelChanDoan}`);
                    }
                    
                    result.status = result.details.length === 0 ? 'match' : 'mismatch';

                } else if (xmlRec) {
                    result.status = 'xml-only';
                } else {
                    result.status = 'excel-only';
                }
                globalData.comparisonResults.push(result);
            }
            
            hideLoading('comparatorLoading');
            document.getElementById('comparatorResults').style.display = 'block';
            applyComparatorFilters();
        };
        reader.readAsArrayBuffer(file);

    } catch (error) {
        hideLoading('comparatorLoading');
        console.error("Comparison Error:", error);
        alert(`Lỗi đối chiếu: ${error.message}`);
    }
}

function applyComparatorFilters() {
    const status = document.getElementById('statusFilter').value;
    const maLk = document.getElementById('maLkSearch').value.toLowerCase();
    const patientName = document.getElementById('patientSearch').value.toLowerCase();

    globalData.filteredComparisonResults = globalData.comparisonResults.filter(r => {
        if (status && r.status !== status) return false;
        if (maLk && !r.key.toLowerCase().includes(maLk)) return false;
        if (patientName) {
            const xmlName = r.xmlRec?.hoTen?.toLowerCase() || '';
            const excelHoTenKey = r.excelRec ? findKey(r.excelRec, ['HO_TEN', 'HỌ TÊN']) : null;
            const excelName = excelHoTenKey ? String(r.excelRec[excelHoTenKey]).toLowerCase() : '';
            if (!xmlName.includes(patientName) && !excelName.includes(patientName)) return false;
        }
        return true;
    });
    displayComparatorResults();
}

function displayComparatorResults() {
    const wrapper = document.getElementById('comparatorResultsTableWrapper');
    const info = document.getElementById('comparatorResultsInfo');
    
    let tableHTML = `<table class="results-table"><thead><tr>
        <th>Mã LK</th>
        <th>Trạng thái</th>
        <th>Thông tin XML</th>
        <th>Thông tin file đối chiếu</th>
        <th>Chi tiết không khớp</th>
    </tr></thead><tbody>`;

    if (globalData.filteredComparisonResults.length === 0) {
        tableHTML += `<tr><td colspan="5" style="text-align:center;">Không tìm thấy kết quả phù hợp.</td></tr>`;
    } else {
        globalData.filteredComparisonResults.forEach(r => {
            const xmlName = r.xmlRec?.hoTen || 'N/A';
            const xml_t_bhtt = r.xmlRec ? formatCurrency(r.xmlRec.t_bhtt) : 'N/A';
            const xml_t_bncct = r.xmlRec ? formatCurrency(r.xmlRec.t_bncct) : 'N/A';
            const xml_ngay_vao = r.xmlRec ? flexibleFormatDate(r.xmlRec.ngayVao) : 'N/A';
            const xml_ngay_ra = r.xmlRec ? flexibleFormatDate(r.xmlRec.ngayRa) : 'N/A';
            const xml_ngay_ttoan = r.xmlRec ? flexibleFormatDate(r.xmlRec.ngayTtoan) : 'N/A';
            const xml_chan_doan = r.xmlRec?.chanDoan || 'N/A';

            const excelHoTenKey = r.excelRec ? findKey(r.excelRec, ['HO_TEN', 'HỌ TÊN', 'TÊN BỆNH NHÂN']) : null;
            const excelName = excelHoTenKey ? r.excelRec[excelHoTenKey] : 'N/A';
            
            const excelBHTTKey = r.excelRec ? findKey(r.excelRec, ['BẢO HIỂM TT', 'BAOHIEMTT', 'T_BHTT']) : null;
            const excel_t_bhtt = excelBHTTKey ? formatCurrency(r.excelRec[excelBHTTKey]) : 'N/A';

            const excelBNCCTKey = r.excelRec ? findKey(r.excelRec, ['BỆNH NHÂN CCT', 'BENHNHANCCT', 'T_BNCCT']) : null;
            const excel_t_bncct = excelBNCCTKey ? formatCurrency(r.excelRec[excelBNCCTKey]) : 'N/A';
            
            const excelNgayVaoKey = r.excelRec ? findKey(r.excelRec, ['NGAY_VAO', 'NGÀY VÀO']) : null;
            const excel_ngay_vao = excelNgayVaoKey ? flexibleFormatDate(r.excelRec[excelNgayVaoKey]) : 'N/A';
            
            const excelNgayRaKey = r.excelRec ? findKey(r.excelRec, ['NGAY_RA', 'NGÀY RA']) : null;
            const excel_ngay_ra = excelNgayRaKey ? flexibleFormatDate(r.excelRec[excelNgayRaKey]) : 'N/A';

            const excelNgayTToanKey = r.excelRec ? findKey(r.excelRec, ['NGAY_TTOAN', 'NGÀY THANH TOÁN', 'NGAY TT', 'NGÀY TT']) : null;
            const excel_ngay_ttoan = excelNgayTToanKey ? flexibleFormatDate(r.excelRec[excelNgayTToanKey]) : 'N/A';

            const excelChanDoanKey = r.excelRec ? findKey(r.excelRec, ['CHAN_DOAN_RV', 'CHẨN ĐOÁN', 'MA_BENH', 'MÃ BỆNH']) : null;
            const excel_chan_doan = excelChanDoanKey ? r.excelRec[excelChanDoanKey] : 'N/A';

            const statusMap = {
                match: { text: '✅ Khớp', class: 'status-match' },
                mismatch: { text: '❌ Không khớp', class: 'status-mismatch' },
                'xml-only': { text: '📄 Chỉ có trong XML', class: 'status-xml-only' },
                'excel-only': { text: '📊 Chỉ có trong file đối chiếu', class: 'status-excel-only' }
            };
            
            const isMismatch = r.status === 'mismatch';
            
            let detailsHtml = '';
            if (r.details && r.details.length > 0) {
                detailsHtml = `<div class="comparator-details"><ul><li>${r.details.join('</li><li>')}</li></ul></div>`;
            }

            tableHTML += `
                <tr class="${r.status}">
                    <td>${r.key}</td>
                    <td><span class="status-badge ${statusMap[r.status].class}">${statusMap[r.status].text}</span></td>
                    <td>
                        <strong>${xmlName}</strong><br>
                        <span ${isMismatch && r.details.some(d => d.startsWith('BHYT')) ? 'style="color:red;"':''}>BHYT TT: ${xml_t_bhtt}</span><br>
                        <span ${isMismatch && r.details.some(d => d.startsWith('BN CCT')) ? 'style="color:red;"':''}>BN CCT: ${xml_t_bncct}</span><br>
                        <small ${isMismatch && r.details.some(d => d.startsWith('Ngày vào')) ? 'style="color:red;"':''}>Vào: ${xml_ngay_vao}</small> | 
                        <small ${isMismatch && r.details.some(d => d.startsWith('Ngày ra')) ? 'style="color:red;"':''}>Ra: ${xml_ngay_ra}</small><br>
                        <small>TT: ${xml_ngay_ttoan} | </small>
                        <small ${isMismatch && r.details.some(d => d.startsWith('Chẩn đoán')) ? 'style="color:red;"':''}>CĐ: ${xml_chan_doan}</small>
                    </td>
                    <td>
                        <strong>${excelName}</strong><br>
                        <span ${isMismatch && r.details.some(d => d.startsWith('BHYT')) ? 'style="color:red;"':''}>BHYT TT: ${excel_t_bhtt}</span><br>
                        <span ${isMismatch && r.details.some(d => d.startsWith('BN CCT')) ? 'style="color:red;"':''}>BN CCT: ${excel_t_bncct}</span><br>
                        <small ${isMismatch && r.details.some(d => d.startsWith('Ngày vào')) ? 'style="color:red;"':''}>Vào: ${excel_ngay_vao}</small> | 
                        <small ${isMismatch && r.details.some(d => d.startsWith('Ngày ra')) ? 'style="color:red;"':''}>Ra: ${excel_ngay_ra}</small><br>
                        <small>TT: ${excel_ngay_ttoan} | </small>
                        <small ${isMismatch && r.details.some(d => d.startsWith('Chẩn đoán')) ? 'style="color:red;"':''}>CĐ: ${excel_chan_doan}</small>
                    </td>
                    <td>${detailsHtml}</td>
                </tr>
            `;
        });
    }

    tableHTML += '</tbody></table>';
    wrapper.innerHTML = tableHTML;
    info.textContent = `Tìm thấy ${globalData.filteredComparisonResults.length.toLocaleString('vi-VN')} kết quả.`;
}

function clearComparatorFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('maLkSearch').value = '';
    document.getElementById('patientSearch').value = '';
    applyComparatorFilters();
}

function exportComparatorResults() {
    if (globalData.filteredComparisonResults.length === 0) return alert('Không có dữ liệu để xuất!');
    
    const data = globalData.filteredComparisonResults.map(r => {
        const excelHoTenKey = r.excelRec ? findKey(r.excelRec, ['HO_TEN', 'HỌ TÊN']) : null;
        const excelBHTTKey = r.excelRec ? findKey(r.excelRec, ['BẢO HIỂM TT', 'BAOHIEMTT', 'T_BHTT']) : null;
        const excelBNCCTKey = r.excelRec ? findKey(r.excelRec, ['BỆNH NHÂN CCT', 'BENHNHANCCT', 'T_BNCCT']) : null;
        const excelNgayVaoKey = r.excelRec ? findKey(r.excelRec, ['NGAY_VAO', 'NGÀY VÀO']) : null;
        const excelNgayRaKey = r.excelRec ? findKey(r.excelRec, ['NGAY_RA', 'NGÀY RA']) : null;
        const excelNgayTToanKey = r.excelRec ? findKey(r.excelRec, ['NGAY_TTOAN', 'NGÀY THANH TOÁN', 'NGAY TT', 'NGÀY TT']) : null;
        const excelChanDoanKey = r.excelRec ? findKey(r.excelRec, ['CHAN_DOAN_RV', 'CHẨN ĐOÁN', 'MA_BENH', 'MÃ BỆNH']) : null;

        return {
            'Mã LK': r.key,
            'Trạng thái': r.status,
            'Tên BN (XML)': r.xmlRec?.hoTen,
            'BHYT TT (XML)': r.xmlRec?.t_bhtt,
            'BN CCT (XML)': r.xmlRec?.t_bncct,
            'Ngày Vào (XML)': r.xmlRec ? flexibleFormatDate(r.xmlRec.ngayVao) : null,
            'Ngày Ra (XML)': r.xmlRec ? flexibleFormatDate(r.xmlRec.ngayRa) : null,
            'Ngày TT (XML)': r.xmlRec ? flexibleFormatDate(r.xmlRec.ngayTtoan) : null,
            'Chẩn Đoán (XML)': r.xmlRec?.chanDoan,
            'Tên BN (File đối chiếu)': excelHoTenKey ? r.excelRec[excelHoTenKey] : null,
            'BHYT TT (File đối chiếu)': excelBHTTKey ? r.excelRec[excelBHTTKey] : null,
            'BN CCT (File đối chiếu)': excelBNCCTKey ? r.excelRec[excelBNCCTKey] : null,
            'Ngày Vào (File đối chiếu)': excelNgayVaoKey ? flexibleFormatDate(r.excelRec[excelNgayVaoKey]) : null,
            'Ngày Ra (File đối chiếu)': excelNgayRaKey ? flexibleFormatDate(r.excelRec[excelNgayRaKey]) : null,
            'Ngày TT (File đối chiếu)': excelNgayTToanKey ? flexibleFormatDate(r.excelRec[excelNgayTToanKey]) : null,
            'Chẩn Đoán (File đối chiếu)': excelChanDoanKey ? r.excelRec[excelChanDoanKey] : null,
            'Chi tiết không khớp': r.details ? r.details.join('; ') : ''
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQuaDoiChieu");
    XLSX.writeFile(wb, "BaoCaoDoiChieu_BHYT.xlsx");
}

// ============================= DENIAL PROJECTION FUNCTIONALITY =============================
function updateDenialProjectionTab() {
    if (globalData.allRecords.length === 0) {
        document.getElementById('denialResultsTableWrapper').innerHTML = '<p style="text-align:center; padding: 20px;">Chưa có dữ liệu. Vui lòng xử lý một file XML tại tab "Kiểm tra XML" trước.</p>';
        return;
    }

    const dateFrom = document.getElementById('denialDateFrom').value.replace(/-/g, '');
    const dateTo = document.getElementById('denialDateTo').value.replace(/-/g, '');

    const filteredRecords = globalData.allRecords.filter(r => {
        if (!dateFrom && !dateTo) return true;
        const recordDate = String(r.ngayVao).substring(0, 8);
        if (dateFrom && recordDate < dateFrom) return false;
        if (dateTo && recordDate > dateTo) return false;
        return true;
    });

    let totalDeniedAmount = 0;
    const recordsWithErrors = new Set();
    let totalDeniedItemCount = 0;
    const deniedItems = {};

    filteredRecords.forEach(record => {
        const itemErrors = record.errors.filter(e => e.severity === 'critical' && e.cost > 0 && e.itemName);
        if (itemErrors.length === 0) {
            return;
        }

        recordsWithErrors.add(record.maLk);
        const countedItemsInRecord = new Set(); 

        itemErrors.forEach(error => {
            const itemKey = error.itemName;

            if (!deniedItems[itemKey]) {
                deniedItems[itemKey] = { count: 0, totalCost: 0, errorTypes: new Set() };
            }
            deniedItems[itemKey].count++;
            deniedItems[itemKey].errorTypes.add(ERROR_TYPES[error.type] || error.type);

            if (!countedItemsInRecord.has(itemKey)) {
                totalDeniedAmount += error.cost;
                deniedItems[itemKey].totalCost += error.cost;
                countedItemsInRecord.add(itemKey);
            }
        });
        
        totalDeniedItemCount += countedItemsInRecord.size;
    });

    document.getElementById('totalDeniedAmount').textContent = formatCurrency(totalDeniedAmount);
    document.getElementById('recordsWithDenial').textContent = recordsWithErrors.size.toLocaleString('vi-VN');
    document.getElementById('totalDeniedItems').textContent = totalDeniedItemCount.toLocaleString('vi-VN');

    const tableData = Object.entries(deniedItems).map(([name, data]) => ({
        name,
        ...data
    }));
    tableData.sort((a, b) => b.totalCost - a.totalCost);

    let tableHTML = `<table class="results-table"><thead><tr>
        <th>STT</th>
        <th>Tên Thuốc / Dịch vụ Kỹ thuật</th>
        <th>Loại Lỗi</th>
        <th>Số Lượng Lỗi</th>
        <th>Tổng Tiền Xuất Toán</th>
    </tr></thead><tbody>`;

    if (tableData.length === 0) {
        tableHTML += `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #155724; font-weight: bold;">🎉 Chúc mừng! Không tìm thấy mục nào bị xuất toán trong khoảng thời gian đã chọn.</td></tr>`;
    } else {
        tableData.forEach((item, index) => {
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${Array.from(item.errorTypes).join(', ')}</td>
                    <td>${item.count}</td>
                    <td>${formatCurrency(item.totalCost)}</td>
                </tr>
            `;
        });
    }

    tableHTML += '</tbody></table>';
    document.getElementById('denialResultsTableWrapper').innerHTML = tableHTML;
}

function clearDenialFilters() {
    document.getElementById('denialDateFrom').value = '';
    document.getElementById('denialDateTo').value = '';
    updateDenialProjectionTab();
}

// ============================= REPORTS TAB =============================
function generateReport() {
    if (globalData.allRecords.length === 0) {
        alert('Chưa có dữ liệu. Vui lòng kiểm tra một file XML trước.');
        return;
    }

    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value.replace(/-/g, '');
    const dateTo = document.getElementById('reportDateTo').value.replace(/-/g, '');

    const filteredForReport = globalData.allRecords.filter(r => {
        if (!dateFrom && !dateTo) return true;
        const recordDate = String(r.ngayVao).substring(0, 8);
        if (dateFrom && recordDate < dateFrom) return false;
        if (dateTo && recordDate > dateTo) return false;
        return true;
    });
    
    const stats = calculateGlobalStats(filteredForReport);
    let chart1Type, chart1Data, chart1Title;
    let chart2Type, chart2Data, chart2Title;

    switch(reportType) {
        case 'error-summary':
            const sortedErrors = Object.entries(stats.errorTypes).sort(([, a], [, b]) => b - a);
            chart1Type = 'bar';
            chart1Data = {
                labels: sortedErrors.map(([key]) => ERROR_TYPES[key] || key),
                datasets: [{ label: 'Số Lần Xuất Hiện', data: sortedErrors.map(([, count]) => count), backgroundColor: 'rgba(220, 53, 69, 0.8)' }]
            };
            chart1Title = 'Thống Kê Các Loại Lỗi Phổ Biến';

            chart2Type = 'doughnut';
            chart2Data = {
                labels: ['Hồ Sơ Hợp Lệ', 'Hồ Sơ Có Lỗi'],
                datasets: [{ data: [stats.totalRecords - stats.errorRecordsCount, stats.errorRecordsCount], backgroundColor: ['#28a745', '#dc3545'] }]
            };
            chart2Title = 'Tỷ Lệ Hồ Sơ Lỗi và Hợp Lệ';
            break;
        case 'time-analysis':
            const sortedTimeline = Object.entries(stats.timeline).sort(([a], [b]) => a.localeCompare(b));
            chart1Type = 'line';
            chart1Data = {
                labels: sortedTimeline.map(([day]) => `${day.substring(6,8)}/${day.substring(4,6)}`),
                datasets: [{ label: 'Số Hồ Sơ', data: sortedTimeline.map(([, count]) => count), borderColor: '#667eea', tension: 0.1 }]
            };
            chart1Title = 'Phân Tích Số Lượng Hồ Sơ Theo Ngày';

            const errorTimeline = {};
            filteredForReport.forEach(r => {
                if (r.errors.length > 0) {
                    const day = String(r.ngayVao).substring(0, 8);
                    errorTimeline[day] = (errorTimeline[day] || 0) + 1;
                }
            });
            const filledErrorTimelineData = sortedTimeline.map(([day]) => errorTimeline[day] || 0);
            chart2Type = 'line';
            chart2Data = {
                labels: sortedTimeline.map(([day]) => `${day.substring(6,8)}/${day.substring(4,6)}`),
                datasets: [{ label: 'Số Hồ Sơ Lỗi', data: filledErrorTimelineData, borderColor: '#dc3545', tension: 0.1 }]
            };
            chart2Title = 'Phân Tích Số Lượng Lỗi Theo Ngày';
            break;
        case 'cost-analysis':
            chart1Type = 'bar';
            chart1Data = {
                labels: Object.keys(stats.amounts),
                datasets: [{ label: 'Số Hồ Sơ', data: Object.values(stats.amounts), backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1'] }]
            };
            chart1Title = 'Phân Bố Hồ Sơ Theo Khoảng Chi Phí BHYT TT';

            const costByDay = {};
            filteredForReport.forEach(r => {
                const day = String(r.ngayVao).substring(0, 8);
                costByDay[day] = (costByDay[day] || 0) + r.t_bhtt;
            });
            const sortedCostByDay = Object.entries(costByDay).sort(([a], [b]) => a.localeCompare(b));
            chart2Type = 'bar';
            chart2Data = {
                labels: sortedCostByDay.map(([day]) => `${day.substring(6,8)}/${day.substring(4,6)}`),
                datasets: [{ label: 'Tổng Chi Phí BHYT TT (VNĐ)', data: sortedCostByDay.map(([, cost]) => cost), backgroundColor: 'rgba(54, 162, 235, 0.8)' }]
            };
            chart2Title = 'Tổng Chi Phí BHYT TT Theo Ngày';
            break;
        case 'department-analysis':
            const sortedDepts = Object.entries(stats.departments).sort(([, a], [, b]) => b - a).slice(0, 15);
            chart1Type = 'bar';
            chart1Data = {
                labels: sortedDepts.map(([name]) => name || 'Không xác định'),
                datasets: [{ label: 'Số Hồ Sơ', data: sortedDepts.map(([, count]) => count), backgroundColor: 'rgba(75, 192, 192, 0.8)'}]
            };
            chart1Title = 'Top 15 Khoa Theo Số Lượng Hồ Sơ';

            const costByDept = {};
            filteredForReport.forEach(r => {
                costByDept[r.maKhoa] = (costByDept[r.maKhoa] || 0) + r.t_bhtt;
            });
            const sortedCostDepts = sortedDepts.map(([name]) => ({
                name: name || 'Không xác định',
                cost: costByDept[name] || 0
            }));
            chart2Type = 'bar';
            chart2Data = {
                labels: sortedCostDepts.map(d => d.name),
                datasets: [{ label: 'Tổng Chi Phí BHYT TT (VNĐ)', data: sortedCostDepts.map(d => d.cost), backgroundColor: 'rgba(153, 102, 255, 0.8)' }]
            };
            chart2Title = 'Top 15 Khoa Theo Tổng Chi Phí BHYT TT';
            break;
    }
    updateChart('reportChart1', chart1Type, chart1Data, chart1Title);
    updateChart('reportChart2', chart2Type, chart2Data, chart2Title);
}

function exportReport() {
    if (globalData.allRecords.length === 0) {
        alert('Chưa có dữ liệu để xuất báo cáo.');
        return;
    }

    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value.replace(/-/g, '');
    const dateTo = document.getElementById('reportDateTo').value.replace(/-/g, '');

    const filteredForReport = globalData.allRecords.filter(r => {
        if (!dateFrom && !dateTo) return true;
        const recordDate = String(r.ngayVao).substring(0, 8);
        if (dateFrom && recordDate < dateFrom) return false;
        if (dateTo && recordDate > dateTo) return false;
        return true;
    });
    
    const wb = XLSX.utils.book_new();
    const stats = calculateGlobalStats(filteredForReport);
    let reportData, sheetName, fileName;

    switch(reportType) {
        case 'error-summary':
            const sortedErrors = Object.entries(stats.errorTypes).sort(([, a], [, b]) => b - a);
            reportData = sortedErrors.map(([type, count]) => ({
                'Loại Lỗi': ERROR_TYPES[type] || type,
                'Số Lượng': count
            }));
            sheetName = 'TomTatLoi';
            fileName = 'BaoCao_TomTatLoi.xlsx';
            break;
        case 'time-analysis':
            const timelineData = Object.entries(stats.timeline).sort(([a], [b]) => a.localeCompare(b));
            reportData = timelineData.map(([day, count]) => ({ 'Ngày': formatDateTimeForDisplay(day), 'Số Hồ Sơ': count}));
            sheetName = 'PhanTichThoiGian';
            fileName = 'BaoCao_PhanTichThoiGian.xlsx';
            break;
        case 'cost-analysis':
            const costData = Object.entries(stats.amounts).map(([range, count]) => ({ 'Khoảng Chi Phí': range, 'Số Hồ Sơ': count }));
            sheetName = 'PhanTichChiPhi';
            fileName = 'BaoCao_PhanTichChiPhi.xlsx';
            break;
        case 'department-analysis':
            const deptCosts = {};
            filteredForReport.forEach(r => { deptCosts[r.maKhoa] = (deptCosts[r.maKhoa] || 0) + r.t_bhtt; });
            const sortedDepts = Object.entries(stats.departments).sort(([, a], [, b]) => b - a);
            reportData = sortedDepts.map(([name, count]) => ({
                'Tên Khoa': name || 'Không xác định',
                'Số Lượng Hồ Sơ': count,
                'Tổng Chi Phí BHYT TT': deptCosts[name] || 0
            }));
            sheetName = 'PhanTichKhoa';
            fileName = 'BaoCao_PhanTichKhoa.xlsx';
            break;
    }
    
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
}

function exportDoctorAnalysis() {
    if (globalData.allRecords.length === 0) {
        alert('Chưa có dữ liệu để phân tích. Vui lòng xử lý file XML trước.');
        return;
    }

    const doctorStatsMap = new Map();
    const performerStatsMap = new Map();

    globalData.allRecords.forEach(record => {
        const doctors = Array.from(record.bac_si_chi_dinh);
        const performers = Array.from(record.nguoi_thuc_hien);
        const recordDate = record.ngayVao;

        if (doctors.length > 0) {
            const costPerDoctor = record.t_bhtt / doctors.length;
            doctors.forEach(maBS => {
                if (!doctorStatsMap.has(maBS)) {
                    doctorStatsMap.set(maBS, { totalCost: 0, recordCount: 0, firstDate: recordDate, lastDate: recordDate });
                }
                const stats = doctorStatsMap.get(maBS);
                stats.totalCost += costPerDoctor;
                stats.recordCount++;
                if (recordDate < stats.firstDate) stats.firstDate = recordDate;
                if (recordDate > stats.lastDate) stats.lastDate = recordDate;
            });
        }
        if (performers.length > 0) {
            const costPerPerformer = record.t_bhtt / performers.length;
            performers.forEach(maNTH => {
                if (!performerStatsMap.has(maNTH)) {
                    performerStatsMap.set(maNTH, { totalCost: 0, recordCount: 0, firstDate: recordDate, lastDate: recordDate });
                }
                const stats = performerStatsMap.get(maNTH);
                stats.totalCost += costPerPerformer;
                stats.recordCount++;
                if (recordDate < stats.firstDate) stats.firstDate = recordDate;
                if (recordDate > stats.lastDate) stats.lastDate = recordDate;
            });
        }
    });

    const wb = XLSX.utils.book_new();

    // Sheet for Doctors
    const sortedDoctors = Array.from(doctorStatsMap.entries()).sort(([,a], [,b]) => b.totalCost - a.totalCost);
    const doctorData = sortedDoctors.map(([maBS, stats]) => ({
        'Mã Bác Sĩ': maBS,
        'Tên Bác Sĩ': staffNameMap.get(maBS) || '',
        'Tổng Chi Phí BHYT TT (phân bổ)': stats.totalCost,
        'Tổng Số Hồ Sơ': stats.recordCount,
        'Ngày Khám Đầu Tiên': formatDateTimeForDisplay(stats.firstDate),
        'Ngày Khám Cuối Cùng': formatDateTimeForDisplay(stats.lastDate),
    }));
    if (doctorData.length > 0) {
        const wsDoctors = XLSX.utils.json_to_sheet(doctorData);
        XLSX.utils.book_append_sheet(wb, wsDoctors, "BacSi_ChiDinh");
    }

    // Sheet for Performers
    const sortedPerformers = Array.from(performerStatsMap.entries()).sort(([,a], [,b]) => b.totalCost - a.totalCost);
    const performerData = sortedPerformers.map(([maNTH, stats]) => ({
        'Mã Người Thực Hiện': maNTH,
        'Tên Người Thực Hiện': staffNameMap.get(maNTH) || '',
        'Tổng Chi Phí BHYT TT (phân bổ)': stats.totalCost,
        'Tổng Số Hồ Sơ': stats.recordCount,
        'Ngày TH Đầu Tiên': formatDateTimeForDisplay(stats.firstDate),
        'Ngày TH Cuối Cùng': formatDateTimeForDisplay(stats.lastDate),
    }));
    if (performerData.length > 0) {
        const wsPerformers = XLSX.utils.json_to_sheet(performerData);
        XLSX.utils.book_append_sheet(wb, wsPerformers, "Nguoi_ThucHien");
    }
    
    if (wb.SheetNames.length > 0) {
        XLSX.writeFile(wb, 'BaoCao_PhanTich_NhanVienYTe.xlsx');
    } else {
        alert('Không có dữ liệu bác sĩ chỉ định hoặc người thực hiện để xuất.');
    }
}

// ============================= INITIALIZATION (UPDATED) =============================
function initializeValidationSettings() {
    // Rules that users can configure (enable/disable, change severity)
    const configurableRules = [
        'BS_TRUNG_THOI_GIAN', 
        'BS_KHAM_CHONG_LAN',
        'DVKT_YL_TRUNG_NGAY_VAO', 'DVKT_YL_TRUNG_NGAY_RA',
        'DVKT_THYL_TRUNG_NGAY_VAO', 'DVKT_THYL_TRUNG_NGAY_RA', 
        'THUOC_YL_NGOAI_GIO_HC', 'THUOC_THYL_NGOAI_GIO_HC',
        'DVKT_YL_NGOAI_GIO_HC', 'DVKT_THYL_NGOAI_GIO_HC',
        'NGAY_TAI_KHAM_NO_XML14',
        'KQ_DVKT_SAU_YL_THUOC', // <--- ĐẢM BẢO QUY TẮC NÀY CÓ Ở ĐÂY
      'THUOC_DVKT_THYL_TRUNG_GIO', // <-- THÊM VÀO ĐÂY
       'BS_KHAM_VUOT_DINH_MUC','THUOC_CHONG_CHI_DINH_ICD'
    ];

    // Rules that are always treated as 'warnings' and are NOT configurable
    const fixedWarnings = [
        'NGAY_TTOAN_SAU_RA_VIEN', 
        'KHAM_DUOI_5_PHUT'
    ];

    // Rules that are always treated as 'critical' errors and are NOT configurable
    const criticalErrors = [
        'BS_KHAM_TRONG_NGAY_NGHI',
        'NGAY_YL_THUOC_SAU_RA_VIEN', 'NGAY_YL_DVKT_SAU_RA_VIEN', 'NGAY_VAO_SAU_NGAY_RA',
        'THE_BHYT_HET_HAN', 'NGAY_THYL_TRUOC_VAOVIEN', 'NGAY_THYL_SAU_RAVIEN',
        'MA_MAY_TRUNG_THOI_GIAN', 'XML4_MISSING_MA_BS_DOC_KQ'
    ];

    configurableRules.forEach(key => {
        validationSettings[key] = {
            enabled: true,
            severity: 'warning',
            isConfigurable: true
        };
    });
    
    fixedWarnings.forEach(key => {
        validationSettings[key] = {
            enabled: true,
            severity: 'warning',
            isConfigurable: false
        };
    });

    criticalErrors.forEach(key => {
        validationSettings[key] = {
            enabled: true,
            severity: 'critical',
            isConfigurable: false
        };
    });
}
document.addEventListener('DOMContentLoaded', () => {
    initializeValidationSettings();
    initializeValidator();
    initializeComparator();
    
    document.querySelectorAll('.filter-content').forEach(el => {
        const parent = el.parentElement;
        const toggleButton = parent.querySelector('.filter-toggle');
        if (toggleButton) {
            el.style.display = 'none';
            if(parent.querySelector('.filter-actions')) parent.querySelector('.filter-actions').style.display = 'none';
            toggleButton.textContent = 'Mở rộng';
        }
    });

    Object.keys(globalData.charts).forEach(key => {
        if(globalData.charts[key] && typeof globalData.charts[key].destroy === 'function') {
            globalData.charts[key].destroy();
        }
    });
    updateChart('errorTypesChart', 'doughnut', {labels:[], datasets:[{data:[]}]}, 'Phân bố loại lỗi (chưa có dữ liệu)');
    updateChart('timelineChart', 'line', {labels:[], datasets:[{data:[]}]}, 'Xu hướng theo thời gian (chưa có dữ liệu)');
    updateChart('departmentChart', 'bar', {labels:[], datasets:[{data:[]}]}, 'Phân bố theo khoa (chưa có dữ liệu)');
    updateChart('amountChart', 'bar', {labels:[], datasets:[{data:[]}]}, 'Phân bố chi phí (chưa có dữ liệu)');
    updateChart('reportChart1', 'bar', {labels:[], datasets:[{data:[]}]}, 'Báo cáo 1 (chưa có dữ liệu)');
    updateChart('reportChart2', 'bar', {labels:[], datasets:[{data:[]}]}, 'Báo cáo 2 (chưa có dữ liệu)');
    updateChart('topDrugsChart', 'bar', {labels:[], datasets:[{data:[]}]}, 'Top 10 Thuốc (chưa có dữ liệu)');
    updateChart('topServicesChart', 'bar', {labels:[], datasets:[{data:[]}]}, 'Top 10 DVKT (chưa có dữ liệu)');
});

// ============================= Loading helpers =============================
const showLoading = (id) => document.getElementById(id).classList.add('show');
const hideLoading = (id) => document.getElementById(id).classList.remove('show');
/**
 * FILE MỚI: feature_enhancements.js
 * =================================
 * Version 16:
 * - Thêm tính năng tự động chuyển giao diện sáng/tối theo thời gian thực (6h sáng - 6h tối).
 * - Tính năng tự động chỉ kích hoạt khi người dùng chưa tự chọn giao diện.
 *
 * File này chứa các chức năng bổ sung được yêu cầu.
 * Nó được thiết kế để không chỉnh sửa trực tiếp vào file index.html hay script.js gốc.
 * Mọi thứ (HTML, CSS, Logic) đều được tiêm vào trang một cách tự động khi tải.
 */

// ========== DỮ LIỆU CHO TÍNH NĂNG THÔNG BÁO ==========
const notifications = [
      {
        id: 14,
        date: '11-09-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Bổ sung CẢNH BÁO',
        content: 'Y lệnh thuốc sai, chống chỉ định'
    },
     {
        id: 13,
        date: '09-09-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Bổ sung CẢNH BÁO',
        content: 'Vượt định mức công khám 65 ca/1 ngày, XML3. NGÀY TH Y lệnh DVKT bằng hoặc sau NGÀY TH Y lệnh THUỐC'
    },
    {
        id: 12,
        date: '27-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Bổ sung CẢNH BÁO',
        content: 'XML3. NGÀY TH Y lệnh DVKT bằng hoặc sau NGÀY TH Y lệnh THUỐC'
    },
    
    {
        id: 11,
        date: '19-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Bổ sung ngày NV nghỉ',
        content: 'Bác sỹ khi nghỉ phát sinh khám sẽ báo lỗi nghiêm trọng'
    },
     {
        id: 10,
        date: '19-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Bổ sung cảnh báo',
        content: 'XML3. Y lệnh DVKT sau thời gian y lệnh THUỐC. Trừ dịch vụ kỹ thuật gửi mẫu'
    },
     {
        id: 9,
        date: '18-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Cải tiến xem chi tiết',
        content: 'Xem chi tiết bây giờ hiện rõ hơn, lọc ngày chính xác hơn'
    },
    {
        id: 8,
        date: '15-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Xem chi tiết hồ sơ và 🤖 Phân tích AI',
        content: 'Bổ sung xem chi tiết hồ sơ và phân tích AI hồ sơ đó'
    },
     {
        id: 7,
        date: '14-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Sửa lỗi XML 3 nếu có 2 người TH',
        content: 'Giờ đây xem chi tiết XML 4 sẽ hiện ra người thực hiện và đọc kết quả chỉ số'
    },
    
    {
        id: 6,
        date: '13-08-2025',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Bổ sung TH đặc biệt',
        content: 'Menu Dashboard cập nhật: Bộ lọc "Không Khám (chỉ có Thuốc/DVKT)", Không thuốc, hoặc chỉ có DVKT'
    },
    {
        id: 5,
        date: '2025-08-13',
        type: 'feature', // 'feature', 'fix', 'announcement'
        title: 'Thông báo cập nhật',
        content: 'Bổ sung tính năng lọc "Nguồn khác", lọc "CCT > 0" . Bảng kết quả và bộ lọc đã được tinh chỉnh để hiển thị tốt hơn trên các thiết bị có màn hình nhỏ. Thêm tính năng gửi tin nhắn hồ sơ lỗi qua ZALO bằng cách copy.'
    },
    {
        id: 4,
        date: '2025-08-12',
        type: 'feature',
        title: 'Hệ thống Thông báo & Cập nhật ra mắt!',
        content: 'Giờ đây, mọi cập nhật và tính năng mới sẽ được thông báo trực tiếp tại đây để bạn tiện theo dõi.'
    },
    {
        id: 3,
        date: '2025-08-11',
        type: 'fix',
        title: 'Sửa lỗi màu sắc và hiển thị trên Dashboard',
        content: 'Đã khắc phục lỗi khiến các thẻ thống kê không hiển thị đúng màu sắc và lỗi hiển thị sai số tiền "Nguồn khác".'
    },
    {
        id: 2,
        date: '2025-08-10',
        type: 'feature',
        title: 'Tối ưu giao diện cho di động',
        content: 'Bảng kết quả và bộ lọc đã được tinh chỉnh để hiển thị tốt hơn trên các thiết bị có màn hình nhỏ.'
    },
    {
        id: 1,
        date: '2025-08-09',
        type: 'announcement',
        title: 'Chào mừng đến với phiên bản mới',
        content: 'Chào mừng bạn đến với hệ thống Giám sát BHYT Toàn diện phiên bản nâng cấp.'
    }
];


document.addEventListener('DOMContentLoaded', () => {
    console.log("Applying feature enhancements v29 (Fix and Improve View Details)...");

    // ===================================================================
    // BƯỚC 1: TIÊM CSS
    // ===================================================================
    const newStyles = `
        /* ... CSS từ các phiên bản trước được giữ nguyên ... */
        /* LOẠI BỎ CSS cho .details-popup vì không còn sử dụng */
        .table-header { align-items: flex-start; } .header-info-container { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; margin-left: auto; } #dynamicSummaryContainer { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; } .summary-box { display: inline-flex; align-items: center; gap: 15px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); transition: opacity 0.3s ease, transform 0.3s ease; } .summary-box span { font-size: 0.9em; font-weight: 600; color: white; } .summary-box strong { font-size: 1.1em; font-weight: 700; color: #ffc107; } .cost-nguon-khac { display: block; color: #c82333; font-weight: bold; font-size: 0.9em; margin-top: 4px; } body.dark .summary-box { border-color: rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); } body.dark .summary-box strong { color: #f6ad55; } body.dark .cost-nguon-khac { color: #f68794; } #dashboardTab .stats-overview { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 25px; } .zalo-modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px); } .zalo-modal-content { background-color: #fefefe; margin: 10% auto; padding: 25px; border: 1px solid #888; width: 90%; max-width: 700px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: fadeInScale 0.4s ease-out; } body.dark .zalo-modal-content { background: #1f2937; border-color: #374151; } .zalo-modal-textarea { width: 100%; height: 300px; margin-top: 15px; margin-bottom: 15px; padding: 10px; font-family: monospace; font-size: 1em; border: 1px solid #ccc; border-radius: 8px; resize: vertical; white-space: pre-wrap; } body.dark .zalo-modal-textarea { background-color: #0f172a; color: #e5e7eb; border-color: #374151; } .icon-action-btn { background: none; border: none; cursor: pointer; font-size: 1.5em; padding: 5px; line-height: 1; border-radius: 50%; width: 40px; height: 40px; transition: background-color 0.2s ease; display: inline-flex; align-items: center; justify-content: center; } .icon-action-btn:hover { background-color: rgba(0, 0, 0, 0.1); } body.dark .icon-action-btn:hover { background-color: rgba(255, 255, 255, 0.1); } .results-container.actions-hidden .action-header, .results-container.actions-hidden .action-cell { display: none; } .results-table tr.row-critical-error { background-color: rgba(220, 53, 69, 0.05); border-left: 4px solid #dc3545; } .results-table tr.row-warning { background-color: rgba(255, 193, 7, 0.05); border-left: 4px solid #ffc107; } .results-table tr.row-critical-error:hover, .results-table tr:has(.status-badge.status-error):hover { background: rgba(220,53,69,.12) !important; } .results-table tr.row-warning:hover, .results-table tr:has(.status-badge.status-warning):hover { background: rgba(255,193,7,.14) !important; } #dashboardTab .stat-card { background: #ffffff; color: #34495e; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border: 1px solid #e9ecef; padding: 20px; transition: transform 0.3s ease, box-shadow 0.3s ease; } #dashboardTab .stat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); } #dashboardTab .stat-card h3 { font-size: clamp(1.8em, 4.5vw, 2.6em); white-space: nowrap; margin-bottom: 5px; cursor: pointer; } #dashboardTab .stat-card p { font-size: 1em; font-weight: 500; color: #7f8c8d; opacity: 1; } #dashboardTab .stat-card.stat-card--colored h3, #dashboardTab .stat-card.stat-card--colored p { color: white; opacity: 0.95; } #dashboardTab .stat-card.stat-card--colored h3 { text-shadow: 0 2px 4px rgba(0,0,0,0.2); } #dashboardTab .stat-card.stat-card--error { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); } #dashboardTab .stat-card.stat-card--bhyttt { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); } #dashboardTab .stat-card.stat-card--bncct { background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); } #dashboardTab .stat-card.stat-card--primary { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); } body.dark #dashboardTab .stat-card { background: #1f2937; color: #e5e7eb; border-color: #374151; } body.dark #dashboardTab .stat-card h3 { color: #ffffff; } body.dark #dashboardTab .stat-card p { color: #9ca3af; } body.dark #dashboardTab .stat-card.stat-card--colored h3, body.dark #dashboardTab .stat-card.stat-card--colored p { color: #ffffff; } @media (max-width: 768px) { body { padding: 10px; } .container { padding: 0; border-radius: 10px; } .header { padding: 20px; } .header h1 { font-size: 1.8em; } .tab-button { padding: 15px 10px; font-size: 0.9em; } .tab-content { padding: 15px; } #dashboardStats { grid-template-columns: 1fr; } .dashboard-grid { grid-template-columns: 1fr; } .filter-grid { grid-template-columns: 1fr; } .filter-actions { flex-direction: column; gap: 10px; } .filter-actions .btn, .filter-actions .icon-action-btn { width: 100%; } .results-table thead { display: none; } .results-table tbody, .results-table tr, .results-table td { display: block; width: 100% !important; } .results-table tr { margin-bottom: 15px; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px; border-left-width: 5px; } body.dark .results-table tr { border-color: #374151; } .results-table td { padding-left: 50%; text-align: right; position: relative; border-bottom: 1px solid #f1f1f1; } body.dark .results-table td { border-bottom-color: #2c3a4b; } .results-table td:last-child { border-bottom: none; } .results-table td::before { content: attr(data-label); position: absolute; left: 10px; width: 45%; text-align: left; font-weight: 600; color: #2c3e50; } body.dark .results-table td::before { color: #a0aec0; } .results-table td.action-cell { padding: 10px; text-align: center; } .results-table td.action-cell::before { display: none; } }
        .header-actions { position: absolute; top: 18px; right: 18px; display: flex; gap: 10px; align-items: center; } #notificationBell { position: fixed; bottom: 25px; right: 25px; width: 55px; height: 55px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; box-shadow: 0 8px 20px rgba(0,0,0,0.3); font-size: 1.8rem; display: grid; place-items: center; cursor: pointer; z-index: 1050; transition: transform 0.2s ease-out; } #notificationBell:hover { transform: scale(1.1); } .unread-indicator { position: absolute; top: 8px; right: 8px; width: 12px; height: 12px; background-color: #e74c3c; border-radius: 50%; border: 2px solid white; } #notificationPanel { position: fixed; display: none; bottom: 95px; right: 25px; width: 380px; max-width: calc(100vw - 40px); background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1100; overflow: hidden; animation: fadeInUp 0.3s ease-out; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .notification-header { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; } .notification-header h3 { font-size: 1.1em; margin: 0; color: #2c3e50; } .notification-list { max-height: 400px; overflow-y: auto; padding: 5px; } .notification-item { display: flex; padding: 15px; border-bottom: 1px solid #e9ecef; gap: 15px; } .notification-item:last-child { border-bottom: none; } .notification-icon { font-size: 1.5rem; } .notification-content h4 { font-size: 1em; margin: 0 0 5px 0; color: #2c3e50; } .notification-content p { font-size: 0.9em; margin: 0; color: #6c757d; line-height: 1.5; } .notification-content .date { font-size: 0.8em; color: #adb5bd; margin-top: 5px; } body.dark #notificationPanel { background: #1f2937; } body.dark .notification-header { background: #111827; border-bottom-color: #374151; } body.dark .notification-header h3 { color: #e5e7eb; } body.dark .notification-item { border-bottom-color: #374151; } body.dark .notification-content h4 { color: #f9fafb; } body.dark .notification-content p { color: #d1d5db; } body.dark .notification-content .date { color: #6b7280; }
        .update-modal-content { max-width: 600px; margin: 15% auto; } .update-modal-body { padding: 10px 0 20px 0; } .update-modal-body .notification-item { border-bottom: none; padding: 0; } .update-modal-body h4 { font-size: 1.2em; } .update-modal-body p { font-size: 1em; }
        .special-cases-container { margin-top: 40px; background: #f8f9ff; border-radius: 15px; border: 1px solid #e1e8ed; overflow: hidden; } .special-cases-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: linear-gradient(135deg, #6c757d 0%, #343a40 100%); color: white; cursor: pointer; } .special-cases-header h3 { margin: 0; font-size: 1.3em; } .special-cases-header .toggle-icon { transition: transform 0.3s ease; } .special-cases-header.expanded .toggle-icon { transform: rotate(180deg); } .special-cases-body { padding: 20px; border-top: 1px solid #e1e8ed; display: none; } .special-cases-controls { display: flex; gap: 20px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; } #specialCaseResults { max-height: 400px; overflow-y: auto; padding-right: 10px; } #specialCaseResults ul { list-style: none; padding: 0; } #specialCaseResults li { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; } #specialCaseResults li:hover { background-color: #f0f2f5; } .case-info { font-weight: 500; } .case-date { color: #6c757d; font-size: 0.9em; margin-left: 10px; } .case-placeholder { color: #6c757d; } body.dark .special-cases-container { background: #1f2937; border-color: #374151; } body.dark .special-cases-header { background: linear-gradient(135deg, #343a40 0%, #212529 100%); } body.dark .special-cases-body { border-top-color: #374151; } body.dark #specialCaseResults li { border-bottom-color: #374151; } body.dark #specialCaseResults li:hover { background-color: #2c3a4b; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = newStyles;
    document.head.appendChild(styleSheet);
    
    // ===================================================================
    // BƯỚC 2: TIÊM HTML & GẮN CLASS/SỰ KIỆN
    // ===================================================================
    // LOẠI BỎ: HTML cho pop-up chi tiết không còn cần thiết
    // Các đoạn mã tiêm HTML khác không thay đổi
    const specialCasesHTML = `<div class="special-cases-container"><div class="special-cases-header"><h3>⚠️ Các trường hợp đặc biệt</h3><span class="toggle-icon">▼</span></div><div class="special-cases-body"><div class="special-cases-controls"><label for="specialCaseFilter">Chọn loại hồ sơ bất thường:</label><select id="specialCaseFilter" class="filter-select"><option value="">--- Chọn ---</option><option value="no_kham">Không Khám (chỉ có Thuốc/DVKT)</option><option value="no_thuoc">Không Thuốc (chỉ có Khám/DVKT)</option><option value="only_dvkt">Chỉ có DVKT (không Khám, không Thuốc)</option><option value="dvkt_kham_no_thuoc">Chỉ có DVKT và Khám (Không Thuốc)</option></select></div><div id="specialCaseResults"><p class="case-placeholder">Vui lòng chọn một loại để xem danh sách.</p></div></div></div>`; const dashboardTab = document.getElementById('dashboardTab'); if(dashboardTab) { dashboardTab.insertAdjacentHTML('beforeend', specialCasesHTML); }
    const oldThemeToggle = document.getElementById('themeToggle'); const header = document.querySelector('.header'); if (oldThemeToggle && header) { oldThemeToggle.remove(); const headerActions = document.createElement('div'); headerActions.className = 'header-actions'; headerActions.innerHTML = `<button id="themeToggle" class="theme-toggle" aria-label="Chuyển Light/Dark"><span class="icon icon-sun">☀️</span><span class="icon icon-moon">🌙</span></button>`; header.appendChild(headerActions); document.getElementById('themeToggle').addEventListener('click', () => { const isDark = document.body.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }); }
    const bellButtonHTML = `<button id="notificationBell" title="Thông báo & Cập nhật">🔔</button>`; document.body.insertAdjacentHTML('beforeend', bellButtonHTML);
    const notificationPanelHTML = `<div id="notificationPanel"><div class="notification-header"><h3>Thông báo & Cập nhật</h3></div><div class="notification-list"></div></div>`; document.body.insertAdjacentHTML('beforeend', notificationPanelHTML);
    const zaloModalHTML = `<div id="zaloMessageModal" class="zalo-modal"><div class="zalo-modal-content"><div class="modal-header"><h2>Soạn tin nhắn gửi Zalo</h2><span class="close-button" onclick="closeZaloModal()">&times;</span></div><p>Nội dung dưới đây đã được định dạng sẵn, bạn chỉ cần sao chép và gửi đi.</p><textarea id="zaloMessageTextarea" class="zalo-modal-textarea"></textarea><div class="modal-footer"><button class="btn btn-warning" onclick="closeZaloModal()">Đóng</button><button class="btn btn-success" onclick="copyZaloMessage()">📋 Sao chép nội dung</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', zaloModalHTML);
    const updateModalHTML = `<div id="updateNoticeModal" class="modal"><div class="modal-content update-modal-content"><div class="modal-header"><h2 id="updateModalTitle">🔔 Có gì mới trong phiên bản này?</h2><span class="close-button" onclick="closeUpdateModal()">&times;</span></div><div id="updateModalBody" class="update-modal-body"></div><div class="modal-footer"><button class="btn btn-primary" onclick="closeUpdateModal()">Đã hiểu</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', updateModalHTML);
    applyAutoTheme(); initializeNotifications(); checkForcedUpdateNotice();
    const bulkZaloButton = document.createElement('button'); bulkZaloButton.id = 'bulkZaloButton'; bulkZaloButton.className = 'icon-action-btn'; bulkZaloButton.title = 'Soạn tóm tắt hàng loạt cho lỗi đã lọc'; bulkZaloButton.innerHTML = '📋'; bulkZaloButton.style.display = 'none'; bulkZaloButton.onclick = () => { const errorType = document.getElementById('errorTypeFilter').value; if (errorType && globalData.filteredRecords.length > 0) { openZaloModal(globalData.filteredRecords, true, errorType); } };
   // MỚI: Gắn sự kiện nhấn Enter cho các ô input
    const filterInputs = ['#searchBox', '#maBsFilter', '#dateFromFilter', '#dateToFilter'];
    filterInputs.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Ngăn hành vi mặc định (nếu có)
                    applyFilters();
                }
            });
        }
    });
  
    const toggleActionsButton = document.createElement('button'); toggleActionsButton.id = 'toggleActionsButton'; toggleActionsButton.className = 'btn btn-info'; toggleActionsButton.innerHTML = '⚙️ Hiện Hành động'; toggleActionsButton.onclick = () => { const container = document.getElementById('validatorResults'); if (container) { container.classList.toggle('actions-hidden'); const isHidden = container.classList.contains('actions-hidden'); toggleActionsButton.innerHTML = isHidden ? '⚙️ Hiện Hành động' : '⚙️ Ẩn Hành động'; } };
    const filterActions = document.querySelector('#validatorFilters .filter-actions'); if (filterActions) { filterActions.appendChild(bulkZaloButton); filterActions.appendChild(toggleActionsButton); }
    const resultsContainer = document.getElementById('validatorResults'); if (resultsContainer) { resultsContainer.classList.add('actions-hidden'); }
    const nguonKhacFilterGroup = document.createElement('div'); nguonKhacFilterGroup.className = 'filter-group'; nguonKhacFilterGroup.innerHTML = `<label>Tiền từ Nguồn khác:</label><select class="filter-select" id="nguonKhacFilter"><option value="">Tất cả</option><option value="yes">Có Nguồn khác (> 0)</option><option value="no">Không có Nguồn khác</option></select>`;
    const dynamicSummaryContainer = document.createElement('div'); dynamicSummaryContainer.id = 'dynamicSummaryContainer'; dynamicSummaryContainer.innerHTML = `<div id="nguonKhacSummary" class="summary-box" style="display: none;"><span>∑ Tiền Nguồn khác</span><strong id="totalNguonKhacValue">0</strong></div><div id="bncctSummary" class="summary-box" style="display: none;"><span>∑ Tiền BN CCT</span><strong id="totalBncctValue">0</strong></div>`;
    const nguonKhacStatCard = document.createElement('div'); nguonKhacStatCard.className = 'stat-card'; nguonKhacStatCard.innerHTML = `<h3 id="totalNguonKhacDashboard">0</h3><p>Tổng Tiền Nguồn khác</p>`;
    const filterGrid = document.querySelector('#validatorFilters .filter-grid'); const bncctFilter = document.querySelector('#bncctFilter'); if (filterGrid && bncctFilter) { bncctFilter.parentElement.insertAdjacentElement('afterend', nguonKhacFilterGroup); }
    const tableHeader = document.querySelector('#validatorResults .table-header'); const resultsInfoDiv = document.getElementById('resultsInfo'); if (tableHeader && resultsInfoDiv) { const headerInfoContainer = document.createElement('div'); headerInfoContainer.className = 'header-info-container'; resultsInfoDiv.parentNode.insertBefore(headerInfoContainer, resultsInfoDiv); headerInfoContainer.appendChild(resultsInfoDiv); headerInfoContainer.appendChild(dynamicSummaryContainer); }
    const dashboardStats = document.getElementById('dashboardStats'); if (dashboardStats) { dashboardStats.appendChild(nguonKhacStatCard); }
    const cardClassMapping = { 'errorCount': ['stat-card--error', 'stat-card--colored'], 'totalAmount': ['stat-card--bhyttt', 'stat-card--colored'], 'totalBncct': ['stat-card--bncct', 'stat-card--colored'], 'totalNguonKhacDashboard': ['stat-card--primary', 'stat-card--colored'] };
    for (const id in cardClassMapping) { const h3 = document.getElementById(id); if (h3 && h3.parentElement.classList.contains('stat-card')) { h3.parentElement.classList.add(...cardClassMapping[id]); } }
    initializeSpecialCases();
    
    // Các hàm bọc logic không thay đổi
    if (typeof validateSingleHoso === 'function') { const original_validateSingleHoso = validateSingleHoso; validateSingleHoso = function(hoso) { const result = original_validateSingleHoso(hoso); if (result && result.record) { let tongHopNode = null; for (const fileNode of hoso.children) { if (fileNode.nodeName === 'FILEHOSO') { const loaiHosoNode = fileNode.querySelector('LOAIHOSO'); if (loaiHosoNode && loaiHosoNode.textContent.trim() === 'XML1') { const noiDungFileNode = fileNode.querySelector('NOIDUNGFILE'); if (noiDungFileNode) { tongHopNode = noiDungFileNode.querySelector('TONG_HOP'); } break; } } } if (tongHopNode) { const t_nguonkhac_text = tongHopNode.querySelector('T_NGUONKHAC')?.textContent.trim() || '0'; result.record.t_nguonkhac = parseFloat(t_nguonkhac_text); } else { result.record.t_nguonkhac = 0; } const r = result.record; r.t_dvkt_khac = (r.t_xn || 0) + (r.t_cdha || 0) + (r.t_pttt || 0) + (r.t_vtyt || 0) + (r.t_mau || 0); let hasThuocData = false; for (const fileNode of hoso.children) { if (fileNode.nodeName === 'FILEHOSO') { const loaiHosoNode = fileNode.querySelector('LOAIHOSO'); if (loaiHosoNode && loaiHosoNode.textContent.trim() === 'XML2') { const dsThuoc = fileNode.querySelector('DSACH_CHI_TIET_THUOC'); if (dsThuoc && dsThuoc.children.length > 0) { hasThuocData = true; } break; } } } result.record.has_thuoc_data = hasThuocData; } return result; }; }
    if (typeof updateDashboard === 'function') { const original_updateDashboard = updateDashboard; updateDashboard = function() { original_updateDashboard(); if (globalData.allRecords.length > 0) { const rawTotalAmount = globalData.allRecords.reduce((sum, r) => sum + (r.t_bhtt || 0), 0); const rawTotalBncct = globalData.allRecords.reduce((sum, r) => sum + (r.t_bncct || 0), 0); const totalNguonKhac = globalData.allRecords.reduce((sum, record) => sum + (record.t_nguonkhac || 0), 0); updateStatCard('totalAmount', rawTotalAmount); updateStatCard('totalBncct', rawTotalBncct); updateStatCard('totalNguonKhacDashboard', totalNguonKhac); if(document.getElementById('dashboardTab').classList.contains('active')) { renderSpecialCases(); } } }; }
    if (typeof applyFilters === 'function') { const original_applyFilters = applyFilters; applyFilters = function() { const nguonKhacValue = document.getElementById('nguonKhacFilter').value; original_applyFilters(); globalData.filteredRecords = globalData.filteredRecords.filter(r => { const hasNguonKhac = r.t_nguonkhac && r.t_nguonkhac > 0; if (nguonKhacValue === 'yes' && !hasNguonKhac) return false; if (nguonKhacValue === 'no' && hasNguonKhac) return false; return true; }); globalData.currentPage = 1; updateResultsTable(); updatePagination(); updateResultsInfo(); updateDynamicSummaries(); const errorType = document.getElementById('errorTypeFilter').value; const bulkBtn = document.getElementById('bulkZaloButton'); if(bulkBtn){ bulkBtn.style.display = (errorType && globalData.filteredRecords.length > 0) ? 'inline-flex' : 'none'; } }; }
    if (typeof clearFilters === 'function') { const original_clearFilters = clearFilters; clearFilters = function() { original_clearFilters(); const nguonKhacFilter = document.getElementById('nguonKhacFilter'); if(nguonKhacFilter) nguonKhacFilter.value = ''; const bulkBtn = document.getElementById('bulkZaloButton'); if(bulkBtn) bulkBtn.style.display = 'none'; }; }
    if (typeof updateResultsTable === 'function') { const original_updateResultsTable = updateResultsTable; updateResultsTable = function() { original_updateResultsTable(); const table = document.querySelector('#validatorResults .results-table'); if (!table) return; const headerRow = table.querySelector('thead tr'); const tbody = table.querySelector('tbody'); if (!headerRow || !tbody) return; const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim()); if (!headerRow.querySelector('.action-header')) { const th = document.createElement('th'); th.className = 'action-header'; th.textContent = 'Hành động'; th.style.width = '100px'; th.style.textAlign = 'center'; headerRow.appendChild(th); headers.push('Hành động'); } const startIndex = (globalData.currentPage - 1) * globalData.pageSize; const pageRecords = globalData.filteredRecords.slice(startIndex, startIndex + globalData.pageSize); tbody.querySelectorAll('tr').forEach((row, rowIndex) => { const record = pageRecords[rowIndex]; if (!record) return; row.classList.remove('row-critical-error', 'row-warning'); const hasCritical = record.errors.some(e => e.severity === 'critical'); if (hasCritical) { row.classList.add('row-critical-error'); } else if (record.errors.length > 0) { row.classList.add('row-warning'); } const cells = row.querySelectorAll('td'); cells.forEach((cell, cellIndex) => { if (headers[cellIndex]) { cell.setAttribute('data-label', headers[cellIndex]); } }); if (!row.querySelector('.action-cell')) { const td = document.createElement('td'); td.className = 'action-cell'; td.setAttribute('data-label', 'Hành động'); td.style.verticalAlign = 'middle'; td.style.textAlign = 'center'; if (record.errors.length > 0) { const zaloButton = document.createElement('button'); zaloButton.className = 'icon-action-btn'; zaloButton.title = 'Soạn tin Zalo cho hồ sơ này'; zaloButton.innerHTML = '✉️'; zaloButton.onclick = (e) => { e.stopPropagation(); openZaloModal(record); }; td.appendChild(zaloButton); } row.appendChild(td); } if (record.t_nguonkhac > 0) { const costCell = cells[3]; if(costCell && !costCell.querySelector('.cost-nguon-khac')){ costCell.innerHTML += `<span class="cost-nguon-khac">Nguồn khác: ${formatCurrency(record.t_nguonkhac)}</span>`; } } }); }; }
    function updateDynamicSummaries() { const bncctFilterValue = document.getElementById('bncctFilter').value; const nguonKhacFilterValue = document.getElementById('nguonKhacFilter').value; const bncctSummaryBox = document.getElementById('bncctSummary'); const nguonKhacSummaryBox = document.getElementById('nguonKhacSummary'); if (bncctFilterValue === 'yes') { const total = globalData.filteredRecords.reduce((sum, record) => sum + (record.t_bncct || 0), 0); document.getElementById('totalBncctValue').textContent = formatCurrency(total); bncctSummaryBox.style.display = 'inline-flex'; } else { bncctSummaryBox.style.display = 'none'; } if (nguonKhacFilterValue === 'yes') { const total = globalData.filteredRecords.reduce((sum, record) => sum + (record.t_nguonkhac || 0), 0); document.getElementById('totalNguonKhacValue').textContent = formatCurrency(total); nguonKhacSummaryBox.style.display = 'inline-flex'; } else { nguonKhacSummaryBox.style.display = 'none'; } }
});

// ===================================================================
// BƯỚC 4: CÁC HÀM MỚI VÀ CẬP NHẬT
// ===================================================================
// CẬP NHẬT: Hàm `updateStatCard` với logic mới đơn giản và ổn định hơn
function updateStatCard(elementId, fullValue) {
    const el = document.getElementById(elementId);
    if (el) {
        const abbreviatedText = formatCurrencyAbbreviated(fullValue);
        const fullDetailText = formatCurrencyWithDecimals(fullValue);
        
        el.textContent = abbreviatedText;
        el.title = `Chính xác: ${fullDetailText}`; // Dành cho máy tính khi di chuột

        // Dành cho mọi thiết bị khi nhấn vào
        el.onclick = (e) => {
            e.stopPropagation();
            alert(`Số tiền chính xác:\n${fullDetailText}`);
        };
    }
}
// LOẠI BỎ: Các hàm showDetailsPopup, hideDetailsPopup, setupStatCardObserver không còn cần thiết

// Các hàm khác không thay đổi
function initializeSpecialCases() { const header = document.querySelector('.special-cases-header'); const body = document.querySelector('.special-cases-body'); const filter = document.getElementById('specialCaseFilter'); if (header && body) { header.addEventListener('click', () => { const isExpanded = body.style.display === 'block'; body.style.display = isExpanded ? 'none' : 'block'; header.classList.toggle('expanded', !isExpanded); }); } if (filter) { filter.addEventListener('change', renderSpecialCases); } }
function renderSpecialCases() { const filterValue = document.getElementById('specialCaseFilter').value; const resultsDiv = document.getElementById('specialCaseResults'); if (!filterValue) { resultsDiv.innerHTML = '<p class="case-placeholder">Vui lòng chọn một loại để xem danh sách.</p>'; return; } let filteredRecords = []; switch (filterValue) { case 'no_kham': filteredRecords = globalData.allRecords.filter(r => (r.has_thuoc_data || r.t_dvkt_khac > 0) && !r.services.some(s => (s.ten_dich_vu || '').toLowerCase().includes('khám'))); break; case 'no_thuoc': filteredRecords = globalData.allRecords.filter(r => !r.has_thuoc_data && (r.services.some(s => (s.ten_dich_vu || '').toLowerCase().includes('khám')) || r.t_dvkt_khac > 0)); break; case 'only_dvkt': filteredRecords = globalData.allRecords.filter(r => r.t_dvkt_khac > 0 && !r.services.some(s => (s.ten_dich_vu || '').toLowerCase().includes('khám')) && !r.has_thuoc_data); break; case 'dvkt_kham_no_thuoc': filteredRecords = globalData.allRecords.filter(r => r.services.some(s => (s.ten_dich_vu || '').toLowerCase().includes('khám')) && r.t_dvkt_khac > 0 && !r.has_thuoc_data); break; } if (filteredRecords.length === 0) { resultsDiv.innerHTML = `<p class="case-placeholder">Không tìm thấy hồ sơ nào phù hợp.</p>`; } else { let listHTML = `<ul>`; filteredRecords.forEach(r => { listHTML += `<li><span class="case-info">${r.hoTen} (${r.maBn || r.maLk})</span><span class="case-date">Vào: ${formatDateTimeForDisplay(r.ngayVao)}</span></li>`; }); listHTML += `</ul>`; resultsDiv.innerHTML = `<p><strong>Tìm thấy ${filteredRecords.length} hồ sơ:</strong></p>${listHTML}`; } }
function formatCurrencyAbbreviated(num) { if (isNaN(num)) return '0 đ'; if (num < 1000000) { return new Intl.NumberFormat('vi-VN').format(num) + ' đ'; } if (num < 1000000000) { return (num / 1000000).toFixed(1).replace('.0', '') + ' tr'; } return (num / 1000000000).toFixed(2).replace('.00', '') + ' tỷ'; }
function formatCurrencyWithDecimals(num) { if (isNaN(num)) return '0,00 ₫'; return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num); }
function applyAutoTheme() { if (localStorage.getItem('theme')) { return; } const currentHour = new Date().getHours(); if (currentHour >= 6 && currentHour < 18) { document.body.classList.remove('dark'); } else { document.body.classList.add('dark'); } }


function applyAutoTheme() { if (localStorage.getItem('theme')) { return; } const currentHour = new Date().getHours(); if (currentHour >= 6 && currentHour < 18) { document.body.classList.remove('dark'); } else { document.body.classList.add('dark'); } }
function initializeNotifications() { const bell = document.getElementById('notificationBell'); const panel = document.getElementById('notificationPanel'); if (!bell || !panel) return; const checkUnread = () => { const lastSeenId = parseInt(localStorage.getItem('lastSeenNotificationId') || '0'); const latestId = notifications.length > 0 ? notifications[0].id : 0; if (latestId > lastSeenId) { const indicator = document.createElement('div'); indicator.className = 'unread-indicator'; bell.appendChild(indicator); } }; const renderNotifications = () => { const list = panel.querySelector('.notification-list'); if (!list) return; const iconMap = { feature: '✨', fix: '🔧', announcement: '📢' }; list.innerHTML = notifications.map(n => `<div class="notification-item"><div class="notification-icon">${iconMap[n.type] || '🔔'}</div><div class="notification-content"><h4>${n.title}</h4><p>${n.content}</p><div class="date">${n.date}</div></div></div>`).join(''); }; bell.addEventListener('click', (e) => { e.stopPropagation(); const isVisible = panel.style.display === 'block'; if (!isVisible) { renderNotifications(); panel.style.display = 'block'; const latestId = notifications.length > 0 ? notifications[0].id : 0; localStorage.setItem('lastSeenNotificationId', latestId); const indicator = bell.querySelector('.unread-indicator'); if (indicator) indicator.remove(); } else { panel.style.display = 'none'; } }); document.addEventListener('click', (e) => { if (!panel.contains(e.target) && !bell.contains(e.target)) { panel.style.display = 'none'; } }); checkUnread(); }
function checkForcedUpdateNotice() { if (notifications.length === 0) return; const latestUpdate = notifications[0]; const lastAcknowledgedId = parseInt(localStorage.getItem('acknowledgedUpdateId') || '0'); if (latestUpdate.id > lastAcknowledgedId) { const modal = document.getElementById('updateNoticeModal'); const modalBody = document.getElementById('updateModalBody'); const iconMap = { feature: '✨', fix: '🔧', announcement: '📢' }; modalBody.innerHTML = `<div class="notification-item"><div class="notification-icon">${iconMap[latestUpdate.type] || '🔔'}</div><div class="notification-content"><h4>${latestUpdate.title}</h4><p>${latestUpdate.content}</p><div class="date">${latestUpdate.date}</div></div></div>`; modal.style.display = 'block'; } }
function closeUpdateModal() { const latestUpdateId = notifications.length > 0 ? notifications[0].id : 0; localStorage.setItem('acknowledgedUpdateId', latestUpdateId); document.getElementById('updateNoticeModal').style.display = 'none'; }
function generateBulkZaloMessage(records, errorType) { const errorName = ERROR_TYPES[errorType] || errorType; let message = `*[CSKCB] TÓM TẮT LỖI HÀNG LOẠT*\n--------------------------------\n`; message += `▪️ *Loại lỗi:* ${errorName}\n`; message += `▪️ *Tổng số hồ sơ có lỗi:* ${records.length}\n\n`; message += `*DANH SÁCH CHI TIẾT:*\n`; records.forEach((record, index) => { const relevantError = record.errors.find(e => e.type === errorType); const cost = relevantError && relevantError.cost > 0 ? ` - ${formatCurrency(relevantError.cost)}` : ''; message += `${index + 1}. BN: *${record.hoTen}* (LK: ${record.maLk})${cost}\n`; }); message += `\n--------------------------------\n_Vui lòng kiểm tra và xử lý hàng loạt các hồ sơ trên._`; return message; }
function generateSingleZaloMessage(record) { const cleanMessage = (msg) => msg.replace(/<br>/g, '\n').replace(/<strong>(.*?)<\/strong>/g, '*$1*'); let message = `*[CSKCB] THÔNG BÁO KẾT QUẢ KIỂM TRA HỒ SƠ BHYT*\n--------------------------------\n`; message += `▪️ *Bệnh nhân:* ${record.hoTen}\n`; message += `▪️ *Mã LK:* ${record.maLk}\n`; message += `▪️ *Thời gian ĐT:* ${formatDateTimeForDisplay(record.ngayVao)} - ${formatDateTimeForDisplay(record.ngayRa)}\n`; message += `▪️ *Tổng chi phí:* ${formatCurrency(record.t_bhtt)}\n\n`; const criticalErrors = record.errors.filter(e => e.severity === 'critical'); const warnings = record.errors.filter(e => e.severity === 'warning'); if (criticalErrors.length > 0) { message += `*🔴 LỖI NGHIÊM TRỌNG (Dự kiến xuất toán):*\n`; criticalErrors.forEach((err, i) => { const errorDesc = ERROR_TYPES[err.type] || err.type; let costInfo = err.cost > 0 ? ` (${formatCurrency(err.cost)})` : ''; message += `${i + 1}. *${errorDesc}:* ${cleanMessage(err.message)}${costInfo}\n`; }); message += `\n`; } if (warnings.length > 0) { message += `*🟡 CẢNH BÁO (Kiểm tra lại):*\n`; warnings.forEach((err, i) => { const errorDesc = ERROR_TYPES[err.type] || err.type; message += `${i + 1}. *${errorDesc}:* ${cleanMessage(err.message)}\n`; }); message += `\n`; } message += `--------------------------------\n_Vui lòng kiểm tra và xử lý theo quy định._`; return message; }
function openZaloModal(data, isBulk = false, errorType = '') { const message = isBulk ? generateBulkZaloMessage(data, errorType) : generateSingleZaloMessage(data); document.getElementById('zaloMessageTextarea').value = message; document.getElementById('zaloMessageModal').style.display = 'block'; }
function closeZaloModal() { document.getElementById('zaloMessageModal').style.display = 'none'; }
function copyZaloMessage() { const textarea = document.getElementById('zaloMessageTextarea'); textarea.select(); textarea.setSelectionRange(0, 99999); try { navigator.clipboard.writeText(textarea.value); alert('Đã sao chép nội dung vào clipboard!'); } catch (err) { alert('Sao chép thất bại. Vui lòng thử lại.'); console.error('Lỗi sao chép: ', err); } }
function exportDashboardToExcel() {
    if (!globalData || globalData.allRecords.length === 0) {
        alert('Chưa có dữ liệu để xuất. Vui lòng xử lý một file XML trước.');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        const stats = calculateGlobalStats(globalData.allRecords);

        // --- Sheet 1: Tổng quan ---
        const overviewData = [
            ["BÁO CÁO TỔNG QUAN DASHBOARD"],
            [],
            ["Chỉ số", "Giá trị"],
            ["Tổng hồ sơ", stats.totalRecords],
            ["Số hồ sơ lỗi", stats.errorRecordsCount],
            ["Tổng chi phí BHYT TT", stats.totalAmount],
            ["Tổng chi phí BN CCT", stats.totalBncct],
            ["Tổng tiền Nguồn khác", globalData.allRecords.reduce((sum, r) => sum + (r.t_nguonkhac || 0), 0)]
        ];
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, "TongQuan");

        // --- Sheet 2: Phân bố lỗi ---
        const errorData = Object.entries(stats.errorTypes).map(([key, value]) => ({
            "Loại lỗi": ERROR_TYPES[key] || key,
            "Số lượng": value
        }));
        const wsErrors = XLSX.utils.json_to_sheet(errorData);
        XLSX.utils.book_append_sheet(wb, wsErrors, "PhanBoLoi");

        // --- Sheet 3: Dòng thời gian ---
        const timelineData = Object.entries(stats.timeline)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, count]) => ({
                "Ngày": formatDateTimeForDisplay(day),
                "Số hồ sơ": count
            }));
        const wsTimeline = XLSX.utils.json_to_sheet(timelineData);
        XLSX.utils.book_append_sheet(wb, wsTimeline, "DongThoiGian");

        // --- Sheet 4: Thống kê Khoa ---
        const departmentData = Object.entries(stats.departments)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({
                "Tên Khoa": name || "Không xác định",
                "Số hồ sơ": count
            }));
        const wsDepartments = XLSX.utils.json_to_sheet(departmentData);
        XLSX.utils.book_append_sheet(wb, wsDepartments, "ThongKeKhoa");

        // --- Sheet 5 & 6: Top Thuốc và DVKT ---
        const drugCosts = {};
        globalData.allDrugs.forEach(drug => {
            const key = `${drug.ten_thuoc} (${drug.ma_thuoc})`;
            drugCosts[key] = (drugCosts[key] || 0) + drug.thanh_tien_bh;
        });
        const topDrugs = Object.entries(drugCosts).sort(([, a], [, b]) => b - a).slice(0, 10)
            .map(([name, cost]) => ({ "Tên thuốc": name, "Tổng chi phí BHYT": cost }));
        const wsDrugs = XLSX.utils.json_to_sheet(topDrugs);
        XLSX.utils.book_append_sheet(wb, wsDrugs, "Top10Thuoc");

        const serviceCosts = {};
        globalData.allServices.forEach(service => {
            const key = `${service.ten_dich_vu} (${service.ma_dich_vu})`;
            serviceCosts[key] = (serviceCosts[key] || 0) + service.thanh_tien_bh;
        });
        const topServices = Object.entries(serviceCosts).sort(([, a], [, b]) => b - a).slice(0, 10)
            .map(([name, cost]) => ({ "Tên DVKT": name, "Tổng chi phí BHYT": cost }));
        const wsServices = XLSX.utils.json_to_sheet(topServices);
        XLSX.utils.book_append_sheet(wb, wsServices, "Top10DVKT");

        // --- Xuất file ---
        XLSX.writeFile(wb, "BaoCao_Dashboard.xlsx");

    } catch (error) {
        console.error("Lỗi khi xuất file Excel Dashboard:", error);
        alert("Đã có lỗi xảy ra khi tạo file Excel. Vui lòng thử lại.");
    }
}
// File: schedule-manager.js

// Biến toàn cục để lưu trữ lịch nghỉ và đối tượng dropdown tìm kiếm
let doctorSchedules = {};
let scheduleChoices = null;

/**
 * Tải lịch nghỉ đã lưu từ localStorage của trình duyệt vào biến doctorSchedules.
 */
function loadSchedules() {
    const savedSchedules = localStorage.getItem('doctorSchedules');
    if (savedSchedules) {
        doctorSchedules = JSON.parse(savedSchedules);
    }
}

/**
 * Lưu đối tượng doctorSchedules hiện tại vào localStorage.
 */
function saveSchedules() {
    localStorage.setItem('doctorSchedules', JSON.stringify(doctorSchedules));
    alert('Đã lưu lịch nghỉ thành công!');
}

/**
 * Hiển thị danh sách các ngày nghỉ của một bác sĩ được chọn lên giao diện.
 * @param {string} maBS - Mã của bác sĩ.
 */
function renderVacationList(maBS) {
    const vacationListDiv = document.getElementById('vacationList');
    if (!vacationListDiv) return;
    
    const schedule = doctorSchedules[maBS] || [];
    vacationListDiv.innerHTML = `<h4>Lịch nghỉ của ${staffNameMap.get(maBS) || maBS}:</h4>`;

    if (schedule.length === 0) {
        vacationListDiv.innerHTML += '<p>Chưa có ngày nghỉ nào được thêm.</p>';
        return;
    }

    const list = document.createElement('ul');
    schedule.sort().forEach(date => {
        const listItem = document.createElement('li');
        listItem.textContent = new Date(date + 'T00:00:00').toLocaleDateString('vi-VN');
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Xóa';
        removeButton.onclick = () => {
            doctorSchedules[maBS] = doctorSchedules[maBS].filter(d => d !== date);
            renderVacationList(maBS);
        };
        listItem.appendChild(removeButton);
        list.appendChild(listItem);
    });
    vacationListDiv.appendChild(list);
}

/**
 * Xem danh sách các bác sĩ nghỉ trong một ngày được chọn.
 */
function viewVacationsByDate() {
    const dateInput = document.getElementById('viewVacationByDateInput');
    const resultsDiv = document.getElementById('vacationsByDateResult');
    const selectedDate = dateInput.value; // Format: YYYY-MM-DD

    if (!selectedDate) {
        resultsDiv.innerHTML = '<p>Vui lòng chọn một ngày.</p>';
        return;
    }

    const doctorsOnLeave = [];
    for (const maBS in doctorSchedules) {
        if (doctorSchedules[maBS].includes(selectedDate)) {
            const tenBS = staffNameMap.get(maBS) || maBS;
            doctorsOnLeave.push(tenBS);
        }
    }

    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN');
    if (doctorsOnLeave.length > 0) {
        let html = `<h4>Danh sách bác sĩ nghỉ ngày ${displayDate}:</h4><ul>`;
        doctorsOnLeave.forEach(name => {
            html += `<li>${name}</li>`;
        });
        html += '</ul>';
        resultsDiv.innerHTML = html;
    } else {
        resultsDiv.innerHTML = `<p>✅ Không có bác sĩ nào nghỉ vào ngày ${displayDate}.</p>`;
    }
}

/**
 * Khởi tạo toàn bộ giao diện và sự kiện cho tab "Quản lý lịch nghỉ".
 */
function initializeScheduler() {
    const doctorSelect = document.getElementById('doctorScheduleSelect');
    if (!doctorSelect) return;

    // 1. Chuẩn bị dữ liệu cho dropdown tìm kiếm
    const doctorChoicesData = Array.from(staffNameMap.entries()).map(([code, name]) => ({
        value: code,
        label: `${name} (${code})`
    }));

    // 2. Hủy và khởi tạo lại Choices.js với cấu hình nâng cao
    if (scheduleChoices) {
        scheduleChoices.destroy();
    }
    doctorSelect.innerHTML = '';
    scheduleChoices = new Choices(doctorSelect, {
        choices: doctorChoicesData,
        searchPlaceholderValue: "Nhập tên hoặc mã để tìm...",
        itemSelectText: 'Nhấn để chọn',
        noResultsText: 'Không tìm thấy kết quả',
        noChoicesText: 'Không có lựa chọn nào',
        shouldSort: false,
        fuseOptions: {
            keys: ['label'],
            threshold: 0.3
        }
    });

    // 3. Gán các sự kiện cho các nút bấm
    const vacationDateInput = document.getElementById('vacationDate');
    const addButton = document.getElementById('addVacationDayButton');
    const saveButton = document.getElementById('saveScheduleButton');
    const viewByDateButton = document.getElementById('viewVacationByDateButton');

    doctorSelect.addEventListener('change', () => {
        const selectedBS = scheduleChoices.getValue(true);
        if (selectedBS) {
            renderVacationList(selectedBS);
        } else {
            document.getElementById('vacationList').innerHTML = '<p>Vui lòng chọn một bác sĩ...</p>';
        }
    });

    addButton.addEventListener('click', () => {
        const selectedBS = scheduleChoices.getValue(true);
        const vacationDate = vacationDateInput.value;
        if (!selectedBS || !vacationDate) {
            alert('Vui lòng chọn bác sĩ và ngày nghỉ!');
            return;
        }

        if (!doctorSchedules[selectedBS]) {
            doctorSchedules[selectedBS] = [];
        }
        
        if (!doctorSchedules[selectedBS].includes(vacationDate)) {
            doctorSchedules[selectedBS].push(vacationDate);
            renderVacationList(selectedBS);
        } else {
            alert('Ngày nghỉ này đã được thêm từ trước.');
        }
    });
    
    saveButton.addEventListener('click', saveSchedules);
    
    if (viewByDateButton) {
        viewByDateButton.addEventListener('click', viewVacationsByDate);
    }
}

// Chạy các hàm cần thiết khi trang được tải xong
document.addEventListener('DOMContentLoaded', () => {
    loadSchedules();
    initializeScheduler();
});

/**
 * Gửi tin nhắn thông báo BẮT ĐẦU kiểm tra file về Telegram.
 */
function sendTelegramStartLog(file) {
    const BOT_TOKEN = '653011165:AAGp9LKx0m18ioi__FxRlznrL38NL1fioqs'; // <-- THAY TOKEN CỦA BẠN
    const CHAT_ID = '1734114014';    // <-- THAY ID KÊNH CỦA BẠN

    const now = new Date();
    const timestamp = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(',', '');
    const fileSizeKB = (file.size / 1024).toFixed(2);

    let message = `<b>🚀 BẮT ĐẦU KIỂM TRA</b>\n\n`;
    message += `📄 <b>Tên file:</b> ${file.name}\n`;
    message += `💾 <b>Kích thước:</b> ${fileSizeKB} KB\n\n`;
    message += `⏰ <b>Thời gian bắt đầu:</b> ${timestamp}`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const params = { chat_id: CHAT_ID, text: message, parse_mode: 'HTML' };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    }).then(response => response.json()).then(data => {
        if (data.ok) console.log('Thông báo bắt đầu đã được gửi!');
        else console.error('Lỗi gửi thông báo bắt đầu:', data.description);
    }).catch(error => console.error('Lỗi mạng:', error));
}

/**
 * Gửi tin nhắn "Bắt đầu" và trả về ID của tin nhắn đó để cập nhật sau.
 * @param {File} file - Đối tượng file đang được xử lý.
 * @returns {Promise<number|null>} - Promise chứa message_id hoặc null nếu có lỗi.
 */
async function sendTelegramStartLog(file) {
    const BOT_TOKEN = '7653011165:AAGp9LKx0m18ioi__FxRlznrL38NL1fioqs'; // <-- Token của bạn
    const CHAT_ID = '1734114014';    // <-- ID kênh của bạn

    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(',', '');
    const fileSizeKB = (file.size / 1024).toFixed(2);

    // Tin nhắn ban đầu
    let message = `<b>🚀 BẮT ĐẦU KIỂM TRA</b>\n\n`;
    message += `📄 <b>Tên file:</b> ${file.name}\n`;
    message += `<i>Vui lòng chờ, đang xử lý...</i>`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const params = { chat_id: CHAT_ID, text: message, parse_mode: 'HTML' };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const data = await response.json();
        if (data.ok) {
            console.log('Tin nhắn ban đầu đã gửi, message_id:', data.result.message_id);
            return data.result.message_id; // Trả về ID của tin nhắn
        } else {
            console.error('Lỗi khi gửi tin nhắn ban đầu:', data.description);
            return null;
        }
    } catch (error) {
        console.error('Lỗi mạng hoặc fetch:', error);
        return null;
    }
}

/**
 * Cập nhật một tin nhắn đã có trên Telegram với kết quả chi tiết.
 * @param {number} messageId - ID của tin nhắn cần cập nhật.
 * @param {object} stats - Đối tượng chứa tất cả các thông số thống kê.
 */
function updateTelegramLog(messageId, stats) {
    if (!messageId) return; // Không làm gì nếu không có messageId

    const BOT_TOKEN = '7653011165:AAGp9LKx0m18ioi__FxRlznrL38NL1fioqs'; // <-- Token của bạn
    const CHAT_ID = '1734114014';    // <-- ID kênh của bạn

    // Nội dung tin nhắn cập nhật
    let message = `<b>🔎 Kết Quả Kiểm Tra</b>\n\n`;
    message += `🏥 <b>Mã CSKCB:</b> ${stats.maCskcb}\n`;
    message += `📒 <b>Tổng hồ sơ:</b> ${stats.total}\n`;
    message += `✔️ <b>Số hồ sơ hợp lệ:</b> ${stats.valid}\n`;
    message += `❌ <b>Tổng số hồ sơ lỗi:</b> ${stats.totalError}\n`;
    message += `🔴 <b>Lỗi nghiêm trọng:</b> ${stats.criticalError}\n`;
    message += `🟡 <b>Chỉ có cảnh báo:</b> ${stats.warningOnly}\n`;
    message += `🎉 <b>Tổng tiền dự kiến XT:</b> ${formatCurrency(stats.denialAmount)}`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
    const params = {
        chat_id: CHAT_ID,
        message_id: messageId,
        text: message,
        parse_mode: 'HTML'
    };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    }).then(response => response.json()).then(data => {
        if (data.ok) console.log('Tin nhắn đã được cập nhật thành công!');
        else console.error('Lỗi khi cập nhật tin nhắn:', data.description);
    }).catch(error => console.error('Lỗi mạng:', error));
}
