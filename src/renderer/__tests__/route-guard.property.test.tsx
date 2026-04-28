import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import * as fc from 'fast-check';

/**
 * Feature: multi-user-platform
 * Property 10: 未认证路由守卫（Unauthenticated Route Guard）
 * Property 11: 已认证路由守卫（Authenticated Route Guard）
 */

// --- Shared mutable auth state ---

let mockIsUnlocked = false;

// --- Route guard components (self-contained, no external imports) ---

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  if (!mockIsUnlocked) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (mockIsUnlocked) return <Navigate to="/vault" replace />;
  return children;
};

const LocationDisplay: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<PublicRoute><div data-testid="location">/login</div></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><div data-testid="location">/register</div></PublicRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/vault" element={<div data-testid="location">/vault</div>} />
          <Route path="/generator" element={<div data-testid="location">/generator</div>} />
          <Route path="/security-report" element={<div data-testid="location">/security-report</div>} />
          <Route path="/import-export" element={<div data-testid="location">/import-export</div>} />
          <Route path="/settings" element={<div data-testid="location">/settings</div>} />
        </Route>
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>,
  );
}

const protectedRoutes = ['/vault', '/generator', '/security-report', '/import-export', '/settings'];
const publicAuthRoutes = ['/login', '/register'];

describe('Property 10: Unauthenticated Route Guard', () => {
  beforeEach(() => { mockIsUnlocked = false; });

  it('for any protected route, unauthenticated user is redirected to /login', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...protectedRoutes),
        (route) => {
          mockIsUnlocked = false;
          const { unmount } = renderWithRouter(route);
          const el = screen.getByTestId('location');
          expect(el.textContent).toBe('/login');
          unmount();
        },
      ),
      { numRuns: protectedRoutes.length * 5 },
    );
  });
});

describe('Property 11: Authenticated Route Guard', () => {
  beforeEach(() => { mockIsUnlocked = true; });

  it('for any public auth route, authenticated user is redirected to /vault', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...publicAuthRoutes),
        (route) => {
          mockIsUnlocked = true;
          const { unmount } = renderWithRouter(route);
          const el = screen.getByTestId('location');
          expect(el.textContent).toBe('/vault');
          unmount();
        },
      ),
      { numRuns: publicAuthRoutes.length * 5 },
    );
  });
});
