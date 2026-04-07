# Hostech Database Schema Map

Generated at: 2026-04-06 04:56:12

This document is the source-of-truth schema extracted directly from local MySQL.

## Table: `activity_log` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| log_name | varchar(255) | YES | MUL | NULL |  |
| description | text | NO |  | NULL |  |
| subject_type | varchar(255) | YES | MUL | NULL |  |
| subject_id | char(36) | YES |  | NULL |  |
| causer_type | varchar(255) | YES | MUL | NULL |  |
| causer_id | char(36) | YES |  | NULL |  |
| event | varchar(255) | YES |  | NULL |  |
| batch_uuid | char(36) | YES |  | NULL |  |
| org_id | char(36) | YES | MUL | NULL |  |
| properties | json | YES |  | NULL |  |
| created_at | timestamp | YES | MUL | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `adjustment_notes` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| meter_reading_id | char(36) | NO | MUL | NULL |  |
| reason | text | NO |  | NULL |  |
| before_value | bigint | NO |  | NULL |  |
| after_value | bigint | NO |  | NULL |  |
| status | enum('PENDING','APPROVED','REJECTED') | NO |  | PENDING |  |
| requested_by_user_id | char(36) | NO | MUL | NULL |  |
| approved_by_user_id | char(36) | YES | MUL | NULL |  |
| approved_at | timestamp | YES |  | NULL |  |
| rejected_by_user_id | char(36) | YES | MUL | NULL |  |
| rejected_at | timestamp | YES |  | NULL |  |
| reject_reason | text | YES |  | NULL |  |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `cache` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| key | varchar(255) | NO | PRI | NULL |  |
| value | mediumtext | NO |  | NULL |  |
| expiration | int | NO | MUL | NULL |  |

## Table: `cache_locks` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| key | varchar(255) | NO | PRI | NULL |  |
| owner | varchar(255) | NO |  | NULL |  |
| expiration | int | NO | MUL | NULL |  |

