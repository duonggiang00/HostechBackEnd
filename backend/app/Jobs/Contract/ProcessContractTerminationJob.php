<?php

namespace App\Jobs\Contract;

use App\Events\Contract\Termination\TerminationFailed;
use App\Models\Contract\Contract;
use App\Services\Contract\ContractService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Throwable;

class ProcessContractTerminationJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 180;

    public int $uniqueFor = 120;

    public function __construct(
        public string $contractId,
        /** @var array<string, mixed> */
        public array $payload,
        public string $actorUserId,
        public string $lockOwner,
    ) {}

    public function uniqueId(): string
    {
        return 'contract-terminate-'.$this->contractId;
    }

    public static function terminationLockName(string $contractId): string
    {
        return 'terminate_contract_'.$contractId;
    }

    public function handle(ContractService $contractService): void
    {
        try {
            $contract = Contract::query()->findOrFail($this->contractId);

            // API routes use the Sanctum RequestGuard, which has no onceUsingId. Impersonate via the session guard for policies/logs.
            Auth::guard('web')->onceUsingId($this->actorUserId);

            $contractService->terminate($contract, $this->payload);
        } finally {
            Cache::restoreLock(self::terminationLockName($this->contractId), $this->lockOwner)->release();
            Auth::guard('web')->logout();
        }
    }

    public function failed(?Throwable $e): void
    {
        $contract = Contract::query()->find($this->contractId);
        if ($contract) {
            event(new TerminationFailed(
                $contract,
                $e?->getMessage() ?? 'Thanh lý hợp đồng thất bại.'
            ));
        }
    }
}
