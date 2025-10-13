/**
 * FILE MỚI: support_tab.js
 * =============================
 * - Thêm tab "Hỗ trợ & Liên hệ" với menu con.
 * - Bao gồm trang "Thông tin liên hệ" và "Ủng hộ dự án".
 * - Tự động tiêm HTML, CSS và gắn sự kiện cần thiết.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Support Tab feature loaded.");

    // ===================================================================
    // BƯỚC 1: TIÊM CSS CHO TAB MỚI
    // ===================================================================
    const supportStyles = `
        /* Dropdown container for the new tab */
        .support-dropdown {
            position: relative;
            display: inline-block;
        }

        /* Dropdown content (hidden by default) */
        .dropdown-content {
            display: none;
            position: absolute;
            background-color: #f1f1f1;
            min-width: 200px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            z-index: 1001;
            border-radius: 0 0 8px 8px;
            overflow: hidden;
            animation: fadeIn 0.3s ease-out;
        }
        
        body.dark .dropdown-content {
            background-color: #1f2937;
        }

        /* Links inside the dropdown */
        .dropdown-content a {
            color: black;
            padding: 12px 16px;
            text-decoration: none;
            display: block;
            text-align: left;
            font-size: 0.95em;
        }
        
        body.dark .dropdown-content a {
            color: #e5e7eb;
        }

        /* Change color of dropdown links on hover */
        .dropdown-content a:hover {
            background-color: #ddd;
        }
        
        body.dark .dropdown-content a:hover {
            background-color: #374151;
        }

        /* Show the dropdown menu on hover */
        .support-dropdown:hover .dropdown-content {
            display: block;
        }
        
        /* --- Styles for Support Tab Content --- */
        .support-container {
            max-width: 900px;
            margin: 20px auto;
            padding: 20px;
        }
        
        .support-section {
            display: none; /* Hidden by default */
        }
        
        .support-section.active {
            display: block; /* Show active section */
        }
        
        /* Contact Card Styles */
        .contact-card {
            background: #ffffff;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        
        body.dark .contact-card {
             background: #1f2937;
             box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }

        .contact-card .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid #667eea;
            object-fit: cover;
        }
        
        .contact-card h2 {
            font-size: 2em;
            color: #2c3e50;
            margin: 0;
        }
        
        body.dark .contact-card h2 {
            color: #f9fafb;
        }
        
        .contact-card .title {
            font-size: 1.1em;
            color: #7f8c8d;
            margin-top: -15px;
        }
        
        body.dark .contact-card .title {
            color: #9ca3af;
        }

        .contact-links {
            display: flex;
            gap: 15px;
            margin-top: 10px;
        }

        .contact-links a {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .contact-links .zalo { background-color: #0068ff; color: white; }
        .contact-links .phone { background-color: #28a745; color: white; }
        .contact-links .email { background-color: #dc3545; color: white; }
        
        .contact-links a:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        /* Donate Section Styles */
        .donate-section {
            text-align: center;
        }
        
        .donate-section h2 {
            font-size: 2.2em;
            color: #c0392b;
            margin-bottom: 20px;
        }
        
        body.dark .donate-section h2 {
            color: #e74c3c;
        }

        .donate-section .thank-you-text {
            max-width: 800px;
            margin: 0 auto 30px auto;
            text-align: left;
            line-height: 1.8;
            font-size: 1.1em;
        }
        
        .donate-section .thank-you-text p {
            margin-bottom: 15px;
        }
        
        .donate-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .donate-button {
            background: white;
            border: 2px solid #e1e8ed;
            border-radius: 12px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 180px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        body.dark .donate-button {
            background: #1f2937;
            border-color: #374151;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .donate-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .donate-button img {
            height: 40px;
            margin-bottom: 10px;
        }
        
        .donate-button span {
            display: block;
            font-weight: 600;
            color: #2c3e50;
        }
        
        body.dark .donate-button span {
            color: #e5e7eb;
        }

        /* QR Code Modal */
        #qrModal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0; top: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
            justify-content: center;
            align-items: center;
        }
        #qrModal.show { display: flex; }
        #qrModal img {
            max-width: 90%;
            max-height: 90%;
            width: 350px;
            height: auto;
            border-radius: 15px;
            border: 5px solid white;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = supportStyles;
    document.head.appendChild(styleSheet);

    // ===================================================================
    // BƯỚC 2: TIÊM HTML
    // ===================================================================
    // 1. Tạo Tab Button với Dropdown
    const supportDropdown = document.createElement('div');
    supportDropdown.className = 'tab-button support-dropdown';
    supportDropdown.innerHTML = `
        <span>📞 Hỗ trợ</span>
        <div class="dropdown-content">
            <a href="#" data-target="contactPage">Thông tin liên hệ</a>
            <a href="#" data-target="donatePage">Ủng hộ dự án</a>
        </div>
    `;

    // 2. Tạo Tab Content
    const supportTabContent = document.createElement('div');
    supportTabContent.id = 'supportTab';
    supportTabContent.className = 'tab-content';
    supportTabContent.innerHTML = `
        <div class="support-container">
            <!-- Contact Section -->
            <div id="contactPage" class="support-section active">
                <div class="contact-card">
                    <img src="https://raw.githubusercontent.com/lqthai97/lqthai97.github.io/refs/heads/main/anhkhoa.jpg" alt="Avatar" class="avatar">
                    <div>
                        <h2>Trần Anh Khoa</h2>
                        <p class="title">Admin & Developer</p>
                    </div>
                    <div class="contact-links">
                        <a href="https://zalo.me/0332185388" target="_blank" class="zalo">Zalo</a>
                        <a href="tel:0332185388" class="phone">Gọi điện</a>
                        <a href="mailto:khoaanh181920@gmail.com" class="email">Email</a>
                    </div>
                </div>
            </div>
            
            <!-- Donate Section -->
            <div id="donatePage" class="support-section">
                <div class="donate-section">
                    <h2>Lời Cảm Ơn Trân Trọng Đến Những Người Ủng Hộ Dự Án</h2>
                    <div class="thank-you-text">
                        <p>• Tôi, Trần Anh Khoa, gửi lời cảm ơn sâu sắc đến bạn vì đã quyên góp và ủng hộ dự án.</p>
                        <p>• Dự án của tôi được xây dựng với mục tiêu mang đến giá trị hoàn toàn miễn phí cho cộng đồng, và chính những sự hỗ trợ quý báu như của bạn đã giúp chúng tôi tiếp tục duy trì và phát triển.</p>
                        <p>• Sự đóng góp của bạn không chỉ là nguồn động viên lớn về tinh thần, mà còn giúp tôi có thêm nguồn lực để cải thiện chất lượng, mở rộng phạm vi hoạt động và đem đến trải nghiệm tốt nhất cho mọi người.</p>
                        <p>• Dù lớn hay nhỏ, mọi sự đóng góp đều được trân trọng và đánh giá cao.</p>
                        <p>• Một lần nữa, tôi xin gửi lời cảm ơn chân thành và mong rằng bạn sẽ tiếp tục đồng hành cùng dự án trong thời gian tới.</p>
                        <p>• Trân trọng cảm ơn!</p>
                    </div>
                    <div class="donate-buttons">
                        <button class="donate-button" data-qr-src="https://i.ibb.co/Gv1p5BQj/bank.png"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Vietcombank_logo_fixed.svg/1200px-Vietcombank_logo_fixed.svg.png">
                        
                            <span>Chuyển khoản Ngân hàng</span>
                        </button>
                        
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 3. Tạo QR Code Modal
    const qrModal = document.createElement('div');
    qrModal.id = 'qrModal';
    qrModal.innerHTML = `<img id="qrImage" src="https://i.ibb.co/Gv1p5BQj/bank.png" alt="VietComBank" alt="QR Code">`;

    // 4. Chèn các element vào trang
    const nav = document.querySelector('.tab-nav');
    const container = document.querySelector('.container');
    if (nav && container) {
        nav.appendChild(supportDropdown);
        container.appendChild(supportTabContent);
        document.body.appendChild(qrModal);
    }

    // ===================================================================
    // BƯỚC 3: GẮN SỰ KIỆN (EVENT LISTENERS)
    // ===================================================================
    // Sự kiện cho tab chính
    supportDropdown.addEventListener('click', (event) => {
        // Chỉ xử lý khi click vào chính tab, không phải link con
        if (event.target.tagName === 'SPAN') {
            openTab({ currentTarget: supportDropdown }, 'supportTab');
        }
    });

    // Sự kiện cho các link trong dropdown
    const dropdownLinks = supportDropdown.querySelectorAll('.dropdown-content a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Mở tab Hỗ trợ nếu nó chưa được mở
            if (!supportTabContent.classList.contains('active')) {
                openTab({ currentTarget: supportDropdown }, 'supportTab');
            }
            
            // Ẩn tất cả các section con
            supportTabContent.querySelectorAll('.support-section').forEach(sec => sec.classList.remove('active'));
            
            // Hiện section được chọn
            const targetId = event.currentTarget.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Sự kiện cho các nút ủng hộ
    const donateButtons = document.querySelectorAll('.donate-button');
    donateButtons.forEach(button => {
        button.addEventListener('click', () => {
            const qrSrc = button.getAttribute('data-qr-src');
            const qrImage = document.getElementById('qrImage');
            if (qrSrc && qrImage) {
                qrImage.src = qrSrc;
                qrModal.classList.add('show');
            }
        });
    });
    
    // Sự kiện đóng QR Modal
    qrModal.addEventListener('click', () => {
        qrModal.classList.remove('show');
    });
});
