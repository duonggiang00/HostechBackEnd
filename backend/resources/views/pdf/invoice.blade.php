<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hóa đơn - {{ $invoice->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
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
            border-bottom: 2px solid #10b981;
            padding-bottom: 15px;
        }
        .header h1 {
            color: #10b981;
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
            color: #064e3b;
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
            background-color: #f0fdf4;
            color: #064e3b;
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
            background-color: #f0fdf4;
            padding: 15px;
            border-radius: 5px;
            min-width: 250px;
        }
        .total-row {
            margin-bottom: 5px;
        }
        .total-label {
            font-weight: bold;
            font-size: 14px;
        }
        .total-amount {
            font-size: 20px;
            color: #10b981;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            font-size: 11px;
            color: #999;
            text-align: center;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HÓA ĐƠN DỊCH VỤ</h1>
            <p>Mã HĐ: {{ $invoice->id }} | Ngày phát hành: {{ $invoice->issue_date?->format('d/m/Y') ?? 'Dự thảo' }}</p>
        </div>

        <div class="info-section">
            <div class="info-col">
                <div class="section-title">Đơn vị cung cấp</div>
                <strong>{{ $invoice->property->name ?? $invoice->org->name }}</strong><br>
                <span>Địa chỉ: {{ $invoice->property->address ?? 'N/A' }}</span><br>
                <span>Mã tổ chức: {{ $invoice->org_id }}</span>
            </div>
            <div class="info-col" style="margin-left: 20px;">
                <div class="section-title">Thông tin khách thuê</div>
                <strong>Phòng: {{ $invoice->room->name ?? $invoice->room->code ?? 'N/A' }}</strong><br>
                @php
                    $tenant = $invoice->contract->members->where('status', 'APPROVED')->first()?->user;
                @endphp
                <span>Họ tên: {{ $tenant->name ?? 'N/A' }}</span><br>
                <span>SĐT: {{ $tenant->phone ?? 'N/A' }}</span>
            </div>
        </div>

        <div class="info-section">
            <div class="info-col">
                <div class="section-title">Chi tiết kỳ hóa đơn</div>
                <span>Kỳ hạn: <strong>{{ $invoice->period_start?->format('d/m/Y') }}</strong> - <strong>{{ $invoice->period_end?->format('d/m/Y') }}</strong></span><br>
                <span>Hạn thanh toán: <strong style="color: #dc2626;">{{ $invoice->due_date?->format('d/m/Y') }}</strong></span>
            </div>
            <div class="info-col" style="margin-left: 20px;">
                <div class="section-title">Trạng thái</div>
                <span class="status-badge">{{ $invoice->status }}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Dịch vụ / Nội dung</th>
                    <th class="amount-col">Số lượng</th>
                    <th class="amount-col">Đơn giá</th>
                    <th class="amount-col">Thành tiền (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                <tr>
                    <td>
                        <strong>{{ $item->name }}</strong><br>
                        <small>{{ $item->description }}</small>
                    </td>
                    <td class="amount-col">{{ number_format($item->quantity, 0) }}</td>
                    <td class="amount-col">{{ number_format($item->unit_price, 0, '.', ',') }}</td>
                    <td class="amount-col">{{ number_format($item->amount, 0, '.', ',') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-box">
                <div class="total-row">
                    <span class="total-label">TỔNG CỘNG:</span>
                    <span class="total-amount">{{ number_format($invoice->total_amount, 0, '.', ',') }} VNĐ</span>
                </div>
                @if($invoice->paid_amount > 0)
                <div class="total-row">
                    <span>Đã thanh toán:</span>
                    <span>{{ number_format($invoice->paid_amount, 0, '.', ',') }} VNĐ</span>
                </div>
                <div class="total-row" style="border-top: 1px solid #ccc; padding-top: 5px;">
                    <strong>Còn lại:</strong>
                    <strong>{{ number_format($invoice->total_amount - $invoice->paid_amount, 0, '.', ',') }} VNĐ</strong>
                </div>
                @endif
            </div>
        </div>

        <div class="footer">
            <p>Hóa đơn điện tử được sinh tự động từ hệ thống Hostech.</p>
            <p>Vui lòng thanh toán trước ngày <strong>{{ $invoice->due_date?->format('d/m/Y') }}</strong> để tránh bị gián đoạn dịch vụ.</p>
        </div>
    </div>
</body>
</html>
