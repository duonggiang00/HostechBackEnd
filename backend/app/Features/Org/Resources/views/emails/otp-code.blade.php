<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mã xác thực OTP</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; color: #1a202c; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 40px auto; width: 100%; max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #edf2f7; }
        .logo { font-size: 24px; font-weight: 800; color: #2563eb; margin: 0; }
        .content { padding: 40px; text-align: center; line-height: 1.6; }
        .title { font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 10px; }
        .desc { font-size: 15px; color: #718096; margin-bottom: 30px; }
        .otp-container { background-color: #f8fafc; border: 2px dashed #cbd5e0; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; }
        .warning { font-size: 13px; color: #e53e3e; font-weight: 500; margin-top: 30px; padding: 12px; background-color: #fff5f5; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main">
            <div class="header">
                <div class="logo">Hostech</div>
            </div>
            <div class="content">
                <div class="title">Xác minh danh tính</div>
                <p class="desc">Vui lòng sử dụng mã dưới đây để hoàn tất việc đăng nhập.</p>
                
                <div class="otp-container">
                    <div class="otp-code">{{ $code }}</div>
                </div>
                
                <p class="desc" style="margin-top: 20px;">Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
                
                <div class="warning">
                    ⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu để bảo mật tài khoản.
                </div>
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} Hostech System. Chúc bạn một ngày tốt lành!</p>
            </div>
        </div>
    </div>
</body>
</html>
