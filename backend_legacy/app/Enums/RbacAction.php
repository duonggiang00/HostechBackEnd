<?php

namespace App\Enums;

enum RbacAction: string
{
    case VIEW_ANY = 'viewAny';
    case VIEW = 'view';
    case CREATE = 'create';
    case UPDATE = 'update';
    case DELETE = 'delete';
    case DELETE_ANY = 'deleteAny';
    case RESTORE = 'restore';
    case RESTORE_ANY = 'restoreAny';
    case FORCE_DELETE = 'forceDelete';
    case FORCE_DELETE_ANY = 'forceDeleteAny';
    case UPDATE_ANY = 'updateAny';

    /**
     * Map short-hand characters to actions.
     *
     * @param  string  $char  'C', 'R', 'U', 'D', '*'
     * @return array<self>
     */
    public static function fromShortMap(string $char): array
    {
        return match (strtoupper($char)) {
            'C' => [self::CREATE],
            'R' => [self::VIEW_ANY, self::VIEW],
            'U' => [self::UPDATE, self::UPDATE_ANY],
            'D' => [self::DELETE, self::DELETE_ANY, self::RESTORE, self::RESTORE_ANY, self::FORCE_DELETE, self::FORCE_DELETE_ANY],
            '*' => self::cases(),
            default => []
        };
    }
}
