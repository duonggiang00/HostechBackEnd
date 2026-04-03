<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lời mời tham gia Hostech</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; color: #1a202c; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 40px auto; width: 100%; max-width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); padding: 40px 20px; text-align: center; color: #ffffff; }
        .logo { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0; }
        .content { padding: 40px; line-height: 1.7; }
        .greeting { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
        .invitation-text { font-size: 16px; color: #4a5568; }
        .highlight { color: #2563eb; font-weight: 600; }
        .card { background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin: 24px 0; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { border-radius: 8px; background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
        .footer { padding: 30px; text-align: center; font-size: 13px; color: #718096; }
        .divider { border: 0; border-top: 1px solid #edf2f7; margin: 30px 0; }
        .help-text { font-size: 12px; color: #a0aec0; margin-top: 20px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main">
            <div class="header">
                <h1 class="logo">Hostech</h1>
                <p style="opacity: 0.9; margin-top: 5px;">Hệ thống quản lý thông minh</p>
            </div>
            <div class="content">
                <div class="greeting">Xin chào!</div>
                <p class="invitation-text">
                    Bạn đã nhận được lời mời tham gia tổ chức <span class="highlight">{{ $orgName }}</span> 
                    từ <span class="highlight">{{ $inviterName }}</span> với vai trò 
                    <span class="highlight">{{ $roleName }}</span>.
                </p>
                
                <div class="card">
                    Vui lòng xác nhận tài khoản của bạn để bắt đầu sử dụng các tính năng quản lý của Hostech. 
                    Lời mời này có hiệu lực trong vòng <strong>7 ngày</strong>.
                </div>
                
                <div class="btn-container">
                    <a href="{{ $inviteLink }}" class="btn">Thiết lập tài khoản ngay</a>
                </div>
                
                <hr class="divider">
                
                <p style="font-size: 14px; text-align: center;">
                    Nếu nút trên không hoạt động, bạn có thể sao chép liên kết dưới đây vào trình duyệt:
                </p>
                <div class="help-text">{{ $inviteLink }}</div>
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} Hostech System. Tất cả các quyền được bảo lưu.</p>
                <p>Cần hỗ trợ? Liên hệ <a href="mailto:support@hostech.com" style="color: #2563eb;">support@hostech.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>
