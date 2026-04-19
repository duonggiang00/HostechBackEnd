<?php

namespace App\Console\Commands;

use App\Services\Contract\ContractService;
use Illuminate\Console\Command;

class ExpireContracts extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'contracts:expire
                            {--dry-run : Chỉ xem trước, không thực sự cập nhật}';

    /**
     * The console command description.
     */
    protected $description = 'Tự động chuyển trạng thái các hợp đồng đã hết hạn sang EXPIRED và đánh dấu tiền cọc cần hoàn trả.';

    public function __construct(protected ContractService $contractService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('[DRY-RUN] Không thực sự cập nhật dữ liệu.');
        }

        $this->info('Đang kiểm tra các hợp đồng hết hạn và vi phạm dư nợ...');
        
        $expiredCount = $this->contractService->markExpiredContracts();
        $breachCount = $this->contractService->processDebtBreachTerminations();

        $this->info("✅ Đã chuyển {$expiredCount} hợp đồng sang trạng thái EXPIRED.");
        $this->info("⚠️ Đã tự động thanh lý {$breachCount} hợp đồng do vi phạm dư nợ vượt cọc.");

        return self::SUCCESS;
    }
}
