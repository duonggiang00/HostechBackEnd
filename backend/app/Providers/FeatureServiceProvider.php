<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FeatureServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerModuleRoutes();
        $this->registerModuleFactories();
        $this->registerModuleViews();
    }

    /**
     * Automatically register views from all feature modules.
     * Expects: app/Features/{Module}/Resources/views
     * Usage: view('Module::view-name')
     */
    protected function registerModuleViews(): void
    {
        $featuresPath = app_path('Features');

        if (!File::isDirectory($featuresPath)) {
            return;
        }

        $modules = File::directories($featuresPath);

        foreach ($modules as $modulePath) {
            $viewsPath = $modulePath . DIRECTORY_SEPARATOR . 'Resources' . DIRECTORY_SEPARATOR . 'views';
            $moduleName = strtolower(basename($modulePath));

            if (File::exists($viewsPath)) {
                $this->loadViewsFrom($viewsPath, $moduleName);
            }
        }
    }

    /**
     * Set up global factory discovery for feature modules.
     * Maps: App\Features\{Feature}\Models\{Model} -> Database\Factories\{Feature}\{Model}Factory
     */
    protected function registerModuleFactories(): void
    {
        Factory::guessFactoryNamesUsing(function (string $modelName) {
            // Extract the class base name (e.g., Contract)
            $className = class_basename($modelName);

            // Extract the feature name (e.g., Contract from App\Features\Contract\Models\Contract)
            $feature = Str::between($modelName, 'Features\\', '\\Models');

            // If it's a feature-based model, use the custom factory path
            if ($feature && $feature !== $modelName) {
                return "Database\\Factories\\{$feature}\\{$className}Factory";
            }

            // Fallback to default Laravel behavior
            return 'Database\\Factories\\' . $className . 'Factory';
        });
    }

    /**
     * Automatically register routes from all feature modules.
     * Expects: app/Features/{Module}/Routes/api.php
     */
    protected function registerModuleRoutes(): void
    {
        $featuresPath = app_path('Features');

        if (!File::isDirectory($featuresPath)) {
            return;
        }

        $modules = File::directories($featuresPath);

        foreach ($modules as $modulePath) {
            $apiRoutePath = $modulePath . DIRECTORY_SEPARATOR . 'Routes' . DIRECTORY_SEPARATOR . 'api.php';

            if (File::exists($apiRoutePath)) {
                Route::prefix('api')
                    ->middleware('api')
                    ->group($apiRoutePath);
            }
        }
    }
}
