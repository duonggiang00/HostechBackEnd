@echo off
echo ==========================================
echo [1/3] Syncing API and Generating Types...
echo ==========================================
cd backend
php artisan scramble:export
cd ../frontendV2Hostech
call npm run type-sync

echo.
echo ==========================================
echo [2/3] Running Backend Tests (Pest)...
echo ==========================================
cd ../backend
php artisan test

echo.
echo ==========================================
echo [3/3] Running Frontend Linting...
echo ==========================================
cd ../frontendV2Hostech
call npm run lint

echo.
echo ==========================================
echo Verification Complete!
echo ==========================================
cd ..
