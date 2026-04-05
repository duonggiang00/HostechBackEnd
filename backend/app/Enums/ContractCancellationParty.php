<?php

namespace App\Enums;

enum ContractCancellationParty: string
{
    case LANDLORD = 'LANDLORD'; // Chủ nhà chủ động hủy
    case TENANT   = 'TENANT';   // Khách thuê chủ động hủy
    case MUTUAL   = 'MUTUAL';   // Hai bên thỏa thuận

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::LANDLORD => 'Chủ nhà hủy',
            self::TENANT   => 'Khách thuê hủy',
            self::MUTUAL   => 'Hai bên thỏa thuận',
        };
    }
}
