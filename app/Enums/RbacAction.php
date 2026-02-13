<?php

namespace App\Enums;

enum RbacAction: string
{
    case VIEW_ANY = 'viewAny';
    case VIEW = 'view';
    case CREATE = 'create';
    case UPDATE = 'update';
    case DELETE = 'delete';
    case RESTORE = 'restore';
    case FORCE_DELETE = 'forceDelete';

    /**
     * Map short-hand characters to actions.
     *
     * @param string $char 'C', 'R', 'U', 'D', '*'
     * @return array<self>
     */
    public static function fromShortMap(string $char): array
    {
        return match (strtoupper($char)) {
            'C' => [self::CREATE],
            'R' => [self::VIEW_ANY, self::VIEW],
            'U' => [self::UPDATE],
            'D' => [self::DELETE],
            '*' => self::cases(),
            default => []
        };
    }
}
