import { describe, expect, it, vi } from 'vitest';
import { createOrderFromCart } from './createOrderFromCart';

const shipping = {
  shippingName: 'Teste',
  shippingAddress: 'Rua 1',
  shippingCity: 'Sao Paulo',
  shippingState: 'SP',
  shippingZip: '01000-000',
  shippingPhone: '(11) 99999-0000',
  shippingEmail: 'teste@example.com',
};

describe('createOrderFromCart', () => {
  it('uses create_order_with_payment_atomic when available', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        success: true,
        order_id: 'order-1',
        payment_id: 'payment-1',
        total_amount: 100,
        item_count: 1,
      },
      error: null,
    });

    const supabase = {
      rpc,
      from: vi.fn(),
    } as any;

    const result = await createOrderFromCart({
      supabase,
      userId: 'user-1',
      shipping,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rpcUsed).toBe('create_order_with_payment_atomic');
      expect(result.payment_id).toBe('payment-1');
    }
    expect(rpc).toHaveBeenCalledWith(
      'create_order_with_payment_atomic',
      expect.objectContaining({ p_user_id: 'user-1' })
    );
  });

  it('falls back to create_order_atomic when with_payment RPC is missing', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST202',
          message: 'Could not find the function public.create_order_with_payment_atomic',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          order_id: 'order-2',
          total_amount: 200,
          item_count: 2,
        },
        error: null,
      });

    const single = vi.fn().mockResolvedValue({
      data: { id: 'payment-2' },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    const supabase = {
      rpc,
      from,
    } as any;

    const result = await createOrderFromCart({
      supabase,
      userId: 'user-1',
      shipping,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rpcUsed).toBe('create_order_atomic');
      expect(result.payment_id).toBe('payment-2');
    }

    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'create_order_atomic',
      expect.objectContaining({ p_user_id: 'user-1' })
    );
    expect(from).toHaveBeenCalledWith('payments');
  });
});