## Table: `contract_members` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| contract_id | char(36) | NO | MUL | NULL |  |
| user_id | char(36) | YES | MUL | NULL |  |
| full_name | varchar(255) | NO |  | NULL |  |
| phone | varchar(20) | YES |  | NULL |  |
| identity_number | varchar(50) | YES |  | NULL |  |
| role | varchar(10) | NO |  | TENANT |  |
| status | varchar(20) | NO |  | APPROVED |  |
| is_primary | tinyint(1) | NO |  | 0 |  |
| joined_at | timestamp | YES |  | NULL |  |
| signed_at | timestamp | YES |  | NULL |  |
| left_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `contracts` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| base_rent | decimal(15,2) | NO |  | 0.00 |  |
| fixed_services_fee | decimal(15,2) | NO |  | 0.00 |  |
| total_rent | decimal(15,2) | NO |  | 0.00 |  |
| cycle_months | int | NO |  | 6 |  |
| status | varchar(30) | NO | MUL | DRAFT |  |
| start_date | date | NO |  | NULL |  |
| next_billing_date | date | YES |  | NULL |  |
| end_date | date | YES | MUL | NULL |  |
| billing_cycle | varchar(10) | NO |  | MONTHLY |  |
| rent_token_balance | int | NO |  | 0 |  |
| due_day | int | NO |  | 5 |  |
| cutoff_day | int | NO |  | 30 |  |
| rent_price | decimal(15,2) | NO |  | NULL |  |
| deposit_amount | decimal(15,2) | NO |  | 0.00 |  |
| deposit_status | enum('UNPAID','HELD','REFUND_PENDING','REFUNDED','PARTIAL_REFUND','FORFEITED') | YES |  | UNPAID |  |
| refunded_amount | decimal(15,2) | NO |  | 0.00 |  |
| forfeited_amount | decimal(15,2) | NO |  | 0.00 |  |
| join_code | varchar(64) | YES |  | NULL |  |
| join_code_expires_at | timestamp | YES |  | NULL |  |
| join_code_revoked_at | timestamp | YES |  | NULL |  |
| signed_at | timestamp | YES |  | NULL |  |
| terminated_at | timestamp | YES |  | NULL |  |
| created_by_user_id | char(36) | YES | MUL | NULL |  |
| meta | json | YES |  | NULL |  |
| document_path | varchar(255) | YES |  | NULL |  |
| document_type | varchar(10) | YES |  | NULL |  |
| scan_original_filename | varchar(255) | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `failed_jobs` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| uuid | varchar(255) | NO | UNI | NULL |  |
| connection | text | NO |  | NULL |  |
| queue | text | NO |  | NULL |  |
| payload | longtext | NO |  | NULL |  |
| exception | longtext | NO |  | NULL |  |
| failed_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## Table: `floors` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| code | varchar(50) | YES |  | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| floor_number | int | NO | MUL | 1 |  |
| sort_order | int | NO |  | 0 |  |
| area | decimal(8,2) | YES |  | NULL |  |
| shared_area | decimal(8,2) | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `handover_items` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| handover_id | char(36) | NO | MUL | NULL |  |
| room_asset_id | char(36) | YES | MUL | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| status | varchar(10) | NO |  | OK |  |
| note | text | YES |  | NULL |  |
| sort_order | int | NO |  | 0 |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `handover_meter_snapshots` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| handover_id | char(36) | NO | MUL | NULL |  |
| meter_id | char(36) | NO | MUL | NULL |  |
| reading_value | bigint | NO |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `handovers` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| contract_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| type | varchar(10) | NO |  | NULL |  |
| status | varchar(10) | NO |  | DRAFT |  |
| note | text | YES |  | NULL |  |
| confirmed_by_user_id | char(36) | YES | MUL | NULL |  |
| confirmed_at | timestamp | YES |  | NULL |  |
| locked_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `invoice_adjustments` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| invoice_id | char(36) | NO | MUL | NULL |  |
| type | varchar(10) | NO | MUL | NULL |  |
| amount | decimal(15,2) | NO |  | NULL |  |
| reason | text | NO |  | NULL |  |
| created_by_user_id | char(36) | NO | MUL | NULL |  |
| approved_by_user_id | char(36) | YES | MUL | NULL |  |
| approved_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `invoice_items` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| invoice_id | char(36) | NO | MUL | NULL |  |
| type | enum('RENT','SERVICE','DEPOSIT','PENALTY','DISCOUNT','ADJUSTMENT') | NO | MUL | NULL |  |
| service_id | char(36) | YES | MUL | NULL |  |
| description | varchar(255) | NO |  | NULL |  |
| quantity | decimal(12,2) | NO |  | 1.00 |  |
| unit_price | decimal(15,2) | NO |  | NULL |  |
| amount | decimal(15,2) | NO |  | NULL |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `invoice_status_histories` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| invoice_id | char(36) | NO | MUL | NULL |  |
| from_status | varchar(20) | YES |  | NULL |  |
| to_status | varchar(20) | NO |  | NULL |  |
| note | text | YES |  | NULL |  |
| changed_by_user_id | char(36) | YES | MUL | NULL |  |
| created_at | timestamp | NO | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `invoices` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| contract_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| period_start | date | NO |  | NULL |  |
| period_end | date | NO |  | NULL |  |
| status | varchar(10) | NO | MUL | DRAFT |  |
| issue_date | date | YES |  | NULL |  |
| due_date | date | NO | MUL | NULL |  |
| total_amount | decimal(15,2) | NO |  | 0.00 |  |
| paid_amount | decimal(15,2) | NO |  | 0.00 |  |
| snapshot | json | YES |  | NULL |  |
| created_by_user_id | char(36) | YES | MUL | NULL |  |
| issued_by_user_id | char(36) | YES | MUL | NULL |  |
| is_termination | tinyint(1) | NO |  | 0 |  |
| issued_at | timestamp | YES |  | NULL |  |
| cancelled_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `job_batches` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | varchar(255) | NO | PRI | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| total_jobs | int | NO |  | NULL |  |
| pending_jobs | int | NO |  | NULL |  |
| failed_jobs | int | NO |  | NULL |  |
| failed_job_ids | longtext | NO |  | NULL |  |
| options | mediumtext | YES |  | NULL |  |
| cancelled_at | int | YES |  | NULL |  |
| created_at | int | NO |  | NULL |  |
| finished_at | int | YES |  | NULL |  |

