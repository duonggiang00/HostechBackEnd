# Kế hoạch & Kiến trúc Hệ thống Invite (Đăng ký theo lời mời)

Hệ thống Đăng ký mới sẽ hoàn toàn xoay quanh cơ chế **Lời mời (Invitation-based Registration)**, giúp thắt chặt bảo mật, đảm bảo đúng người đúng việc (đúng Role, đúng Org, đúng Property).

---

## 1. Phân quyền và Logic Tạo Lời mời (Create Invite)

Hệ thống cần bảng `user_invitations` để lưu token, email người nhận, role được cấp, và scope (`org_id`, `property_ids`).

### A. Quyền của Admin (System Admin)
- Có thể mời **mọi Role**:
  - **Mời Owner**: Sinh ra một lời mời đặc biệt (`org_id` = null). Khi người này bấm vào link đăng ký, form sẽ yêu cầu họ **tạo mới một Organization** của riêng mình.
  - **Mời Manager / Staff / Tenant**: Bắt buộc Admin phải chọn sẵn `org_id` (và `property_ids` nếu là Manager/Staff) lúc tạo mời.

### B. Quyền của Owner (Chủ tổ chức)
- Chỉ có thể mời **Manager, Staff, Tenant** vào chính tổ chức của họ.
- Hệ thống tự động gắn `org_id` của Owner vào lời mời.
- Với Manager/Staff, Owner có thể chỉ định cụ thể các `property_ids` (Tòa nhà) mà nhân sự này được phép quản lý.

### C. Quyền của Manager (Quản lý tòa nhà)
- Chỉ có thể mời **Staff, Tenant**.
- Scope của lời mời bị giới hạn cứng trong các `property_ids` mà Manager đang quản lý. (Ví dụ Manager quản lý tòa A thì chỉ mời được Staff cho tòa A).

---

## 2. Phân tích bài toán Đăng ký Tenant (Người thuê)

**Vấn đề:** Khi mời một Tenant mới, có nên gắn họ thẳng vào Hợp đồng (Contract) hoặc Phòng (Room) ngay lúc đó không, hay đợi họ đồng ý ký Hợp đồng?

👉 **Giải pháp Tối ưu (Best Practice): Tách biệt Account và Contract.**

**Luồng nghiệp vụ chuẩn nên là:**
1. **Bước Tạo Account (Invite):** Quản lý (Owner/Manager) gửi Invite cho Tenant. Token invite này chỉ mang ý nghĩa: *"Bạn được mời tạo tài khoản thuộc hệ thống của Tổ chức X, với Role là Tenant"*.
2. **Bước Trạng thái Chờ (Pending Contract):** Song song với đó, Quản lý tiến hành soạn sẵn một Hợp đồng dạng nháp (`DRAFT`). Chỗ thêm thành viên vào hợp đồng, Quản lý nhập Email của người thuê (chính là Email vừa invite).
3. **Bước Tenant Đăng ký:** Tenant vào email, click link, tạo mật khẩu. Hệ thống tạo User và gán Role `Tenant`, `org_id` = Tổ chức X. (Lúc này Tenant chưa dính dáng gì tới cái phòng nào về mặt vận hành).
4. **Bước Chốt Hợp đồng (Gắn quyền vào Phòng):**
   - Tenant đăng nhập vào App, vào mục "Hợp đồng của tôi".
   - Hệ thống quét các Contract đang có chứa Email của Tenant này, hiện lên cho Tenant xem.
   - Tenant đọc và bấm "Đồng ý ký" (Trạng thái contract hoặc thành viên đổi sang `ACTIVE`).
   - LÚC NÀY: Mối liên kết giữa Tenant - Contract - Room mới chính thức có hiệu lực. Tenant mới bắt đầu nhận được thông báo về Tòa nhà đó, xem được Tiền điện nước, tạo Ticket sự cố cho phòng đó.

**Tại sao không gắn luôn từ đầu?**
- Vì Hợp đồng cần sự chấp thuận 2 chiều. Chừng nào Tenant chưa đồng ý ký (hoặc chưa đóng cọc - tùy nghiệp vụ), thì họ chưa phải là người ở hợp pháp của phòng, nên không được phép xem các tài nguyên bảo mật (Code mở cửa, tài sản phòng...).
- Đôi khi Manager chỉ đơn giản là muốn Tenant có tài khoản trước để xem các Tòa nhà đang trống, sau đó mới lên hợp đồng sau.

---

## 3. Kiến trúc Database (`user_invitations`)

```sql
CREATE TABLE `user_invitations` (
  `id` uuid PRIMARY KEY,
  `email` varchar(255) UNIQUE NOT NULL,
  `token` string UNIQUE NOT NULL,      -- Sinh crypto random
  `role_name` varchar(50) NOT NULL,    -- Owner, Manager, Staff, Tenant
  `org_id` uuid NULL,                  -- Null nếu mời Owner
  `properties_scope` json NULL,        -- Lưu mảng property_ids [uuid, uuid]
  `invited_by` uuid NOT NULL,          -- User ID của người tạo mã
  `expires_at` timestamp NOT NULL,
  `registered_at` timestamp NULL,      -- Đánh dấu đã dùng
  `created_at`, `updated_at`
);
```

---

## 4. Các Endpoints (Draft)

1. `POST /api/invitations`
   - Chỉ dành cho Admin, Owner, Manager tạo lời mời.
   - Input: `email`, `role`, `org_id` (với Admin), `property_ids`.
   - Output: Gửi email chứa Magic Link.

2. `GET /api/invitations/validate/{token}`
   - Trả về thông tin cơ bản: Role được mời, cho phép tạo Org không, tên tổ chức mời vào.

3. `POST /api/auth/register-via-invite`
   - Nhận vào `token`, `name`, `password`.
   - Nếu token dành cho Owner: Yêu cầu thêm data tạo `Org` (`org_name`, `org_phone`...).
   - Action: Tạo User -> Phân Role -> Gán Org (nếu có) -> Gán Properties (Bảng pivot `user_properties` - cần tạo bảng này cho Manager/Staff).
   - Đánh dấu token đã dùng (`registered_at`).
