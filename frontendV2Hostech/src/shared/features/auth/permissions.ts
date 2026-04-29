/**
 * Spatie permission names — must match `php artisan rbac:sync` output (`{action} {ModuleName}`).
 * Use with PermissionGate / hasPermission to avoid string drift.
 */
export const PERMISSIONS = {
  viewAnyInvoice: 'viewAny Invoice',
  viewInvoice: 'view Invoice',
  createInvoice: 'create Invoice',
  updateInvoice: 'update Invoice',
  deleteInvoice: 'delete Invoice',

  viewAnyContracts: 'viewAny Contracts',
  viewContracts: 'view Contracts',
  createContracts: 'create Contracts',
  updateContracts: 'update Contracts',
  deleteContracts: 'delete Contracts',

  viewAnyPayment: 'viewAny Payment',
  viewPayment: 'view Payment',
  createPayment: 'create Payment',
  deletePayment: 'delete Payment',

  viewAnyRoom: 'viewAny Room',
  viewRoom: 'view Room',
  createRoom: 'create Room',
  updateRoom: 'update Room',
  deleteRoom: 'delete Room',

  viewAnyProperties: 'viewAny Properties',
  viewProperties: 'view Properties',
  createProperties: 'create Properties',
  updateProperties: 'update Properties',
  deleteProperties: 'delete Properties',

  viewAnyTicket: 'viewAny Ticket',
  viewTicket: 'view Ticket',
  createTicket: 'create Ticket',
  updateTicket: 'update Ticket',
  deleteTicket: 'delete Ticket',

  viewAnyHandover: 'viewAny Handover',
  viewHandover: 'view Handover',
  createHandover: 'create Handover',
  updateHandover: 'update Handover',
  deleteHandover: 'delete Handover',

  viewAnyMeterReading: 'viewAny MeterReading',
  viewMeterReading: 'view MeterReading',
  createMeterReading: 'create MeterReading',
  updateMeterReading: 'update MeterReading',
  deleteMeterReading: 'delete MeterReading',

  viewAnyRoomAsset: 'viewAny RoomAsset',
  viewRoomAsset: 'view RoomAsset',
  createRoomAsset: 'create RoomAsset',
  updateRoomAsset: 'update RoomAsset',
  deleteRoomAsset: 'delete RoomAsset',
} as const;

export type PermissionLiteral = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