## Table: `jobs` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| queue | varchar(255) | NO | MUL | NULL |  |
| payload | longtext | NO |  | NULL |  |
| attempts | tinyint unsigned | NO |  | NULL |  |
| reserved_at | int unsigned | YES |  | NULL |  |
| available_at | int unsigned | NO |  | NULL |  |
| created_at | int unsigned | NO |  | NULL |  |

## Table: `ledger_entries` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| ref_type | varchar(50) | NO | MUL | NULL |  |
| ref_id | char(36) | NO |  | NULL |  |
| debit | decimal(15,2) | NO |  | 0.00 |  |
| credit | decimal(15,2) | NO |  | 0.00 |  |
| occurred_at | timestamp | YES | MUL | NULL |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## Table: `media` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| model_type | varchar(255) | NO | MUL | NULL |  |
| model_id | char(36) | NO |  | NULL |  |
| uuid | char(36) | YES | UNI | NULL |  |
| collection_name | varchar(255) | NO |  | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| file_name | varchar(255) | NO |  | NULL |  |
| mime_type | varchar(255) | YES |  | NULL |  |
| disk | varchar(255) | NO |  | NULL |  |
| conversions_disk | varchar(255) | YES |  | NULL |  |
| size | bigint unsigned | NO |  | NULL |  |
| manipulations | json | NO |  | NULL |  |
| custom_properties | json | NO |  | NULL |  |
| generated_conversions | json | NO |  | NULL |  |
| responsive_images | json | NO |  | NULL |  |
| order_column | int unsigned | YES | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `meter_readings` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| meter_id | char(36) | NO | MUL | NULL |  |
| period_start | date | NO |  | NULL |  |
| period_end | date | NO | MUL | NULL |  |
| reading_value | bigint | NO |  | NULL |  |
| consumption | decimal(15,2) | NO |  | 0.00 |  |
| status | varchar(20) | NO | MUL | DRAFT |  |
| submitted_by_user_id | char(36) | YES | MUL | NULL |  |
| submitted_at | timestamp | YES |  | NULL |  |
| approved_by_user_id | char(36) | YES | MUL | NULL |  |
| approved_at | timestamp | YES |  | NULL |  |
| locked_at | timestamp | YES |  | NULL |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `meters` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| is_master | tinyint(1) | NO |  | 0 |  |
| base_reading | bigint | NO |  | 0 |  |
| room_id | char(36) | YES | MUL | NULL |  |
| code | varchar(100) | NO |  | NULL |  |
| type | varchar(20) | NO | MUL | NULL |  |
| installed_at | date | YES |  | NULL |  |
| is_active | tinyint(1) | NO |  | 1 |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `migrations` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int unsigned | NO | PRI | NULL | auto_increment |
| migration | varchar(255) | NO |  | NULL |  |
| batch | int | NO |  | NULL |  |

## Table: `model_has_permissions` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| permission_id | bigint unsigned | NO | PRI | NULL |  |
| model_type | varchar(255) | NO | PRI | NULL |  |
| model_id | char(36) | NO | PRI | NULL |  |

## Table: `model_has_roles` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| role_id | bigint unsigned | NO | PRI | NULL |  |
| model_type | varchar(255) | NO | PRI | NULL |  |
| model_id | char(36) | NO | PRI | NULL |  |

