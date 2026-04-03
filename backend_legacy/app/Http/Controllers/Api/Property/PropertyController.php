<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\PropertyIndexRequest;
use App\Http\Requests\Property\PropertyStoreRequest;
use App\Http\Requests\Property\PropertyUpdateRequest;
use App\Http\Resources\Property\PropertyResource;
use App\Models\Property\Property;
use App\Services\Property\PropertyService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request; // Added

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

        $paginator = $this->service->paginate(
            ['name', 'code'],
            (int) $request->query('per_page', 15),
            $request->input('search'),
            $request->user()->org_id ?? $request->input('org_id'),
            $request->boolean('with_trashed'),
            $request->user()
        );

        return PropertyResource::collection($paginator);
    }

    /**
     * Danh sách bất động sản đã xóa (Thùng rác)
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', Property::class);

        $properties = $this->service->paginateTrash(
            ['name', 'code'],
            (int) $request->query('per_page', 15),
            $request->input('search')
        );

        return PropertyResource::collection($properties);
    }

    /**
     * Tạo bất động sản mới
     */
    public function store(PropertyStoreRequest $request)
    {
        $this->authorize('create', Property::class);

        $property = $this->service->create($request->validated(), $request->user());

        return new PropertyResource($property);
    }

    /**
     * Chi tiết bất động sản
     */
    public function show(string $id)
    {
        $property = $this->service->find($id, true) ?? abort(404, 'Property not found');

        $this->authorize('view', $property);

        return new PropertyResource($property);
    }

    /**
     * Cập nhật bất động sản
     */
    public function update(PropertyUpdateRequest $request, string $id)
    {
        $property = $this->service->find($id) ?? abort(404, 'Property not found');

        $this->authorize('update', $property);

        $updated = $this->service->update($id, $request->validated());

        return new PropertyResource($updated);
    }

    /**
     * Xóa bất động sản (Soft Delete)
     */
    public function destroy(string $id)
    {
        $property = $this->service->find($id) ?? abort(404, 'Property not found');

        $this->authorize('delete', $property);

        $this->service->delete($id);

        return response()->noContent();
    }

    /**
     * Khôi phục bất động sản
     */
    public function restore(string $id)
    {
        $property = $this->service->findTrashed($id) ?? abort(404, 'Property not found in trash');

        $this->authorize('delete', $property);

        $this->service->restore($id);

        return new PropertyResource($property);
    }

    /**
     * Xóa vĩnh viễn bất động sản
     */
    public function forceDelete(string $id)
    {
        $property = $this->service->findWithTrashed($id) ?? abort(404, 'Property not found');

        $this->authorize('delete', $property);

        $this->service->forceDelete($id);

        return response()->noContent();
    }

    /**
     * Chốt tiền tháng (Trigger Monthly Billing)
     *
     * Tạo hóa đơn cho tất cả các phòng có hợp đồng đang hoạt động trong tòa nhà.
     */
    public function triggerBilling(Request $request, string $id, \App\Services\Invoice\InvoiceService $invoiceService)
    {
        $property = $this->service->find($id) ?? abort(404, 'Property not found');

        $this->authorize('update', $property);

        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'], // e.g., "2024-10"
        ]);

        $options = [];
        if (isset($validated['month'])) {
            $options['billing_date'] = \Carbon\Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        }

        $count = $invoiceService->createMonthlyInvoicesForProperty($property, $options);

        return response()->json([
            'message' => "Đã khởi tạo {$count} hóa đơn cho tòa nhà: {$property->name}",
            'count' => $count
        ]);
    }
}
