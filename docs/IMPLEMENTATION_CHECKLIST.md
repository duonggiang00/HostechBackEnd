# Project Implementation Progress Checklist

Bảng theo dõi tiến độ công việc dựa trên cấu trúc Database Schema (`database.dbml`). Đánh dấu `[x]` khi các bước (Models, Migration, Repositories/Services, Controllers, Resources, Requests) đã được hoàn thành đầy đủ cho mỗi bảng.

## 1. Mạch Móng & Danh tính (Core & Identity Module)
*Quản lý tổ chức, người dùng hệ thống và quyền truy cập.*
- [x] **`orgs`** (Tổ chức/Doanh nghiệp)
- [x] **`users`** (Người dùng: Admin, Owner, Staff, Tenant)
- [ ] **`invites`** (Lời mời tham gia hệ thống)

## 2. Quản lý Bất Động Sản (Property & Room Module)
*Quản lý tòa nhà, tầng, phòng và tài sản bên trong phòng.*
- [x] **`properties`** (Bất động sản / Tòa nhà)
- [x] **`floors`** (Tầng)
- [x] **`rooms`** (Phòng)
- [x] **`room_status_histories`** (Lịch sử trạng thái phòng)
- [x] **`room_prices`** (Lịch sử giá phòng)
- [x] **`room_assets`** (Tài sản trong phòng)
- [ ] **`floor_plans`** (Bản đồ mặt bằng tầng)

## 3. Tiện ích & Dịch vụ (Utility & Services Module)
*Quản lý các loại dịch vụ, khung giá và gán dịch vụ cho phòng.*
- [x] **`services`** (Danh mục dịch vụ)
- [x] **`service_rates`** (Biến động giá dịch vụ)
- [x] **`tiered_rates`** (Giá bậc thang điện/nước)
- [x] **`room_services`** (Dịch vụ gán riêng cho phòng)

## 4. Quản lý Đồng hồ (Meters Management)
*Quản lý danh sách đồng hồ và lịch sử ghi chỉ số.*
- [x] **`meters`** (Đồng hồ điện, nước)
- [x] **`meter_readings`** (Phiếu ghi chỉ số đồng hồ)
- [ ] **`adjustment_notes`** (Điều chỉnh chỉ số)

## 5. Vận hành Thuê phòng (Rental Operations)
*Quản lý hợp đồng, phụ lục, phạt và biên bản nhận/trả phòng.*
- [x] **`contracts`** (Hợp đồng thuê)
- [ ] **`contract_members`** (Người dùng trong hợp đồng)
- [ ] **`penalty_rules`** (Quy định phạt - trễ hạn/hủy)
- [ ] **`contract_renewals`** (Gia hạn / Phụ lục hợp đồng)
- [ ] **`handovers`** (Biên bản Check-in / Check-out)
- [ ] **`handover_items`** (Danh sách đồ đạc bàn giao)
- [ ] **`handover_meter_snapshots`** (Chốt đồng hồ khi bàn giao)

## 6. Tài chính & Thanh toán (Finance & Billing Module)
*Quản lý hóa đơn lập ra, phiếu thu tiền và phân bổ chi phí.*
- [x] **`invoices`** (Hóa đơn)
- [x] **`invoice_items`** (Chi tiết các khoản trong hóa đơn)
- [ ] **`invoice_status_histories`** (Lịch sử trạng thái hóa đơn)
- [ ] **`invoice_adjustments`** (Khoản tín dụng/Nợ điều chỉnh của hóa đơn)
- [ ] **`payments`** (Phiếu thu)
- [ ] **`payment_allocations`** (Phân bổ phiếu thu vào loại hóa đơn)
- [ ] **`ledger_entries`** (Sổ cái tổng hợp)

## 7. Bảo trì & Sự cố (Maintenance & Tickets Module)
*Hỗ trợ khách thuê gửi yêu cầu và bảo trì phòng ốc.*
- [ ] **`tickets`** (Phiếu yêu cầu/Sự cố)
- [ ] **`ticket_events`** (Lịch sử thảo luận sự cố)
- [ ] **`ticket_costs`** (Chi phí sửa chữa ghi nhận)
- [ ] **`ticket_invoice_links`** (Liên kết chi phí sang hóa đơn)
- [ ] **`ticket_ratings`** (Đánh giá giải quyết sự cố)

## 8. Sổ Quỹ (Cashflow Management)
*Ghi chép luồng Thu/Chi chung của hệ thống ngoài tiền phòng.*
- [ ] **`cashflow_categories`** (Danh mục thu/chi)
- [ ] **`cashflow_entries`** (Giao dịch thu/chi)

## 9. Truyền thông & Tài liệu (Media & Docs)
*Quản lý Files, Thông báo tự động và Xuất văn bản PDF.*
- [x] **`media`** (Hệ thống file đa hình của Spatie)
- [ ] **`notification_preferences`** (Cài đặt kênh nhận thông báo)
- [ ] **`notification_templates`** (Bản mẫu gửi Email/SMS)
- [ ] **`notification_rules`** (Rule tự động gửi thông báo)
- [ ] **`notification_logs`** (Lịch sử gửi thông báo)
- [ ] **`document_templates`** (Mẫu HĐ Word/HTML)
- [ ] **`generated_documents`** (File văn bản đã xuất)

---
*Ghi chú cho AI & Team:* 
1. Tick `[x]` vào từng mục nếu bạn đã triển khai đầy đủ các cấu phần (Model > FormRequest > Service > Controller > Resource).
2. Khi code bảng nào, luôn đọc `docs/database.dbml` trước tiên.
3. Chạy workflow `/scaffold_module` cho các cụm bảng mới.
