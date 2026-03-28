<?php

return [

    // Chế độ tích hợp: sandbox | production
    'mode' => env('VNPAY_MODE', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | VNPay Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | Tham khảo: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
    |
    */

    // Mã Merchant (Terminal ID) – lấy từ VNPay merchant portal
    'tmn_code' => env('VNPAY_TMN_CODE', 'DEMO'),

    // Hash Secret key – lấy từ VNPay merchant portal
    'hash_secret' => env('VNPAY_HASH_SECRET', ''),

    // Payment URL
    'payment_url' => env('VNPAY_PAYMENT_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),

    // API URL (query transaction, refund...)
    'api_url' => env('VNPAY_API_URL', 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'),

    // URL backend nhận callback từ VNPay (IPN – Instant Payment Notification)
    // VNPay gọi server-to-server, không qua browser
    'ipn_url' => env('VNPAY_IPN_URL', ''),

    // URL frontend redirect sau khi khách thanh toán xong
    // VNPay sẽ redirect browser về đây kèm query params
    'return_url' => env('VNPAY_RETURN_URL', env('FRONTEND_URL', 'http://127.0.0.1:5173') . '/payment/vnpay/return'),

    // Local sandbox fallback: nếu chưa có IPN public, cho phép chốt giao dịch từ return URL.
    'trust_return_as_ipn' => filter_var(env('VNPAY_TRUST_RETURN_AS_IPN', env('APP_ENV', 'production') === 'local'), FILTER_VALIDATE_BOOL),

    // Phiên bản API VNPay
    'version' => '2.1.0',

    // Múi giờ
    'timezone' => 'Asia/Ho_Chi_Minh',

    // Thời gian hết hạn thanh toán (phút)
    'expire_minutes' => env('VNPAY_EXPIRE_MINUTES', 15),

    // Đơn vị tiền tệ
    'curr_code' => 'VND',

    // Ngôn ngữ giao diện VNPay
    'locale' => 'vn',

    /*
    |--------------------------------------------------------------------------
    | VNPay Response Codes
    |--------------------------------------------------------------------------
    */
    'response_codes' => [
        '00' => 'Giao dịch thành công',
        '07' => 'Trừ tiền thành công – giao dịch bị nghi ngờ (liên quan đến lừa đảo)',
        '09' => 'TK/Thẻ chưa đăng ký Internet Banking',
        '10' => 'Xác thực thông tin sai quá 3 lần',
        '11' => 'Hết thời gian chờ thanh toán',
        '12' => 'Tài khoản/Thẻ bị khóa',
        '13' => 'Sai OTP',
        '24' => 'Khách hàng hủy giao dịch',
        '51' => 'Tài khoản không đủ số dư',
        '65' => 'Vượt hạn mức giao dịch trong ngày',
        '75' => 'Ngân hàng đang bảo trì',
        '79' => 'Nhập sai mật khẩu thanh toán quá số lần quy định',
        '99' => 'Lỗi không xác định',
    ],
];
