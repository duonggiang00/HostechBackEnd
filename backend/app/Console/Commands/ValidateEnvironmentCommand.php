<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Validates that required configuration is present for production-style deployments.
 * Uses config where possible (not raw env()) outside this command's checks.
 */
class ValidateEnvironmentCommand extends Command
{
    protected $signature = 'env:validate
        {--strict : Treat warnings as failures (for staging checks)}
        {--for-ci : Minimal checks suitable when APP_ENV=testing}';

    protected $description = 'Validate required environment variables for production (see DEPLOY.md)';

    public function handle(): int
    {
        if ($this->option('for-ci')) {
            return $this->validateCi();
        }

        $strict = (bool) $this->option('strict');
        $isProd = app()->environment('production');

        $enforce = $isProd || $strict;

        if (! $enforce) {
            $this->info('Advisory mode (not production, --strict not set): missing vars are reported but exit code stays 0.');
        }

        $failed = false;

        $required = [
            'APP_KEY',
            'APP_URL',
            'DB_CONNECTION',
            'DB_HOST',
            'DB_DATABASE',
            'DB_USERNAME',
            'QUEUE_CONNECTION',
        ];

        foreach ($required as $key) {
            if ($this->missingEnv($key)) {
                $this->error("Missing or empty: {$key}");
                $failed = true;
            }
        }

        if (config('app.debug') && $enforce) {
            $this->error('APP_DEBUG must be false in production (or when using --strict).');
            $failed = true;
        }

        if ($this->queueNeedsRedis()) {
            $redisHost = config('deployment.redis_host');
            if (! is_string($redisHost) || trim($redisHost) === '') {
                $this->error('REDIS_HOST is required when QUEUE_CONNECTION uses redis.');
                $failed = true;
            }
        }

        if ($this->vnpayConfigured() && $this->vnpayPlaceholderSecrets()) {
            $this->error('VNPAY_TMN_CODE / VNPAY_HASH_SECRET look like placeholders; set real secrets for live VNPay.');
            $failed = true;
        }

        if ($failed) {
            $this->line('See DEPLOY.md (Secrets rotation) and backend/docs/architecture/secrets_rotation.md.');
            if (! $enforce) {
                $this->warn('Resolve the issues above before promoting to production (or run with --strict).');

                return self::SUCCESS;
            }

            return self::FAILURE;
        }

        $this->info('Environment validation passed.');

        return self::SUCCESS;
    }

    protected function validateCi(): int
    {
        $key = config('deployment.app_key');
        if (! is_string($key) || trim($key) === '') {
            $this->error('APP_KEY must be set for the test runner.');

            return self::FAILURE;
        }

        $this->info('CI environment check passed.');

        return self::SUCCESS;
    }

    protected function missingEnv(string $key): bool
    {
        $path = match ($key) {
            'APP_KEY' => 'deployment.app_key',
            'APP_URL' => 'deployment.app_url',
            'DB_CONNECTION' => 'deployment.db_connection',
            'DB_HOST' => 'deployment.db_host',
            'DB_DATABASE' => 'deployment.db_database',
            'DB_USERNAME' => 'deployment.db_username',
            'QUEUE_CONNECTION' => 'deployment.queue_connection',
            default => null,
        };

        if ($path === null) {
            return true;
        }

        $v = config($path);

        return ! is_string($v) || trim($v) === '';
    }

    protected function queueNeedsRedis(): bool
    {
        $q = strtolower((string) config('deployment.queue_connection'));

        return Str::contains($q, 'redis');
    }

    protected function vnpayConfigured(): bool
    {
        return strtolower((string) config('deployment.vnpay_mode')) === 'production';
    }

    protected function vnpayPlaceholderSecrets(): bool
    {
        $tmn = (string) config('deployment.vnpay_tmn_code');
        $secret = (string) config('deployment.vnpay_hash_secret');

        return Str::contains($tmn, 'sandbox')
            || Str::contains($secret, 'sandbox')
            || Str::contains($tmn, '<')
            || Str::contains($secret, '<');
    }
}
