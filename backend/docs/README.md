# Hostech Backend Documentation

Chào mừng bạn đến với tài liệu kỹ thuật của hệ thống Hostech. Tài liệu này được chia thành hai phần chính:

## 🏗️ Kiến trúc Hệ thống (Architecture)
Các tài liệu về bản chất vận hành, luồng dữ liệu và bảo mật của toàn hệ thống.

- [**System Flows**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/architecture/system_flows.md): Luồng đi của Request, Multi-tenancy và Event-Driven Architecture.
- [**RBAC Matrix**](architecture/rbac_matrix.md): Ma trận phân quyền chi tiết cho tất cả các Role.
- [**API Auth contract baseline**](architecture/api_auth_contract_baseline.md): Chuẩn JSON login / 2FA / profile và quy tắc đặt tên permission (`rbac:sync`).
- [**Onboarding Flow**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/architecture/onboarding_flow.md): Chi tiết quy trình mời Nhân viên và Cư dân.
- [**Backup & restore**](architecture/backup_restore.md), [**Secrets rotation**](architecture/secrets_rotation.md), [**Queues**](architecture/queue_operations.md), [**Observability**](architecture/observability.md): vận hành production (Phase 7–8).
- [**Data retention / PII**](architecture/data_inventory_retention.md), [**Export / anonymize**](architecture/export_anonymize_scope.md), [**Audit coverage**](architecture/audit_log_coverage.md), [**ADRs**](architecture/adr/README.md), [**Ownership**](architecture/ownership_matrix.md): tuân thủ & quản trị (Phase 9).
- [**Báo cáo quét SaaS multi-tenant (tính năng, luồng, FE/BE, RBAC)**](architecture/SAAS_MULTI_TENANT_AUDIT.md): tổng hợp một lần đọc toàn repo.
- [**Sơ đồ use case (Mermaid)**](architecture/USECASE_DIAGRAMS.md): luồng chức năng theo tác nhân / phân hệ.

## 📦 Tài liệu Module (Modules)
Chi tiết API, Business Logic và hướng dẫn Frontend cho từng phân hệ nghiệp vụ.

- [**Contract**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/04_contract.md)
- [**Meter**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/06_meter.md)
- [**Invoice**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/07_invoice.md)
- [**System**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/08_system.md)
- [**Ticket**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/09_ticket.md)
- [**Handover**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/10_handover.md)
- [**Billing**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/11_billing.md)
- [**Payment**](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/docs/modules/12_pay.md)

---
*Tài liệu này được cập nhật tự động sau đợt Architecture Audit tháng 04/2026.*