## Table: `notification_logs` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| rule_id | char(36) | YES | MUL | NULL |  |
| user_id | char(36) | YES | MUL | NULL |  |
| channel | varchar(20) | NO |  | NULL |  |
| status | varchar(20) | NO | MUL | NULL |  |
| provider_id | varchar(255) | YES |  | NULL |  |
| payload | json | YES |  | NULL |  |
| created_at | timestamp | NO | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## Table: `notification_preferences` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| user_id | char(36) | NO | UNI | NULL |  |
| channels | json | YES |  | NULL |  |
| opted_out | tinyint(1) | NO |  | 0 |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `notification_rules` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | YES | MUL | NULL |  |
| trigger | varchar(100) | NO | MUL | NULL |  |
| schedule | json | YES |  | NULL |  |
| template_id | char(36) | NO | MUL | NULL |  |
| is_active | tinyint(1) | NO | MUL | 1 |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `notification_templates` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | YES | MUL | NULL |  |
| code | varchar(100) | NO | MUL | NULL |  |
| channel | varchar(10) | NO |  | IN_APP |  |
| title | varchar(255) | YES |  | NULL |  |
| body | text | NO |  | NULL |  |
| variables | json | YES |  | NULL |  |
| version | int unsigned | NO |  | 1 |  |
| is_active | tinyint(1) | NO |  | 1 |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `notifications` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| type | varchar(255) | NO |  | NULL |  |
| notifiable_type | varchar(255) | NO | MUL | NULL |  |
| notifiable_id | bigint unsigned | NO |  | NULL |  |
| data | text | NO |  | NULL |  |
| read_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `orgs` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| name | varchar(255) | YES |  | NULL |  |
| phone | varchar(30) | YES |  | NULL |  |
| email | varchar(255) | YES |  | NULL |  |
| address | text | YES |  | NULL |  |
| timezone | varchar(64) | NO |  | Asia/Bangkok |  |
| currency | varchar(8) | NO |  | VND |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `password_reset_tokens` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| email | varchar(255) | NO | PRI | NULL |  |
| token | varchar(255) | NO |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |

## Table: `payment_allocations` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| payment_id | char(36) | NO | MUL | NULL |  |
| invoice_id | char(36) | NO | MUL | NULL |  |
| amount | decimal(15,2) | NO |  | NULL |  |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## Table: `payments` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | YES | MUL | NULL |  |
| invoice_id | char(36) | YES | MUL | NULL |  |
| payer_user_id | char(36) | YES | MUL | NULL |  |
| received_by_user_id | char(36) | YES | MUL | NULL |  |
| method | varchar(50) | YES | MUL | NULL |  |
| amount | decimal(15,2) | NO |  | NULL |  |
| reference | varchar(255) | YES |  | NULL |  |
| received_at | timestamp | YES | MUL | NULL |  |
| status | varchar(10) | NO | MUL | APPROVED |  |
| approved_by_user_id | char(36) | YES | MUL | NULL |  |
| approved_at | timestamp | YES |  | NULL |  |
| note | text | YES |  | NULL |  |
| provider_ref | varchar(255) | YES |  | NULL |  |
| provider_status | varchar(50) | YES |  | NULL |  |
| webhook_payload | json | YES |  | NULL |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `permissions` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| name | varchar(255) | NO | MUL | NULL |  |
| guard_name | varchar(255) | NO |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `personal_access_tokens` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| tokenable_type | varchar(255) | NO | MUL | NULL |  |
| tokenable_id | char(36) | NO |  | NULL |  |
| name | text | NO |  | NULL |  |
| token | varchar(64) | NO | UNI | NULL |  |
| abilities | text | YES |  | NULL |  |
| last_used_at | timestamp | YES |  | NULL |  |
| expires_at | timestamp | YES | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `price_histories` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| room_id | char(36) | NO | MUL | NULL |  |
| price | decimal(15,2) | NO |  | NULL |  |
| start_date | date | NO |  | NULL |  |
| end_date | date | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `properties` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| code | varchar(50) | YES |  | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| address | text | YES |  | NULL |  |
| note | text | YES |  | NULL |  |
| default_rent_price_per_m2 | decimal(15,2) | YES |  | NULL |  |
| default_deposit_months | int | NO |  | 1 |  |
| use_floors | tinyint(1) | NO |  | 1 |  |
| default_billing_cycle | varchar(20) | NO |  | MONTHLY |  |
| default_due_day | int | NO |  | 5 |  |
| default_cutoff_day | int | NO |  | 30 |  |
| area | decimal(8,2) | YES |  | NULL |  |
| shared_area | decimal(8,2) | YES |  | NULL |  |
| bank_accounts | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `property_default_services` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| service_id | char(36) | NO | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `property_user` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| property_id | char(36) | NO | MUL | NULL |  |
| user_id | char(36) | NO | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `receipts` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| payment_id | char(36) | NO | UNI | NULL |  |
| path | text | NO |  | NULL |  |
| sha256 | varchar(64) | YES |  | NULL |  |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## Table: `role_has_permissions` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| permission_id | bigint unsigned | NO | PRI | NULL |  |
| role_id | bigint unsigned | NO | PRI | NULL |  |

