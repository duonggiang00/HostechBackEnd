<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.3.27
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- tailwindcss (TAILWINDCSS) - v4

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## ⚠️ CRITICAL AGENTIC WORKFLOW (READ FIRST & OBEY)
To prevent hallucination and strictly follow the user's intended architecture, you MUST follow this workflow before executing ANY task:

**PHASE 1: RESEARCH & PLANNING (MANDATORY)**
1. **Never assume project structure.** If you are asked to code a feature, your VERY FIRST action must be to read related files in the `docs/` or `docs/project_specs/` directories.
2. ALWAYS read `docs/database.dbml` when you need to understand tables, relationships, or before creating migrations.
3. ALWAYS read `docs/MODULE_GUIDE.md` when asked to create or scaffold a new module.
4. ALWAYS read `docs/API_DOCS.md` when tasked with writing API Controllers, FormRequests, or API Resources.
5. Search the `docs/project_specs/` directory for any pre-existing plan (e.g., `INVOICE_MODULE_PLAN.md`) related to your task. If one exists, YOU MUST READ IT.

**PHASE 2: EXECUTION**
- Chỉ sau khi đọc các tài liệu liên quan mới được bắt đầu viết code hoặc scaffold.
- Nếu người dùng yêu cầu chạy workflow:
    - `/scaffold_module`: Khởi tạo nhanh module mới chuẩn DDD.
    - `/audit_module`: Rà soát kiến trúc và compliance của một Domain (Models, Services, Policies, Resources).
    - `/add_status_history`: Tự động tạo bảng history và logic logging cho Model.
    - `/finalize_module`: Kiểm tra cuối cùng (Pint, Tests, RBAC Sync) trước khi báo cáo hoàn tất.
- Luôn sử dụng `view_file` để đọc nội dung workflow tương ứng trong `.agents/workflows/` và thực hiện CHÍNH XÁC từng bước.
## Project Architecture (Strict Enforcement)

### 1. Domain-Driven Directory Structuring & Service Layer Pattern
- **Structure**: The project strictly follows a Domain-Driven architecture within standard Laravel folders. Files must be organized into Domain folders (e.g., `Auth`, `Org`, `Property`, `Contract`, `System`) across `Models`, `Controllers/Api`, `Services`, `Requests`, `Resources`, `Policies`.
- **Logic**: All business logic MUST go in Service classes (`App\Services\{Domain}`).
    - **Thin Controllers**: Controllers only handle request parsing, authorization (`$this->authorize`), and response formatting.
    - **Logic Consolidation**: Service methods should handle varied logic (e.g., Admin vs Tenant) internally using performer context, ensuring controllers remain clean.
    - **Intelligent Status Mapping**: Services should handle state transitions (e.g., `PENDING` vs `APPROVED`) based on the performer's roles/permissions.
- **Naming**: `ModelNameService` (e.g., `ContractService`).
- **Dependency Injection**: Inject services into controllers.

### 2. Role-Based Access Control (RBAC) & Scoping
- **Engine**: Spatie Laravel Permission.
- **Dynamic Permissions**: All Policies MUST implement `App\Contracts\RbacModuleProvider`.
- **Sync**: Run `php artisan rbac:sync` to register permissions defined in Policies.
- **Scoping Pattern**:
    - `Staff/Manager/Owner`: Access via standard Permission (`view Contracts`) + `HandlesOrgScope`.
    - `Tenant`: Access via **Membership** (e.g., check if `user_id` exists in `members` table).
- **Traits**: Use `HandlesOrgScope` for ownership checks.

### 3. Multi-tenancy
- **Models**: Tenant-scoped models MUST use `App\Models\Concerns\MultiTenant`.
- **Foreign Keys**: `org_id` is the tenant key (UUID based).

### 4. Database Schema Structure
- See `docs/database.dbml` for the complete, up-to-date Database Markup Language formulation.
- **Key Concepts**: 
  - All primary keys are `uuid`. 
  - Standard polymorphic Spatie MediaLibrary `media` handles photos, PDFs, receipts, and avatars—there are no separate hardcoded photo tables.
  - History Tables (e.g. `room_status_histories`, `room_prices`) are used extensively for snapshotting past data over time without mutating history.

