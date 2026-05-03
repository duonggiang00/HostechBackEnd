<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Biên lai hoàn cọc - {{ $reference }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 13px;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .container { width: 100%; padding: 20px; }
        .pdf-banner {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 15px;
        }
        .pdf-banner .header {
            text-align: center;
            margin: 0;
            border-bottom: none;
            padding-bottom: 0;
        }
        .header h1 {
            color: #7c3aed;
            margin: 0;
            text-transform: uppercase;
            font-size: 24px;
        }
        .header p { margin: 5px 0 0; color: #666; }
        .info-section { width: 100%; margin-bottom: 20px; }
        .info-col { width: 48%; display: inline-block; vertical-align: top; }
        .section-title {
            font-weight: bold;
            color: #5b21b6;
            border-bottom: 1px solid #ddd;
            margin-bottom: 10px;
            padding-bottom: 5px;
            text-transform: uppercase;
            font-size: 11px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th {
            background-color: #f3f4f6;
            color: #5b21b6;
            text-align: left;
            padding: 8px;
            border-bottom: 2px solid #ddd;
        }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .amount-col { text-align: right; }
        .total-section { margin-top: 30px; text-align: right; }
        .total-box {
            display: inline-block;
            background-color: #f3e8ff;
            padding: 15px;
            border-radius: 5px;
            min-width: 220px;
        }
        .total-label { font-weight: bold; font-size: 14px; }
        .total-amount { font-size: 22px; color: #7c3aed; font-weight: bold; }
        .footer {
            margin-top: 50px;
            font-size: 11px;
            color: #999;
            text-align: center;
        }
        .badge {
            display: inline-block;
            background: #ede9fe;
            color: #6d28d9;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="pdf-banner">
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="width:88px; vertical-align:top; padding-right:10px;">@include('pdf.partials.hostech-logo')</td>
                    <td style="vertical-align:middle;">
                        <div class="header">
                            <h1>Biên lai hoàn cọc</h1>
                            <p>
                                Số: <strong>{{ $reference }}</strong>
                                | Ngày chi:
                                {{ $paid_at?->format('d/m/Y H:i') ?? $generated_at->format('d/m/Y H:i') }}
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="info-section">
            <div class="info-col">
                <div class="section-title">Đơn vị chi tiền</div>
                <strong>{{ $contract->property->name ?? 'Hostech' }}</strong><br>
                <span>Địa chỉ: {{ $contract->property->address ?? '—' }}</span>
            </div>
            <div class="info-col" style="margin-left: 20px;">
                <div class="section-title">Thông tin khách</div>
                <strong>{{ $tenant_name ?? 'Khách thuê' }}</strong><br>
                <span>Email: {{ $tenant_email ?? '—' }}</span><br>
                <span>SĐT: {{ $tenant_phone ?? '—' }}</span>
            </div>
        </div>

        <div class="info-section">
            <div class="info-col">
                <div class="section-title">Hợp đồng &amp; phòng</div>
                <span>Hợp đồng: <strong>{{ Str::upper(substr($contract->id, 0, 8)) }}</strong></span><br>
                <span>Phòng: <strong>{{ $contract->room->name ?? $contract->room->code ?? '—' }}</strong></span><br>
                <span>Trạng thái cọc: <span class="badge">{{ $deposit_status_label }}</span></span>
            </div>
            <div class="info-col" style="margin-left: 20px;">
                <div class="section-title">Phương thức chi</div>
                <span>Hình thức:
                    <strong>
                        @if($refund->payout_method === 'CASH') Tiền mặt
                        @elseif($refund->payout_method === 'TRANSFER') Chuyển khoản
                        @else {{ $refund->payout_method ?? '—' }}
                        @endif
                    </strong>
                </span><br>
                <span>Tham chiếu: {{ $refund->payout_reference ?? '—' }}</span><br>
                <span>Người chi: {{ $refund->paidBy->full_name ?? $refund->paidBy->name ?? 'Hệ thống' }}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Nội dung</th>
                    <th class="amount-col">Số tiền (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Tiền cọc đã giữ ban đầu</td>
                    <td class="amount-col">{{ number_format((float) $contract->deposit_amount, 0, '.', ',') }}</td>
                </tr>
                @if($offset_amount > 0)
                    <tr>
                        <td>Đã cấn trừ vào hóa đơn (thanh lý)</td>
                        <td class="amount-col">−{{ number_format($offset_amount, 0, '.', ',') }}</td>
                    </tr>
                @endif
                @if(($deposit_refund_portion ?? null) !== null && $deposit_refund_portion > 0)
                    <tr>
                        <td>Trong đó: hoàn từ tiền cọc (sau cấn trừ)</td>
                        <td class="amount-col">{{ number_format((float) $deposit_refund_portion, 0, '.', ',') }}</td>
                    </tr>
                @endif
                @if(($goodwill_refund_portion ?? null) !== null && $goodwill_refund_portion > 0)
                    <tr>
                        <td>Hoàn thêm (thỏa thuận / tiền thuê)</td>
                        <td class="amount-col">{{ number_format((float) $goodwill_refund_portion, 0, '.', ',') }}</td>
                    </tr>
                @endif
                <tr style="background:#faf5ff;">
                    <td><strong>Số tiền hoàn lại cho khách</strong></td>
                    <td class="amount-col"><strong>{{ number_format((float) $refund->amount, 0, '.', ',') }}</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-box">
                <span class="total-label">TỔNG HOÀN:</span><br>
                <span class="total-amount">{{ number_format((float) $refund->amount, 0, '.', ',') }} VNĐ</span>
            </div>
        </div>

        @if(! empty($refund->meta['note'] ?? null))
            <p style="margin-top: 24px; font-style: italic; color: #555;">
                Ghi chú: {{ $refund->meta['note'] }}
            </p>
        @endif

        <div class="footer">
            <p>Biên lai điện tử sinh từ hệ thống Hostech.</p>
            <p>Phiếu đã được lưu trữ và đối chiếu với hợp đồng tương ứng.</p>
        </div>
    </div>
</body>
</html>