## Table: `roles` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| name | varchar(255) | NO | MUL | NULL |  |
| guard_name | varchar(255) | NO |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `room_assets` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| serial | varchar(100) | YES |  | NULL |  |
| condition | varchar(50) | YES |  | NULL |  |
| purchased_at | date | YES |  | NULL |  |
| warranty_end | date | YES |  | NULL |  |
| note | text | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `room_floor_plan_nodes` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| floor_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | UNI | NULL |  |
| x | decimal(8,2) | NO |  | 0.00 |  |
| y | decimal(8,2) | NO |  | 0.00 |  |
| width | decimal(8,2) | NO |  | 100.00 |  |
| height | decimal(8,2) | NO |  | 60.00 |  |
| rotation | decimal(5,2) | NO |  | 0.00 |  |
| label | varchar(50) | YES |  | NULL |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `room_prices` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| effective_from | date | NO | MUL | NULL |  |
| price | decimal(15,2) | NO |  | NULL |  |
| created_by_user_id | char(36) | YES | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `room_services` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| service_id | char(36) | NO | MUL | NULL |  |
| quantity | int | NO |  | 1 |  |
| included_units | int | NO |  | 0 |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `room_status_histories` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| from_status | varchar(20) | YES |  | NULL |  |
| to_status | varchar(20) | NO |  | NULL |  |
| reason | text | YES |  | NULL |  |
| changed_by_user_id | char(36) | YES |  | NULL |  |
| created_at | timestamp | YES | MUL | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `room_template_assets` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| room_template_id | char(36) | NO | MUL | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `room_template_services` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| room_template_id | char(36) | NO | PRI | NULL |  |
| service_id | char(36) | NO | PRI | NULL |  |

## Table: `room_templates` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| room_type | varchar(20) | NO |  | apartment |  |
| area | decimal(8,2) | YES |  | NULL |  |
| capacity | int | NO |  | 1 |  |
| base_price | decimal(15,2) | NO |  | 0.00 |  |
| description | text | YES |  | NULL |  |
| amenities | json | YES |  | NULL |  |
| utilities | json | YES |  | NULL |  |
| electric_service_id | char(36) | YES | MUL | NULL |  |
| water_service_id | char(36) | YES | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `rooms` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| floor_id | char(36) | YES | MUL | NULL |  |
| code | varchar(50) | NO |  | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| type | varchar(20) | NO |  | apartment |  |
| area | decimal(8,2) | YES |  | NULL |  |
| floor_number | int | YES |  | NULL |  |
| capacity | int | NO |  | 1 |  |
| base_price | decimal(15,2) | NO |  | 0.00 |  |
| status | varchar(20) | NO | MUL | available |  |
| description | text | YES |  | NULL |  |
| amenities | json | YES |  | NULL |  |
| utilities | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `service_rates` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| service_id | char(36) | NO | MUL | NULL |  |
| effective_from | date | NO | MUL | NULL |  |
| price | decimal(15,2) | NO |  | NULL |  |
| created_by_user_id | char(36) | YES | MUL | NULL |  |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `services` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | YES | MUL | NULL |  |
| code | varchar(50) | NO |  | NULL |  |
| name | varchar(255) | NO |  | NULL |  |
| type | varchar(20) | NO | MUL | OTHER |  |
| calc_mode | varchar(20) | NO |  | NULL |  |
| unit | varchar(20) | NO |  | NULL |  |
| is_recurring | tinyint(1) | NO |  | 1 |  |
| is_active | tinyint(1) | NO |  | 1 |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `sessions` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | varchar(255) | NO | PRI | NULL |  |
| user_id | bigint unsigned | YES | MUL | NULL |  |
| ip_address | varchar(45) | YES |  | NULL |  |
| user_agent | text | YES |  | NULL |  |
| payload | longtext | NO |  | NULL |  |
| last_activity | int | NO | MUL | NULL |  |

