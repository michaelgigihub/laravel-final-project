## Quick orientation

This repository is a Laravel (server) + Inertia + React (frontend) application. High-level structure:

- Backend: PHP 8.2+, Laravel (app/). Business logic lives in `app/Services/`, thin controllers in `app/Http/Controllers/`, request validation in `app/Http/Requests/`, and Eloquent models in `app/Models/`.
- Frontend: React + Vite under `resources/js/` and views with Inertia in `resources/views/`.
- Auth: Laravel Fortify is used for authentication (see `app/Providers/FortifyServiceProvider.php` and `routes/auth.php`).
- Auditing: `app/Services/AdminAuditService.php` shows how key audit events are recorded.

## Why the layout matters

- `app/Services/` contains domain/business logic (use these instead of placing complex logic inside controllers).
- `app/Http/Requests/` implements validation and authorization per endpoint — prefer moving validation into Request classes.
- Inertia bridges Laravel controllers and React pages; prefer returning Inertia responses from controllers for pages.

## Key files & places to look (examples)

- Routes: `routes/web.php`, `routes/auth.php`, `routes/settings.php` — entry points for controllers.
- Models: `app/Models/` (e.g., `Dentist.php`, `User.php`, `Appointment.php`). Look at relationships and casts there.
- Services: `app/Services/DentistService.php`, `app/Services/AdminAuditService.php` — examples of reusable backend logic.
- Providers: `app/Providers/FortifyServiceProvider.php`, `AppServiceProvider.php` — app-wide bootstrapping and authentication hooks.
- Frontend entry: `resources/js/app.tsx` (or `resources/js` index) and `vite.config.ts` — how React pages are wired into Laravel with Vite.
- Tests: `tests/` — this project uses Pest (see `composer.json` and `phpunit.xml`).

### Frontend structure (resources/js/)

```text
resources/js/
├── components/    # Reusable React components
├── hooks/         # React hooks
├── layouts/       # Application layouts
├── lib/           # Utility functions and configuration
├── pages/         # Page components
└── types/         # TypeScript definitions
```

## Common developer tasks (commands)

Environment & dependencies

```powershell
# Install PHP deps
composer install
# Copy example .env and generate key
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate

# Install JS deps
npm install
```

Development server

```powershell
# Start Laravel + Vite concurrently (there is a composer script)
composer run dev

# Or run Vite only
npm run dev
```

Build for production

```powershell
composer run setup   # runs composer install, migrations and npm build (see composer.json 'setup')
npm run build        # build frontend assets with Vite
```

Tests

```powershell
# Run the test suite (Pest / PHPUnit). composer script 'test' runs artisan test.
composer run test
# or run Pest directly
vendor\bin\pest
```

## Project-specific conventions

- Use service classes in `app/Services/` for domain logic. Controllers should orchestrate request -> service -> response.
- Validation belongs in `app/Http/Requests/`. Use Form Request `authorize()` and `rules()` consistently.
- Use Inertia responses for page endpoints; API-like endpoints can still return JSON responses (see `app/Http/Responses/`).
- Audit important actions through `AdminAuditService` rather than ad-hoc logging — inspect `app/Services/AdminAuditService.php` for how entries are recorded.
- TypeScript organization: keep shared types/interfaces in `resources/js/types/` (e.g. `resources/js/types/index.d.ts`, `vite-env.d.ts`). Avoid declaring component/page interfaces inline inside `resources/js/pages/*`; instead export/import them from the `types` directory so types are discoverable and reusable across the app.

## Integration points & external dependencies

- Authentication: Laravel Fortify (providers in `app/Providers/`). Two-factor columns/migration exists (`database/migrations/*add_two_factor_columns_to_users_table.php`).
- Frontend: Vite + React + Inertia (`package.json` dependencies and `vite.config.ts`).
- Background jobs / queues: composer `dev` script runs `php artisan queue:listen` concurrently — examine `config/queue.php` and any `Jobs` if present.
- Databases: Typical Laravel DB connections — many devs use SQLite for local tests (see `composer.json` post-create step touching `database/database.sqlite`).

## Tests and CI notes

- Test runner: Pest (composer test runs `php artisan test`). Look at `phpunit.xml` and `tests/Pest.php` for test bootstrapping.
- Keep tests fast and use factories in `database/factories/` (there is a `UserFactory.php`).

## Examples of useful edits an AI agent may make

- Small refactor: move validation from a controller to a Form Request in `app/Http/Requests/` and update controller call site.
- Add unit tests for a service in `tests/Unit/` using Pest and factories.
- Update an Inertia page: modify `resources/js/pages/...` and its corresponding controller route in `routes/web.php`.

### Example: Creating a Dentist (Controller -> Request -> Service)

Here's a quick walkthrough of how a new dentist is created, illustrating the key architectural pattern in this app.

1.  **Route & Controller (`routes/web.php` -> `AdminController`)**
    A `POST` request to `/admin/dentists` hits the `storeDentist` method in `App\Http\Controllers\AdminController`.

    ```php
    // In AdminController.php
    public function storeDentist(StoreDentistRequest $request)
    {
        // ...
    }
    ```

2.  **Form Request Validation (`StoreDentistRequest`)**
    Laravel injects `App\Http\Requests\StoreDentistRequest`. Before the `store` method runs, two things happen automatically:
    - `authorize()`: Checks if the current user is an admin. If not, it throws a 403 Forbidden error.
    - `rules()`: Validates the incoming request data (e.g., `fname` is required, `email` is unique). If validation fails, it redirects back with errors.

    ```php
    // In StoreDentistRequest.php
    public function authorize(): bool
    {
        return $this->user()?->role_id === 1; // Must be admin
    }

    public function rules(): array
    {
        return [
            'fname' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            // ... other rules
        ];
    }
    ```

3.  **Service Logic (`DentistService`)**
    If authorization and validation pass, the controller calls `App\Services\DentistService` to handle the business logic of creating a user, generating a password, creating a profile, and sending an email. This keeps the controller thin.

    ```php
    // In AdminController.php, storeDentist() method
    $validated = $request->validated();
    $dentist = $this->dentistService->createDentist($validated); // Delegate to service
    ```

    The service contains the core logic:

    ```php
    // In DentistService.php
    public function createDentist(array $validated): User
    {
        DB::beginTransaction();
        // ... generate password
        // ... create User model
        // ... create DentistProfile model
        // ... attach specializations
        // ... send email with credentials
        DB::commit();
        return $dentist;
    }
    ```

This separation of concerns is a key convention to follow.

## Where to look when stuck

- App-wide bootstrapping: `bootstrap/app.php`, `app/Providers/*`.
- Auth flows: `app/Providers/FortifyServiceProvider.php` and `routes/auth.php`.
- Frontend wiring: `resources/js`, `vite.config.ts`, and `package.json` scripts.
- Formatting/linting: `pint.json`, `eslint.config.js`, and `package.json` scripts.

If anything here is missing or you'd like more examples (e.g., one controller -> request -> service edit walkthrough), tell me which area to expand and I will update this file.

## Agent behavior / file generation policy

- Do NOT create new Markdown documentation files (e.g., `.md`, `.markdown`) automatically after giving a response. Only generate or add documentation files when explicitly instructed to do so by a human reviewer. You may update or edit existing docs if asked, but avoid creating standalone docs as part of routine code edits or example responses.
- Do NOT run formatting or linting commands automatically (e.g., `npm run format`, `npm run lint`, `vendor\bin\pint`). Only run these if explicitly requested by the user.
- Do NOT add emojis in generated comments, commit messages, PR descriptions, or inline code comments produced by the AI. Use plain, professional text only.
