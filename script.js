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

const ERROR_TYPES = {
    'NGAY_YL_THUOC_SAU_RA_VIEN': 'Thuốc - YL sau ra viện',
    'NGAY_YL_DVKT_SAU_RA_VIEN': 'DVKT - YL sau ra viện',
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
    'NGAY_TAI_KHAM_NO_XML14': 'Có ngày tái khám nhưng không có Giấy hẹn (XML14)'
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

function processXmlContent(xmlContent) {
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

    // === CALCULATION LOGIC FOR SUMMARY POPUP ===
    const total = globalData.allRecords.length;
    let totalErrorRecords = 0;
    let criticalErrorRecords = 0;
    let warningOnlyRecords = 0;
    let totalDenialAmount = 0;

    globalData.allRecords.forEach(r => {
        if (r.errors.length > 0) {
            totalErrorRecords++;
            const hasCritical = r.errors.some(e => e.severity === 'critical');
            if (hasCritical) {
                criticalErrorRecords++;
            }

            const countedItemsInRecord = new Set();
            r.errors.forEach(e => {
                if (e.severity === 'critical' && e.cost > 0 && e.itemName && !countedItemsInRecord.has(e.itemName)) {
                    totalDenialAmount += e.cost;
                    countedItemsInRecord.add(e.itemName);
                }
            });
        }
    });
    
    warningOnlyRecords = totalErrorRecords - criticalErrorRecords;

    showSummaryPopup({ 
        total: total, 
        totalError: totalErrorRecords,
        criticalError: criticalErrorRecords,
        warningOnly: warningOnlyRecords,
        denialAmount: totalDenialAmount,
        valid: total - totalErrorRecords 
    });
}

function processXmlFile() {
    const file = document.getElementById('validatorFileInput').files[0];
    if (!file) return alert('Vui lòng chọn file XML!');
    
    showLoading('validatorLoading');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            globalData.xmlDataContent = e.target.result;
            setTimeout(() => processXmlContent(globalData.xmlDataContent), 100);
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

    // Step 1, 2, 3: Populate maps for other rules (giữ nguyên)
    records.forEach(record => {
        if (record.services) {
            record.services.forEach(service => {
                if (service.ma_may && service.ngay_th_yl) {
                    const key = `${service.ma_may}_${service.ngay_th_yl}`;
                    if (!machineTimeMap.has(key)) machineTimeMap.set(key, []);
                    machineTimeMap.get(key).push({ maLk: record.maLk, tenDv: service.ten_dich_vu, cost: service.thanh_tien_bh });
                }
            });
        }
        if (record.drugs) {
            record.drugs.forEach(drug => {
                if (drug.ma_bac_si && drug.ngay_yl) {
                    const key = `${drug.ma_bac_si}_${drug.ngay_yl}`;
                    if (!doctorTimeMap.has(key)) doctorTimeMap.set(key, []);
                    doctorTimeMap.get(key).push({ maLk: record.maLk, tenThuoc: drug.ten_thuoc, cost: drug.thanh_tien_bh });
                }
            });
        }
    });

    // Step 2: Find MA_MAY conflicts
    machineTimeMap.forEach((conflicts, key) => {
        const uniqueMaLksInConflict = Array.from(new Set(conflicts.map(c => c.maLk)));
        if (uniqueMaLksInConflict.length > 1) {
            const [maMay, ngayThYl] = key.split('_');
            uniqueMaLksInConflict.forEach(currentMaLk => {
                const recordToUpdate = records.find(r => r.maLk === currentMaLk);
                if (recordToUpdate) {
                    const firstConflictForThisPatient = conflicts.find(c => c.maLk === currentMaLk);
                    const otherMaLks = uniqueMaLksInConflict
                        .filter(maLk => maLk !== currentMaLk)
                        .map(maLk => {
                            const r = records.find(rec => rec.maLk === maLk);
                            return r ? `${r.hoTen} (${r.maBn || r.maLk})` : maLk;
                        }).join(', ');
                    
                    const ruleKey = 'MA_MAY_TRUNG_THOI_GIAN';
                    if (validationSettings[ruleKey]?.enabled) {
                        recordToUpdate.errors.push({
                            type: ruleKey,
                            severity: validationSettings[ruleKey].severity,
                            message: `DV "${firstConflictForThisPatient.tenDv}" (Máy: ${maMay}) trùng thời điểm [${formatDateTimeForDisplay(ngayThYl)}] với các ca: ${otherMaLks}`,
                            cost: firstConflictForThisPatient.cost,
                            itemName: firstConflictForThisPatient.tenDv
                        });
                    }
                }
            });
        }
    });

    // Step 3: Find MA_BAC_SI conflicts (XML2 – thuốc)
    doctorTimeMap.forEach((conflicts, key) => {
        const uniqueMaLksInConflict = Array.from(new Set(conflicts.map(c => c.maLk)));
        if (uniqueMaLksInConflict.length > 1) {
            const [maBs, ngayYl] = key.split('_');
            const tenBacSi = staffNameMap.get(maBs) || maBs;
            uniqueMaLksInConflict.forEach(currentMaLk => {
                const recordToUpdate = records.find(r => r.maLk === currentMaLk);
                if (recordToUpdate) {
                    const firstConflictForThisPatient = conflicts.find(c => c.maLk === currentMaLk);
                    const otherMaLks = uniqueMaLksInConflict
                        .filter(maLk => maLk !== currentMaLk)
                        .map(maLk => {
                            const r = records.find(rec => rec.maLk === maLk);
                            return r ? `${r.hoTen} (${r.maBn || r.maLk})` : maLk;
                        }).join(', ');
                    
                    const ruleKey = 'BS_TRUNG_THOI_GIAN';
                    if (validationSettings[ruleKey]?.enabled) {
                        recordToUpdate.errors.push({
                            type: ruleKey,
                            severity: validationSettings[ruleKey].severity,
                            message: `BS ${tenBacSi} cho y lệnh thuốc "${firstConflictForThisPatient.tenThuoc}" trùng thời điểm [${formatDateTimeForDisplay(ngayYl)}] với các ca khác: ${otherMaLks}`,
                            cost: firstConflictForThisPatient.cost,
                            itemName: firstConflictForThisPatient.tenThuoc
                        });
                    }
                }
            });
        }
    });
    
    // Step 4: BS_KHAM_CHONG_LAN theo XML3 — CHỈ check hồ sơ "khám-only"
 const doctorXml3Windows = new Map(); // maBs -> Map(maLk -> { startTHYL, endKQ, khamOnly: true })
    const take12 = s => (typeof s === 'string' && s.length >= 12 ? s.substring(0, 12) : null);
    const isKham = (svc) => (svc.ten_dich_vu || '').toLowerCase().includes('khám');

    records.forEach(record => {
        if (!record.services || record.services.length === 0) return;

        let hasKham = false;
        let hasNonKham = false;
        record.services.forEach(svc => {
            if (isKham(svc)) hasKham = true; else hasNonKham = true;
        });

        if (!hasKham || hasNonKham) return; // Chỉ xét hồ sơ "chỉ có công khám"

        record.services.forEach(svc => {
            if (!isKham(svc)) return;

            const maBs = svc.ma_bac_si;
            const th = take12(svc.ngay_th_yl); // Lấy NGAY_TH_YL làm mốc bắt đầu
            const kq = take12(svc.ngay_kq);

            if (!maBs || !th || !kq) return; // Yêu cầu phải có cả NGAY_TH_YL và NGAY_KQ

            if (!doctorXml3Windows.has(maBs)) doctorXml3Windows.set(maBs, new Map());
            const byRecord = doctorXml3Windows.get(maBs);

            if (!byRecord.has(record.maLk)) {
                byRecord.set(record.maLk, { startTHYL: th, endKQ: kq, khamOnly: true });
            } else {
                const win = byRecord.get(record.maLk);
                if (th < win.startTHYL) win.startTHYL = th; // Lấy thời gian bắt đầu sớm nhất
                if (kq > win.endKQ) win.endKQ = kq;       // Lấy thời gian kết thúc muộn nhất
            }
        });
    });

    // So sánh chồng lấn chỉ giữa các hồ sơ "chỉ có công khám"
    doctorXml3Windows.forEach((byRecord, maBs) => {
        const tenBacSi = staffNameMap.get(maBs) || maBs;
        const windows = Array.from(byRecord.entries())
            .map(([maLk, w]) => ({ maLk, ...w }))
            .filter(w => w.khamOnly && w.startTHYL && w.endKQ); // Lọc theo startTHYL

        const containsMap = new Map();

        for (let i = 0; i < windows.length; i++) {
            for (let j = 0; j < windows.length; j++) {
                if (i === j) continue;
                const A = windows[i]; // Ca lớn hơn (chứa)
                const B = windows[j]; // Ca nhỏ hơn (bị chứa)
                
                // So sánh bằng startTHYL
                if (B.startTHYL >= A.startTHYL && B.endKQ <= A.endKQ) {
                    if (!containsMap.has(B.maLk)) containsMap.set(B.maLk, { Bwin: B, Aset: new Set() });
                    containsMap.get(B.maLk).Aset.add(A.maLk);
                }
            }
        }

        const ruleKey = 'BS_KHAM_CHONG_LAN';
        if (!validationSettings[ruleKey]?.enabled) return;

        containsMap.forEach(({ Bwin, Aset }, bMaLk) => {
            if (Aset.size === 0) return;

            const recordB = records.find(r => r.maLk === bMaLk);
            if (!recordB) return;

            const idB = recordB.maBn || recordB.maLk;
            const B_TH = formatDateTimeForDisplay(Bwin.startTHYL); // Định dạng startTHYL
            const B_KQ = formatDateTimeForDisplay(Bwin.endKQ);

            const AInfo = Array.from(Aset)
                .map(aLk => records.find(r => r.maLk === aLk))
                .filter(Boolean)
                .map(recA => {
                    const idA = recA.maBn || recA.maLk;
                    const wA = byRecord.get(recA.maLk);
                    const A_TH = formatDateTimeForDisplay(wA.startTHYL); // Định dạng startTHYL
                    const A_KQ = formatDateTimeForDisplay(wA.endKQ);
                    return {
                        textShort: `"${recA.hoTen}" (${idA})`,
                        detailLine: `• ${recA.hoTen} (${idA}): [TH_YL: ${A_TH} → KQ: ${A_KQ}]` // Cập nhật chi tiết
                    };
                });

            const headerAs = AInfo.map(a => a.textShort).join(', ');

            const sumKhamCost = (rec) => {
                if (!rec || !rec.services) return 0;
                return rec.services
                    .filter(svc => (svc.ten_dich_vu || '').toLowerCase().includes('khám'))
                    .reduce((acc, svc) => acc + (Number(svc.thanh_tien_bh) || 0), 0);
            };
            const khamCost = sumKhamCost(recordB);

            // Cập nhật thông báo lỗi
            const msg =
                `BS ${tenBacSi} khám chồng (XML 3 công khám): Khoảng thời gian của "${recordB.hoTen}" (${idB}) ` +
                `[TH_YL: ${B_TH} → KQ: ${B_KQ}] nằm TRONG ${AInfo.length} ca khác: ${headerAs}.` +
                `<br><strong>Chi tiết CÔNG KHÁM (XML 3):</strong><br>` +
                `${AInfo.map(a => a.detailLine).join('<br>')}`;

            recordB.errors.push({
                type: ruleKey,
                severity: validationSettings[ruleKey].severity,
                message: msg,
                cost: validationSettings[ruleKey]?.severity === 'critical' ? khamCost : 0,
                itemName: 'Công khám'
            });
        });
    });
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
    const getText = (element, ...selectors) => {
        if (!element) return '';
        for (const selector of selectors) {
            const node = element.querySelector(selector);
            if (node && node.textContent) {
                const text = node.textContent.trim();
                if (text) return text;
            }
        }
        return '';
    };
    
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
        chanDoan: getText(tongHopNode,'CHAN_DOAN_RV', 'MA_BENH'),
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
            const maBacSi = getText(item, 'MA_BAC_SI');
            const ngayYl = getText(item, 'NGAY_YL');
            const ngayThYl = getText(item, 'NGAY_TH_YL');

            drugsForGlobalList.push({
                ma_lk: maLk, ma_thuoc: getText(item, 'MA_THUOC'), ten_thuoc: tenThuoc,
                so_luong: parseFloat(getText(item, 'SO_LUONG') || '0'),
                thanh_tien_bh: thanhTienBH
            });
            if(maBacSi && ngayYl) {
                record.drugs.push({
                    ma_bac_si: maBacSi,
                    ngay_yl: ngayYl,
                    ten_thuoc: tenThuoc,
                    thanh_tien_bh: thanhTienBH
                });
                if (!record.mainDoctor) {
                    record.mainDoctor = maBacSi;
                }
            }

            if (ngayYl && ngayYl > record.ngayRa) record.errors.push({ type: 'NGAY_YL_THUOC_SAU_RA_VIEN', severity: 'critical', message: `Thuốc "${tenThuoc}": YL [${formatDateTimeForDisplay(ngayYl)}] sau ngày ra [${formatDateTimeForDisplay(record.ngayRa)}]`, cost: thanhTienBH, itemName: tenThuoc });
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

            if(maBacSi) record.bac_si_chi_dinh.add(maBacSi);
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
            const maBacSi = getText(item, 'MA_BAC_SI');

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
                ma_bac_si: maBacSi,
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

            if(maBacSi) record.bac_si_chi_dinh.add(maBacSi);
            const nguoiThucHien = getText(item, 'NGUOI_THUC_HIEN', 'MA_NGUOI_THIEN');
            if(nguoiThucHien) record.nguoi_thuc_hien.add(nguoiThucHien);
        });
    }
    record.has_kham_and_dvkt = hasKham && hasOtherDvkt;

    const xml4Data = [];
    if (record.has_xml4) {
        chiTietCLSNode.querySelectorAll('CHI_TIET_CLS').forEach(cls => {
            const maDichVu = getText(cls, 'MA_DICH_VU');
            const tenChiSo = getText(cls, 'TEN_CHI_SO');
            const maBsDocKq = getText(cls, 'MA_BS_DOC_KQ');

            xml4Data.push({
                ma_dich_vu: maDichVu,
                ten_chi_so: tenChiSo,
                gia_tri: getText(cls, 'GIA_TRI'),
                don_vi_do: getText(cls, 'DON_VI_DO'),
                ngay_kq: formatDateTimeForDisplay(getText(cls, 'NGAY_KQ'))
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

    let tableHTML = `<table class="results-table"><thead><tr>
        <th>STT</th>
        <th>Mã Dịch Vụ</th>
        <th>Tên Chỉ Số</th>
        <th>Giá Trị</th>
        <th>Đơn Vị</th>
        <th>Ngày Kết Quả</th>
    </tr></thead><tbody>`;

    details.forEach((item, index) => {
        tableHTML += `<tr>
            <td>${index + 1}</td>
            <td>${item.ma_dich_vu}</td>
            <td>${item.ten_chi_so}</td>
            <td>${item.gia_tri}</td>
            <td>${item.don_vi_do}</td>
            <td>${item.ngay_kq}</td>
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
        'NGAY_TAI_KHAM_NO_XML14'
    ];

    // Rules that are always treated as 'warnings' and are NOT configurable
    const fixedWarnings = [
        'NGAY_TTOAN_SAU_RA_VIEN', 
        'KHAM_DUOI_5_PHUT'
    ];

    // Rules that are always treated as 'critical' errors and are NOT configurable
    const criticalErrors = [
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
