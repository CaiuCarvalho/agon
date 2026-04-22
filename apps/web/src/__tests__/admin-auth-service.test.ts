import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Stable mock refs
const { mockCreateClient } = vi.hoisted(() => {
  const mockCreateClient = vi.fn()
  return { mockCreateClient }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))
vi.mock('@/lib/auth/roles', () => ({
  isAdminRole: ({ profileRole, metadataRole }: { profileRole?: string | null; metadataRole?: string | null }) =>
    profileRole === 'admin' || metadataRole === 'admin',
}))

const originalEnv = process.env

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/admin/orders') {
  return new NextRequest(url)
}

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  chain.catch = (reject: (v: unknown) => unknown) => Promise.resolve(result).catch(reject)
  chain.single = vi.fn().mockResolvedValue(result)
  for (const m of ['select', 'eq', 'is']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

function makeSupabase({
  authUser,
  authError,
  profileData,
  profileError,
}: {
  authUser?: Record<string, unknown> | null
  authError?: unknown
  profileData?: Record<string, unknown> | null
  profileError?: unknown
}) {
  const profileChain = makeChain({ data: profileData ?? null, error: profileError ?? null })
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser ?? null },
        error: authError ?? null,
      }),
    },
    from: vi.fn().mockReturnValue(profileChain),
  }
}

// ─── validateAdmin ────────────────────────────────────────────────────────────

describe('validateAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  async function callValidateAdmin(req: NextRequest) {
    const { validateAdmin } = await import('@/modules/admin/services/adminService')
    return validateAdmin(req)
  }

  it('returns UNAUTHORIZED when auth.getUser returns error', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ authUser: null, authError: { message: 'not authenticated' } })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).code).toBe('UNAUTHORIZED')
  })

  it('returns UNAUTHORIZED when user is null', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ authUser: null }))
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).code).toBe('UNAUTHORIZED')
  })

  it('returns FORBIDDEN when profile not found and no admin metadata', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-1', email: 'user@email.com', user_metadata: {} },
        profileData: null,
        profileError: { code: 'PGRST116', message: 'not found' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).code).toBe('FORBIDDEN')
  })

  it('returns FORBIDDEN when role is not admin', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-1', email: 'user@email.com', user_metadata: { role: 'user' } },
        profileData: { role: 'user' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).code).toBe('FORBIDDEN')
  })

  it('returns FORBIDDEN when role is admin but email not in whitelist', async () => {
    process.env.ADMIN_EMAIL_PRIMARY = 'admin@agon.com'
    process.env.ADMIN_EMAIL_BACKUP = 'backup@agon.com'
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-1', email: 'notadmin@email.com', user_metadata: { role: 'admin' } },
        profileData: { role: 'admin' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).code).toBe('FORBIDDEN')
  })

  it('returns AdminUser when all checks pass (primary email)', async () => {
    process.env.ADMIN_EMAIL_PRIMARY = 'admin@agon.com'
    process.env.ADMIN_EMAIL_BACKUP = 'backup@agon.com'
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-admin', email: 'admin@agon.com', user_metadata: { role: 'admin' } },
        profileData: { role: 'admin' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).id).toBe('user-admin')
    expect((result as any).email).toBe('admin@agon.com')
    expect((result as any).role).toBe('admin')
  })

  it('returns AdminUser when using backup email', async () => {
    process.env.ADMIN_EMAIL_PRIMARY = 'admin@agon.com'
    process.env.ADMIN_EMAIL_BACKUP = 'backup@agon.com'
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-backup', email: 'backup@agon.com', user_metadata: { role: 'admin' } },
        profileData: { role: 'admin' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).email).toBe('backup@agon.com')
  })

  it('returns FORBIDDEN when email is not a valid email address', async () => {
    process.env.ADMIN_EMAIL_PRIMARY = 'admin@agon.com'
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-1', email: 'not-an-email', user_metadata: { role: 'admin' } },
        profileData: { role: 'admin' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    expect((result as any).code).toBe('FORBIDDEN')
  })

  it('proceeds when profile fetch errors but user_metadata has admin role', async () => {
    // profileError + metadata role === admin → proceeds to isAdminRole check
    // isAdminRole returns true for metadataRole === 'admin' → passes role check
    // but if email not in whitelist → FORBIDDEN
    process.env.ADMIN_EMAIL_PRIMARY = 'admin@agon.com'
    mockCreateClient.mockResolvedValue(
      makeSupabase({
        authUser: { id: 'user-1', email: 'admin@agon.com', user_metadata: { role: 'admin' } },
        profileData: null,
        profileError: { code: 'PGRST116', message: 'not found' },
      })
    )
    const result = await callValidateAdmin(makeRequest())
    // profileError + metadata === 'admin' skips the FORBIDDEN early return
    // isAdminRole({ profileRole: undefined, metadataRole: 'admin' }) === true
    // email IS in whitelist → AdminUser
    expect((result as any).id).toBe('user-1')
  })
})

// ─── isApiError ───────────────────────────────────────────────────────────────

describe('isApiError', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  async function getIsApiError() {
    const { isApiError } = await import('@/modules/admin/services/adminService')
    return isApiError
  }

  it('returns true for objects with code and message (ApiError shape)', async () => {
    const isApiError = await getIsApiError()
    expect(isApiError({ code: 'UNAUTHORIZED', message: 'auth required' })).toBe(true)
  })

  it('returns true for FORBIDDEN ApiError', async () => {
    const isApiError = await getIsApiError()
    expect(isApiError({ code: 'FORBIDDEN', message: 'access denied' })).toBe(true)
  })

  it('returns false for AdminUser shape (has id, email, role but no code)', async () => {
    const isApiError = await getIsApiError()
    expect(isApiError({ id: 'user-1', email: 'admin@agon.com', role: 'admin' })).toBe(false)
  })

  it('returns false for empty object', async () => {
    const isApiError = await getIsApiError()
    expect(isApiError({} as any)).toBe(false)
  })
})
