# AGENT PROTOCOL: Operational Guidelines

Protocol này bắt buộc áp dụng cho tất cả AI Coding Agents (bao gồm Antigravity, Claude Engineer, v.v.) khi làm việc trên repository này. Mục tiêu là triệt tiêu sự tự phát sinh (hallucination) API và đảm bảo Code Compliance.

## 1. Nguyên tắc "Check-First"
Trước khi triển khai bất kỳ tính năng frontend nào yêu cầu API:
1. **Tìm kiếm**: Sử dụng `grep_search` hoặc `find_by_name` để kiểm tra sự tồn tại của Endpoint trong `routes/api.php` hoặc `routes/v1/*.php`.
2. **Kiểm tra Spec**: Đối chiếu endpoint với `docs/api_spec.json` (nếu có).
3. **Tuyệt đối không tự giả định**: Nếu endpoint chưa tồn tại, Agent **KHÔNG ĐƯỢC** tự viết code frontend gọi tới endpoint đó. Agent phải báo cáo và đề xuất tạo API ở Backend trước.

## 2. Quy trình Scaffold Module
Khi được yêu cầu tạo module mới, Agent phải thực hiện đúng workflow `/scaffold_module`:
1. Phân tích Database Schema (`docs/database.dbml`).
2. Tạo FormRequest với đầy đủ Validation PHPDoc (`@bodyParam`).
3. Tạo API Resource tuân thủ `docs/API_STANDARD.md`.
4. Viết Controller sử dụng Service Layer Pattern.

## 3. Khai thác Tài nguyên
Agent phải ưu tiên sử dụng các công cụ sau để thu thập context thay vì suy diễn:
- `search-docs`: Tìm kiếm tài liệu Laravel/System chuẩn.
- `tinker`: Kiểm tra dữ liệu thực tế thay vì dự đoán quan hệ Model.
- `database-schema`: Kiểm tra cấu trúc bảng chính xác.

## 4. Code Finalization
Mọi thay đổi code backend phải:
1. Chạy `vendor/bin/pint --format agent` để đảm bảo style.
2. Kiểm tra lại Scramble Annotations (`#[Group]`, `@queryParam`) để đảm bảo tài liệu tự động luôn đúng.

---
*Failure to follow this protocol will result in implementation rejection.*
