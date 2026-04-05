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

        $this->info('Đang tìm các hợp đồng hết hạn...');

        if ($isDryRun) {
            $count = \App\Models\Contract\Contract::where('status', 'ACTIVE')
                ->whereNotNull('end_date')
                ->where('end_date', '<', today())
                ->count();
            $this->info("[DRY-RUN] Tìm thấy {$count} hợp đồng sẽ được chuyển sang EXPIRED.");
            return self::SUCCESS;
        }

        $count = $this->contractService->markExpiredContracts();

        $this->info("✅ Đã chuyển {$count} hợp đồng sang trạng thái EXPIRED.");
        $this->info('   └─ Tiền cọc liên quan đã được cập nhật sang REFUND_PENDING.');

        return self::SUCCESS;
    }
}
