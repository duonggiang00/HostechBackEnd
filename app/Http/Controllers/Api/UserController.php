<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\QueryBuilder\QueryBuilder;

class UserController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $query = QueryBuilder::for(User::class)
            ->allowedFilters(['role', 'email', 'is_active'])
            ->defaultSort('full_name');

        return UserResource::collection($query->paginate(15))->response()->setStatusCode(200);
    }

    public function store(UserStoreRequest $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $data['password_hash'] = Hash::make($data['password']);
        $data['org_id'] = request()->header('X-Org-Id');
        unset($data['password'], $data['password_confirmation']);

        $user = User::create($data);

        return new UserResource($user);
    }

    public function show(string $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $user);

        return new UserResource($user);
    }

    public function update(UserUpdateRequest $request, string $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $user);

        $data = $request->validated();
        if (isset($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password'], $data['password_confirmation']);
        }

        $user->update($data);

        return new UserResource($user);
    }

    public function destroy(string $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