### 4. API Standardization
- **Documentation**: Use `Dedoc\Scramble\Attributes\Group` in Controllers.
- **Validation**: MANDATORY use of FormRequests (`App\Http\Requests`).
- **Responses**: MANDATORY use of Eloquent Resources (`App\Http\Resources`).
    - **Completeness**: Resources must expose all fields necessary for UI verification (e.g., `status`, `full_name`, `phone`, `identity_number`).
    - **Null-Safety**: Ensure optional fields return consistent types (or `null`) and handle relationships gracefully.
- **Error Handling**: Standardize on `abort(code, message)` for consistent JSON Exception responses instead of manual `response()->json()`.
- **Filtering**: Services should support standardized filtering (e.g., `allowedFilters` via Spatie QueryBuilder).
- **Scramble Annotations**: Include standard `@queryParam` annotations (per_page, page, search, sort, filter, with_trashed).

### 5. Audit Logging & State Tracking
- **Models**: High-value models tracking state changes MUST use `App\Traits\SystemLoggable`.
- **History Tables**: Use specialized history tables (e.g., `room_status_histories`) for snapshotting temporal data.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan

- Use the `list-artisan-commands` tool when you need to call an Artisan command to double-check the available parameters.

## URLs

- Whenever you share a project URL with the user, you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain/IP, and port.

## Tinker / Debugging

- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.
- Use the `database-schema` tool to inspect table structure before writing migrations or models.

## Reading Browser Logs With the `browser-logs` Tool

- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)

- Boost comes with a powerful `search-docs` tool you should use before trying other approaches when working with Laravel or Laravel ecosystem packages. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic-based queries at once. For example: `['rate limiting', 'routing rate limiting', 'routing']`. The most relevant results will be returned first.
- Do not add package names to queries; package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'.
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit".
3. Quoted Phrases (Exact Position) - query="infinite scroll" - words must be adjacent and in that order.
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit".
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms.

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.

## Constructors

- Use PHP 8 constructor property promotion in `__construct()`.
    - `public function __construct(public GitHub $github) { }`
- Do not allow empty `__construct()` methods with zero parameters unless the constructor is private.

## Type Declarations

- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<!-- Explicit Return Types and Method Params -->
```php
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
```

## Enums

- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

## Comments

- Prefer PHPDoc blocks over inline comments. Never use comments within the code itself unless the logic is exceptionally complex.

## PHPDoc Blocks

- Add useful array shape type definitions when appropriate.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

## Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## Controllers & Validation

- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

## Authentication & Authorization

- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

## Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== laravel/v12 rules ===

# Laravel 12

- CRITICAL: ALWAYS use `search-docs` tool for version-specific Laravel documentation and updated code examples.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

## Laravel 12 Structure

- In Laravel 12, middleware are no longer registered in `app/Http/Kernel.php`.
- Middleware are configured declaratively in `bootstrap/app.php` using `Application::configure()->withMiddleware()`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- The `app\Console\Kernel.php` file no longer exists; use `bootstrap/app.php` or `routes/console.php` for console configuration.
- Console commands in `app/Console/Commands/` are automatically available and do not require manual registration.

## Database

- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 12 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models

- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== pint/core rules ===

# Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.
- CRITICAL: ALWAYS use `search-docs` tool for version-specific Pest documentation and updated code examples.
- IMPORTANT: Activate `pest-testing` every time you're working with a Pest or testing-related task.

=== tailwindcss/core rules ===

# Tailwind CSS

- Always use existing Tailwind conventions; check project patterns before adding new ones.
- IMPORTANT: Always use `search-docs` tool for version-specific Tailwind CSS documentation and updated code examples. Never rely on training data.
- IMPORTANT: Activate `tailwindcss-development` every time you're working with a Tailwind CSS or styling-related task.

=== laravel/fortify rules ===

# Laravel Fortify

- Fortify is a headless authentication backend that provides authentication routes and controllers for Laravel applications.
- IMPORTANT: Always use the `search-docs` tool for detailed Laravel Fortify patterns and documentation.
- IMPORTANT: Activate `developing-with-fortify` skill when working with Fortify authentication features.
</laravel-boost-guidelines>
