"use client";

export function PaymentMethodSelector() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-base font-semibold mb-3">Forma de Pagamento</h3>
      
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <input
          type="radio"
          id="cash_on_delivery"
          name="payment_method"
          value="cash_on_delivery"
          checked
          readOnly
          className="mt-1"
        />
        <div className="flex-1">
          <label htmlFor="cash_on_delivery" className="block font-medium text-sm cursor-pointer">
            Pagamento na Entrega
          </label>
          <p className="text-sm text-gray-600 mt-1">
            Pague em dinheiro ou cartão no momento da entrega
          </p>
        </div>
      </div>
    </div>
  );
}
