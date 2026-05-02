<?php

namespace App\Console\Commands;

use App\Models\Contract\Contract;
use App\Services\Contract\ContractService;
use Illuminate\Console\Command;

class RegenerateContractDocumentsCommand extends Command
{
    protected $signature = 'contracts:regenerate-documents
                            {--contract= : UUID hợp đồng}
                            {--all : Tất cả hợp đồng đã có document_path}';

    protected $description = 'Tạo lại file bản mềm hợp đồng (PDF/DOCX) theo dữ liệu và mẫu hiện tại';

    public function handle(ContractService $contractService): int
    {
        $contractId = $this->option('contract');
        if ($contractId) {
            $contract = Contract::query()->find($contractId);
            if (! $contract) {
                $this->error('Không tìm thấy hợp đồng.');

                return self::FAILURE;
            }
            if (! $contract->document_path) {
                $this->warn('Hợp đồng chưa có document_path — bỏ qua (dùng luồng tạo hợp đồng/ký để sinh file lần đầu).');

                return self::SUCCESS;
            }
            $contractService->regenerateDocumentIfExists($contract);
            $this->info('Đã kích tạo lại bản mềm cho hợp đồng '.$contractId.'.');

            return self::SUCCESS;
        }

        if ($this->option('all')) {
            $processed = 0;
            Contract::query()
                ->whereNotNull('document_path')
                ->orderBy('id')
                ->chunkById(50, function ($contracts) use ($contractService, &$processed): void {
                    foreach ($contracts as $contract) {
                        $contractService->regenerateDocumentIfExists($contract);
                        $processed++;
                    }
                });

            $this->info("Đã xử lý {$processed} hợp đồng có sẵn bản mềm.");

            return self::SUCCESS;
        }

        $this->error('Chỉ định --contract=UUID hoặc --all');

        return self::FAILURE;
    }
}
