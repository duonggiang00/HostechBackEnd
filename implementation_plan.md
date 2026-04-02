# Kế hoạch Tổng thể: Hệ thống Quản lý và Vận hành Hợp đồng Hostech

Bản kế hoạch này hợp nhất tất cả các nội dung đã được thảo luận và duyệt, bao gồm cả nội dung văn bản mẫu và sơ đồ quy trình nghiệp vụ.

---

## 1. Kế hoạch Nghiệp vụ Tổng thể (Operational Plan)

### 1.1. Giai đoạn: Cấu hình Property (Configuration)
- **Tạo Property**: Khởi tạo thông tin tòa nhà.
- **Tạo Dịch vụ**: Định nghĩa Service (Cố định hoặc Theo chỉ số).
- **Nối Dịch vụ tới Đồng hồ**: Map Service với Meter.
- **Room Template**: Thiết lập mẫu phòng chứa sẵn dịch vụ/đồng hồ.
- **Contract Template**: Cấu hình mẫu hợp đồng định dạng Markdown/PDF.

### 1.2. Giai đoạn: Vận hành Property (Operation)
- **Tạo Tầng/Phòng**: Triển khai thực tế từ Room Template.
- **Phân quyền Nhân sự**: Gán Manager/Staff theo Property Scope.
- **Quản lý Tenant & HĐ**: Tạo khách thuê, mời khách xác nhận hợp đồng.
- **Chu kỳ Tài chính**:
    - Chốt số điện nước định kỳ.
    - Tự động/Thủ công tạo Hóa đơn (Invoice).
    - Thanh toán & Đối soát nợ.
- **Sự kiện Vòng đời**: Bàn giao (Handover), Chấm dứt, Làm mới, Chuyển phòng.

---

## 2. Hệ thống Sơ đồ Workflow Trực quan (Diagrams)

### 2.1. Quy trình Cấu hình (Configuration Setup)
```mermaid
graph TD
    A[Bắt đầu: Tạo Property] --> B[Định nghĩa Dịch vụ - Services]
    B --> C{Cấu hình giá?}
    C --> D[Giá cố định - Fixed Rate]
    C --> E[Giá theo chỉ số - Tiered/Single Rate]
    D --> F{Có dùng đồng hồ?}
    E --> F
    F -- Có --> G[Nối Dịch vụ tới Đồng hồ - Meter Config]
    F -- Không --> H[Tạo Room Template]
    G --> H
    H --> I[Gắn sẵn Dịch vụ & Đồng hồ vào Mẫu]
    I --> J[Kết thúc: Sẵn sàng tạo phòng]
```

### 2.2. Quy trình Mời Người dùng (Invitation Flow)
```mermaid
graph TD
    A[Tiếp nhận khách hàng] --> B[Admin: Chọn Phòng & Khởi tạo Hợp đồng]
    B --> C{Khách đã có Acc?}
    C -- Có --> D[Admin: Gắn User ID vào HĐ]
    C -- Chưa --> E[Admin: Nhập Email/SĐT khách]
    E --> F[Hệ thống: Sinh Link Invitation & Gửi cho khách]
    F --> G[Khách: Click Link -> Đăng ký tài khoản]
    G --> H[Khách: Xác thực tài khoản & Đăng nhập]
    D --> I[Hệ thống: Gửi bản mềm hợp đồng duyệt]
    H --> I
    I --> J{Khách xác nhận HĐ?}
    J -- Không --> K[Admin: Điều chỉnh HĐ]
    K --> I
    J -- Có --> L[Admin: Thực hiện Check-in & Kích hoạt ACTIVE]
```

### 2.3. Quy trình Chuyển phòng (Room Transfer Flow)
```mermaid
graph TD
    subgraph "Giai đoạn 1: Tất toán phòng cũ"
        A[Bắt đầu yêu cầu Chuyển phòng] --> B[Chốt chỉ số Điện/Nước phòng cũ]
        B --> C[Kiểm tra tài sản & Tạo biên bản Check-out]
        C --> D[Hệ thống: Tính toán hóa đơn cuối phòng cũ]
        D --> E[Khách: Hoàn tất thanh toán dư nợ]
    end
    subgraph "Giai đoạn 2: Chuyển đổi Hợp đồng"
        E --> F[Hệ thống: Kết thúc HĐ cũ - TRANSFERRED]
        F --> G[Giải phóng phòng cũ -> AVAILABLE]
        G --> H[Khởi tạo Hợp đồng phòng mới - DRAFT]
        H --> I[Kết chuyển tiền cọc sang HĐ mới]
    end
    subgraph "Giai đoạn 3: Kích hoạt phòng mới"
        I --> J[Thực hiện Check-in phòng mới]
        J --> K[Chốt chỉ số đầu kỳ phòng mới]
        K --> L[Kích hoạt Hợp đồng mới - ACTIVE]
    end
```

---

## 3. Vòng đời Trạng thái Hợp đồng (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Khởi tạo
    DRAFT --> PENDING_INVITE: Chờ khách xác nhận
    PENDING_INVITE --> ACTIVE: ACTIVE

    state "Quy trình Chuyển phòng" as TransferLogic {
        ACTIVE --> SETTLEMENT: Chốt công nợ & tài sản (Cũ)
        SETTLEMENT --> DRAFT_NEW: Tạo HĐ & Kết chuyển cọc (Mới)
        DRAFT_NEW --> ACTIVE_NEW: Check-in mới
    }

    ACTIVE --> TERMINATED: Kết thúc hợp đồng (Check-out)
    TERMINATED --> [*]
```

---

## 4. Bảng giải thích Nghiệp vụ Chi tiết

| Mục | Nội dung Logic | Ghi chú |
| :--- | :--- | :--- |
| **Invitation** | Link mời có token, dẫn khách tới Register. Khách phải bấm "Xác nhận" HĐ sau khi login. | Đảm bảo tính pháp lý. |
| **Transfer** | Hợp đồng cũ (TRANSFERRED) -> Hợp đồng mới (DRAFT/ACTIVE). | Bảo toàn lịch sử check-in/out riêng cho từng phòng. |
| **Mapping** | `{{tags}}` trong Markdown được ánh xạ tự động từ `ContractService`. | Dữ liệu chính xác 100% từ DB. |
| **Cấu hình Meter** | Cho phép gán đồng hồ cho cả Fixed Rate. | Tăng tính linh hoạt nếu muốn theo dõi chỉ số. |

---

> [!NOTE]
> Tôi đã hợp nhất toàn bộ các đề xuất từ trước đến nay vào bản kế hoạch này. Không có nội dung nào bị xóa bỏ, chỉ được sắp xếp lại để khoa học và dễ theo dõi hơn.
