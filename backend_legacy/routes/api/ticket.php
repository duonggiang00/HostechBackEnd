<?php

use App\Http\Controllers\Api\Ticket\TicketController;
use Illuminate\Support\Facades\Route;

// Tickets CRUD
Route::apiResource('tickets', TicketController::class);

// Ticket Status
Route::put('tickets/{id}/status', [TicketController::class, 'updateStatus']);

// Ticket Events (comments/notes)
Route::post('tickets/{id}/events', [TicketController::class, 'storeEvent']);

// Ticket Costs
Route::post('tickets/{id}/costs', [TicketController::class, 'storeCost']);
