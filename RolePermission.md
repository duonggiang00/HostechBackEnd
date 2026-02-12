Admin → Toàn hệ thống (bypass mọi kiểm soát)

Owner → Toàn quyền trong phạm vi Org

Manager → Toàn quyền trong phạm vi Property

Staff → Một số quyền hạn chế trong Property

Tenant → Chỉ xem Room

1️⃣ Phân cấp Scope
System
 └── Organization (Org)
      └── Property
           └── Floor
                └── Room

2️⃣ Định nghĩa quyền (Action)
Ký hiệu	Ý nghĩa
C	Create
R	Read
U	Update
D	Delete
*	Full quyền (CRUD + phân quyền nếu có)
-	Không có quyền
3️⃣ Ma trận RBAC
🔹 Module: Quản lý Người dùng (Users)
Role	Quyền
Admin	* (toàn hệ thống)
Owner	C,R,U,D trong Org
Manager	R trong Property
Staff	-
Tenant	-
🔹 Module: Quản lý Orgs
Role	Quyền
Admin	*
Owner	R,U (Org của mình)
Manager	-
Staff	-
Tenant	-
🔹 Module: Quản lý Properties
Role	Quyền
Admin	*
Owner	C,R,U,D (trong Org)
Manager	R,U (Property được gán)
Staff	R (Property được gán)
Tenant	-
🔹 Module: Quản lý Floor
Role	Quyền
Admin	*
Owner	* (trong Org)
Manager	C,R,U,D (Property được gán)
Staff	R
Tenant	-
🔹 Module: Quản lý Room
Role	Quyền
Admin	*
Owner	* (trong Org)
Manager	* (Property được gán)
Staff	R,U (ví dụ cập nhật trạng thái phòng)
Tenant	R (Room của mình)
4️⃣ Tóm tắt theo Role
🔵 Admin

Bypass mọi kiểm tra scope

Toàn quyền mọi module

🟢 Owner (Org-level)

Toàn quyền trong phạm vi Org

Quản lý Users, Properties, Floor, Room trong Org đó

🟡 Manager (Property-level)

Toàn quyền Floor & Room

Chỉnh sửa Property

Không được tạo Property mới

Không quản lý Users (chỉ xem)

🟠 Staff (Property-level)

Xem Property

Xem Floor

Xem Room

Cập nhật Room (giới hạn)

Không được tạo/xóa

🔴 Tenant

Chỉ xem Room của mình

Không thấy module khác

5️⃣ Biểu diễn dạng bảng tổng hợp (CRUD Matrix)
| Module ↓ / Role → | Admin | Owner      | Manager | Staff | Tenant  |
| ----------------- | ----- | ---------- | ------- | ----- | ------- |
| Users             | *     | CRUD (Org) | R       | -     | -       |
| Orgs              | *     | RU         | -       | -     | -       |
| Properties        | *     | CRUD       | RU      | R     | -       |
| Floor             | *     | CRUD       | CRUD    | R     | -       |
| Room              | *     | CRUD       | CRUD    | RU    | R (own) |
