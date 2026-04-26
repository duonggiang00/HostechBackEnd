<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mời ký hợp đồng thuê phòng</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .header { background: #4f46e5; padding: 28px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; }
        .body { padding: 32px; color: #374151; line-height: 1.7; }
        .body h2 { font-size: 16px; color: #111827; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; }
        .info-table td:first-child { font-weight: bold; background: #f9fafb; width: 40%; }
        .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; }
        .note { font-size: 12px; color: #9ca3af; margin-top: 20px; }
        .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <h1>🏠 Hostech — Thông báo hợp đồng thuê phòng</h1>
    </div>
    <div class="body">
        <h2>Xin chào {{ $recipientName }},</h2>
        <p>Bạn vừa được quản lý tòa nhà <strong>{{ $propertyName }}</strong> thêm vào hợp đồng thuê phòng. Vui lòng tạo tài khoản để xem chi tiết và xác nhận ký hợp đồng.</p>

        <table class="info-table">
            <tr><td>Phòng</td><td><strong>{{ $roomCode }}</strong></td></tr>
            <tr><td>Tòa nhà</td><td>{{ $propertyName }}</td></tr>
            <tr><td>Ngày bắt đầu</td><td>{{ $startDate }}</td></tr>
        </table>

        <p>Nhấn vào nút bên dưới để tạo tài khoản và kích hoạt hợp đồng của bạn:</p>

        <a href="{{ $registerUrl }}" class="btn" style="color: #ffffff; text-decoration: none;">Tạo tài khoản & Xem hợp đồng</a>

        <p class="note">
            Link này có hiệu lực trong <strong>72 giờ</strong>. Nếu bạn không yêu cầu thông tin này, hãy bỏ qua email này.
        </p>
    </div>
    <div class="footer">
        &copy; {{ date('Y') }} Hostech. Hệ thống quản lý khu trọ.
    </div>
</div>
</body>
</html>
