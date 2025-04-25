<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Handle JSON response for API routes
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors' => $e->validator->errors()->getMessages(),
                    ], 422);
                }

                if ($e instanceof NotFoundHttpException) {
                    return response()->json([
                        'message' => 'Resource not found.',
                    ], 404);
                }

                // Handle other exception types
                $statusCode = $this->isHttpException($e) ? $e->getStatusCode() : 500;
                
                return response()->json([
                    'message' => $statusCode == 500 ? 'Server error.' : $e->getMessage(),
                    'error' => config('app.debug') ? [
                        'message' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTrace(),
                    ] : null,
                ], $statusCode);
            }
        });
    }
}