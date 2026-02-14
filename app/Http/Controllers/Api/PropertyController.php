<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyIndexRequest;
use App\Http\Requests\PropertyStoreRequest;
use App\Http\Requests\PropertyUpdateRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\PropertyService;

use Dedoc\Scramble\Attributes\Group; // Added

/**
 * Quản lý Bất động sản (Properties)
 * 
 * API quản lý các bất động sản (tòa nhà, khu phức hợp) thuộc về một tổ chức.
 */
#[Group('Quản lý Bất động sản')]
class PropertyController extends Controller
{
    public function __construct(protected PropertyService $service) {}

    /**
     * Danh sách bất động sản
     * 
     * Lấy danh sách Property. Hỗ trợ lọc theo Org.
     */
    public function index(PropertyIndexRequest $request)
    {
        $this->authorize('viewAny', Property::class);

        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = ['name', 'code'];
        $search = $request->input('search');

        // Security: Filter by Org for non-Admin
        $user = $request->user();
        if (! $user->hasRole('Admin') && $user->org_id) {
            $request->merge(['org_id' => $user->org_id]); // Force filter in request? 
            // Better to pass to service explicitly or modify service to accept orgId
            $paginator = $this->service->paginate($allowed, $perPage, $search, $user->org_id);
        } else {
            // Admin or no org (Admin)
            // If Admin wants to filter by org_id, they can pass it
            $orgId = $request->input('org_id');
            $paginator = $this->service->paginate($allowed, $perPage, $search, $orgId);
        }

        return PropertyResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách bất động sản đã xóa (Thùng rác)
     * 
     * Lấy danh sách bất động sản đã bị xóa tạm thời.
     */
    public function trash(PropertyIndexRequest $request) 
    {
        $this->authorize('viewAny', Property::class);

        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = ['name', 'code'];
        $search = $request->input('search');

        $properties = $this->service->paginateTrash($allowed, $perPage, $search);

        return PropertyResource::collection($properties)->response()->setStatusCode(200);
    }

    /**
     * Tạo bất động sản mới
     */
    public function store(PropertyStoreRequest $request)
    {
        $this->authorize('create', Property::class);

        $data = $request->validated();
        
        /** @var \App\Models\User $user */
        $user = auth()->user();

        // If user belongs to an Org, force that Org ID
        if ($user->org_id) {
            $data['org_id'] = $user->org_id;
        } 
        // If Admin (no org_id), try getting from request or header
        else {
            $data['org_id'] = $request->input('org_id') ?? $request->header('X-Org-Id');
        }

        if (empty($data['org_id'])) {
             return response()->json(['message' => 'Organization ID is required.'], 422);
        }

        $property = $this->service->create($data);

        return new PropertyResource($property);
    }

    /**
     * Chi tiết bất động sản
     */
    public function show(string $id)
    {
        $property = $this->service->find($id);
        if (! $property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $property);

        // Check if property has floors
        if ($property->floors()->exists()) {
            $property->load(['floors.rooms']); // Optional: load rooms within floors if desired, or just 'floors'
        } else {
            $property->load('rooms');
        }

        return new PropertyResource($property);
    }

    /**
     * Cập nhật bất động sản
     */
    public function update(PropertyUpdateRequest $request, string $id)
    {
        $property = $this->service->find($id);
        if (! $property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $property);

        $updated = $this->service->update($id, $request->validated());

        return new PropertyResource($updated);
    }

    /**
     * Xóa bất động sản (Soft Delete)
     */
    public function destroy(string $id)
    {
        $property = $this->service->find($id);
        if (! $property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $property);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục bất động sản
     */
    public function restore(string $id)
    {
        $property = $this->service->findTrashed($id);
        if (! $property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $property);

        $this->service->restore($id);

        return new PropertyResource($property);
    }

    /**
     * Xóa vĩnh viễn bất động sản
     */
    public function forceDelete(string $id)
    {
        $property = $this->service->findWithTrashed($id);
        if (! $property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $property);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
