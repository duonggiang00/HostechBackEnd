<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Biên lai thanh toán - {{ $reference }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif; /* Supports Vietnamese characters */
            font-size: 13px;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            text-transform: uppercase;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0;
            color: #666;
        }
        .info-section {
            width: 100%;
            margin-bottom: 20px;
        }
        .info-col {
            width: 48%;
            display: inline-block;
            vertical-align: top;
        }
        .section-title {
            font-weight: bold;
            color: #1e3a8a;
            border-bottom: 1px solid #ddd;
            margin-bottom: 10px;
            padding-bottom: 5px;
            text-transform: uppercase;
            font-size: 11px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f3f4f6;
            color: #1e3a8a;
            text-align: left;
            padding: 8px;
            border-bottom: 2px solid #ddd;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        .amount-col {
            text-align: right;
        }
        .total-section {
            margin-top: 30px;
            text-align: right;
        }
        .total-box {
            display: inline-block;
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            min-width: 200px;
        }
        .total-label {
            font-weight: bold;
            font-size: 14px;
        }
        .total-amount {
            font-size: 20px;
            color: #3b82f6;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            font-size: 11px;
            color: #999;
            text-align: center;
        }
        .signature-section {
            margin-top: 40px;
            width: 100%;
        }
        .signature-col {
            width: 48%;
            display: inline-block;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BIÊN LAI THANH TOÁN</h1>
            <p>Số: {{ $reference }} | Ngày: {{ $generated_at->format('d/m/Y') }}</p>
        </div>

        <div class="info-section">
            <div class="info-col">
                <div class="section-title">Đơn vị thu tiền</div>
                <strong>{{ $payment->property->name ?? 'Dịch vụ Hostech' }}</strong><br>
                <span>Địa chỉ: {{ $payment->property->address ?? 'Hệ thống quản lý thông minh' }}</span><br>
                <span>Mã số: {{ $payment->org_id }}</span>
            </div>
            <div class="info-col" style="margin-left: 20px;">
                <div class="section-title">Thông tin khách hàng</div>
                <strong>{{ $payment->payer->name ?? 'Khách lẻ' }}</strong><br>
                <span>Email: {{ $payment->payer->email ?? 'N/A' }}</span><br>
                <span>Số điện thoại: {{ $payment->payer->phone ?? 'N/A' }}</span>
            </div>
        </div>

        <div class="info-section">
            <div class="info-col">
                <div class="section-title">Chi tiết thanh toán</div>
                <span>Phương thức: <strong>{{ $payment->method }}</strong></span><br>
                <span>Thời gian: {{ $payment->received_at?->format('d/m/Y H:i') }}</span><br>
                <span>Mã tham chiếu: {{ $payment->reference ?? '---' }}</span>
            </div>
            <div class="info-col" style="margin-left: 20px;">
                <div class="section-title">Người lập phiếu</div>
                <span>{{ $payment->receivedBy->name ?? 'Hệ thống tự động' }}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Nội dung thanh toán</th>
                    <th class="amount-col">Số tiền (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payment->allocations as $allocation)
                <tr>
                    <td>
                        Thanh toán cho hóa đơn: <strong>{{ $allocation->invoice->code }}</strong><br>
                        <small>{{ $allocation->invoice->title }}</small>
                    </td>
                    <td class="amount-col">{{ number_format($allocation->amount, 0, '.', ',') }}</td>
                </tr>
                @endforeach
                @if($payment->allocations->isEmpty())
                <tr>
                    <td>Thanh toán nạp tiền/tổng hợp</td>
                    <td class="amount-col">{{ number_format($payment->amount, 0, '.', ',') }}</td>
                </tr>
                @endif
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-box">
                <span class="total-label">TỔNG CỘNG:</span><br>
                <span class="total-amount">{{ number_format($payment->amount, 0, '.', ',') }} VNĐ</span>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-col">
                <strong>Người nộp tiền</strong><br>
                <small>(Ký và ghi rõ họ tên)</small>
            </div>
            <div class="signature-col">
                <strong>Người lập phiếu</strong><br>
                <small>(Ký và ghi rõ họ tên)</small>
            </div>
        </div>

        <div class="footer">
            <p>Biên lai điện tử được sinh từ hệ thống Hostech. Mã băm kiểm tra: {{ hash('crc32', $payment->id) }}</p>
            <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
        </div>
    </div>
</body>
</html>