## Table: `temporary_uploads` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| user_id | char(36) | YES | MUL | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `ticket_costs` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| ticket_id | char(36) | NO | MUL | NULL |  |
| amount | decimal(15,2) | NO |  | NULL |  |
| payer | varchar(10) | NO |  | OWNER |  |
| note | text | YES |  | NULL |  |
| created_by_user_id | char(36) | NO | MUL | NULL |  |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `ticket_events` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| ticket_id | char(36) | NO | MUL | NULL |  |
| actor_user_id | char(36) | YES | MUL | NULL |  |
| type | varchar(50) | NO |  | NULL |  |
| message | text | YES |  | NULL |  |
| meta | json | YES |  | NULL |  |
| created_at | timestamp | NO | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `tickets` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| property_id | char(36) | NO | MUL | NULL |  |
| room_id | char(36) | NO | MUL | NULL |  |
| contract_id | char(36) | YES | MUL | NULL |  |
| created_by_user_id | char(36) | NO | MUL | NULL |  |
| assigned_to_user_id | char(36) | YES | MUL | NULL |  |
| category | varchar(100) | YES |  | NULL |  |
| priority | varchar(10) | NO | MUL | MEDIUM |  |
| status | varchar(20) | NO | MUL | OPEN |  |
| description | text | NO |  | NULL |  |
| due_at | timestamp | YES |  | NULL |  |
| closed_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `tiered_rates` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | NO | MUL | NULL |  |
| service_rate_id | char(36) | NO | MUL | NULL |  |
| tier_from | int | NO |  | NULL |  |
| tier_to | int | YES |  | NULL |  |
| price | decimal(15,2) | NO |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `user_invitations` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| email | varchar(255) | NO | UNI | NULL |  |
| token | varchar(255) | NO | UNI | NULL |  |
| role_name | varchar(255) | NO |  | NULL |  |
| org_id | char(36) | YES | MUL | NULL |  |
| properties_scope | json | YES |  | NULL |  |
| invited_by | char(36) | NO | MUL | NULL |  |
| expires_at | timestamp | NO |  | NULL |  |
| registered_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |
| deleted_at | timestamp | YES |  | NULL |  |

## Table: `users` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | char(36) | NO | PRI | NULL |  |
| org_id | char(36) | YES | MUL | NULL |  |
| full_name | varchar(255) | NO |  | NULL |  |
| phone | varchar(30) | YES |  | NULL |  |
| email | varchar(255) | NO | UNI | NULL |  |
| password_hash | text | YES |  | NULL |  |
| phone_verified_at | timestamp | YES |  | NULL |  |
| email_verified_at | timestamp | YES |  | NULL |  |
| failed_login_count | int | NO |  | 0 |  |
| locked_until | timestamp | YES |  | NULL |  |
| last_login_at | timestamp | YES |  | NULL |  |
| mfa_enabled | tinyint(1) | NO |  | 0 |  |
| mfa_method | varchar(20) | YES |  | NULL |  |
| two_factor_recovery_codes | text | YES |  | NULL |  |
| two_factor_secret | text | YES |  | NULL |  |
| two_factor_confirmed_at | timestamp | YES |  | NULL |  |
| is_active | tinyint(1) | NO |  | 1 |  |
| deleted_at | timestamp | YES |  | NULL |  |
| meta | json | YES |  | NULL |  |
| identity_number | varchar(20) | YES |  | NULL |  |
| identity_issued_date | date | YES |  | NULL |  |
| identity_issued_place | varchar(255) | YES |  | NULL |  |
| date_of_birth | date | YES |  | NULL |  |
| address | text | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

## Table: `verification_codes` 

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | bigint unsigned | NO | PRI | NULL | auto_increment |
| email | varchar(255) | NO | MUL | NULL |  |
| code | varchar(255) | NO |  | NULL |  |
| type | varchar(255) | NO |  | otp |  |
| expires_at | timestamp | NO |  | NULL |  |
| used_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | NULL |  |
| updated_at | timestamp | YES |  | NULL |  |

