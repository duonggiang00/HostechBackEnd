<?php

namespace App\Services\Finance;

use App\Models\Finance\Payment;
use Carbon\Carbon;
use Illuminate\Support\Str;

class VNPayService
{
    // ╔═══════════════════════════════════════════════════════╗
    // ║  BUILD PAYMENT URL                                    ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo URL thanh toán VNPay (redirect browser sang VNPay portal).
     *
     * @param  Payment  $payment  Giao dịch cần thanh toán
     * @param  string   $ipAddr   IP người dùng
     * @param  string   $bankCode Mã ngân hàng (để trống → VNPay tự hiện giao diện chọn)
     * @return string   URL redirect sang VNPay
     */
    public function buildPaymentUrl(Payment $payment, string $ipAddr, string $bankCode = ''): string
    {
        $tz      = config('vnpay.timezone', 'Asia/Ho_Chi_Minh');
        $now     = Carbon::now($tz);
        $expire  = $now->copy()->addMinutes((int) config('vnpay.expire_minutes', 15));

        $params = [
            'vnp_Version'    => config('vnpay.version', '2.1.0'),
            'vnp_Command'    => 'pay',
            'vnp_TmnCode'    => config('vnpay.tmn_code'),
            'vnp_Amount'     => (int) ($payment->amount * 100),         // VNPay yêu cầu *100
            'vnp_CurrCode'   => config('vnpay.curr_code', 'VND'),
            'vnp_TxnRef'     => $payment->id,                           // UUID payment làm TxnRef
            'vnp_OrderInfo'  => $this->buildOrderInfo($payment),
            'vnp_OrderType'  => 'billpayment',
            'vnp_Locale'     => config('vnpay.locale', 'vn'),
            'vnp_ReturnUrl'  => config('vnpay.return_url'),
            'vnp_IpAddr'     => $ipAddr,
            'vnp_CreateDate' => $now->format('YmdHis'),
            'vnp_ExpireDate' => $expire->format('YmdHis'),
        ];

        if ($bankCode) {
            $params['vnp_BankCode'] = $bankCode;
        }

        // Gắn IPN URL nếu có cấu hình
        $ipnUrl = config('vnpay.ipn_url');
        if ($ipnUrl) {
            $params['vnp_IpnUrl'] = $ipnUrl;
        }

        ksort($params);

        $queryString = http_build_query($params);
        $secureHash  = strtoupper(hash_hmac('sha512', $queryString, config('vnpay.hash_secret')));

        return config('vnpay.payment_url') . '?' . $queryString . '&vnp_SecureHash=' . $secureHash;
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  VERIFY SIGNATURE                                     ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xác thực chữ ký HMAC-SHA512 từ VNPay (dùng cho cả Return URL và IPN).
     *
     * @param  array   $params        Query params từ VNPay (đã có vnp_SecureHash)
     * @param  string  $receivedHash  Giá trị vnp_SecureHash nhận được
     * @return bool
     */
    public function verifySignature(array $params, string $receivedHash): bool
    {
        // Loại bỏ trường hash khỏi params trước khi ký lại
        $data = collect($params)
            ->except(['vnp_SecureHash', 'vnp_SecureHashType'])
            ->toArray();

        ksort($data);

        $queryString  = http_build_query($data);
        $expectedHash = strtoupper(hash_hmac('sha512', $queryString, config('vnpay.hash_secret')));

        return hash_equals($expectedHash, strtoupper($receivedHash));
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  PROCESS IPN / RETURN URL                            ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xử lý dữ liệu trả về từ VNPay (IPN hoặc Return URL).
     *
     * Trả về mảng chuẩn hóa với các trường:
     * - txn_ref:        vnp_TxnRef       (payment UUID)
     * - response_code:  vnp_ResponseCode
     * - transaction_no: vnp_TransactionNo (mã GD phía VNPay)
     * - bank_code:      vnp_BankCode
     * - amount:         vnp_Amount / 100 (về lại VNĐ)
     * - order_info:     vnp_OrderInfo
     * - transaction_status: vnp_TransactionStatus
     * - pay_date:       vnp_PayDate
     * - success:        bool (ResponseCode == '00')
     *
     * @param  array  $params  Query params từ VNPay
     * @return array
     */
    public function parseCallbackData(array $params): array
    {
        return [
            'txn_ref'            => $params['vnp_TxnRef']             ?? null,
            'response_code'      => $params['vnp_ResponseCode']       ?? '99',
            'transaction_no'     => $params['vnp_TransactionNo']      ?? null,
            'bank_code'          => $params['vnp_BankCode']           ?? null,
            'amount'             => isset($params['vnp_Amount'])
                                        ? (float) $params['vnp_Amount'] / 100
                                        : 0,
            'order_info'         => $params['vnp_OrderInfo']          ?? null,
            'transaction_status' => $params['vnp_TransactionStatus']  ?? null,
            'pay_date'           => $params['vnp_PayDate']            ?? null,
            'success'            => ($params['vnp_ResponseCode'] ?? '99') === '00',
            'raw'                => $params,
        ];
    }

    /**
     * Trả về message mô tả cho response_code.
     */
    public function getResponseMessage(string $code): string
    {
        return config("vnpay.response_codes.$code", 'Lỗi không xác định');
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  HELPERS                                              ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo chuỗi mô tả đơn hàng cho VNPay.
     * VNPay chỉ chấp nhận ký tự ASCII, không dấu.
     */
    private function buildOrderInfo(Payment $payment): string
    {
        $propertyName = $payment->property?->name ?? 'Hostech';
        $ref          = $payment->reference ?? $payment->id;

        // Chuyển sang ASCII không dấu
        $info = "Thanh toan hoa don {$ref} tai {$propertyName}";

        return Str::ascii($info);
    }
}
