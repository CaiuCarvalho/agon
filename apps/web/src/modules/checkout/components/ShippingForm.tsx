"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShippingFormValues, shippingFormSchema } from '../contracts';
import { viaCEPService } from '../services/viaCEPService';
import { validationService } from '../services/validationService';

interface ShippingFormProps {
  defaultEmail?: string;
  onSubmit: (values: ShippingFormValues) => void;
  isLoading?: boolean;
  submitRef?: React.MutableRefObject<(() => void) | null>;
}

export function ShippingForm({ defaultEmail, onSubmit, isLoading, submitRef }: ShippingFormProps) {
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      shippingEmail: defaultEmail || '',
    },
  });

  // Expose submit function via ref
  useEffect(() => {
    if (submitRef) {
      submitRef.current = () => {
        handleSubmit(onSubmit)();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitRef]);

  const handleCEPBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    const validation = validationService.validateCEP(cep);
    
    if (validation.valid) {
      setValue('shippingZip', validation.formatted);
      setIsLoadingCEP(true);
      
      const addressData = await viaCEPService.fetchAddressByCEP(validation.formatted);
      
      if (addressData) {
        if (addressData.street) setValue('shippingAddress', addressData.street);
        if (addressData.city) setValue('shippingCity', addressData.city);
        if (addressData.state) setValue('shippingState', addressData.state);
      }
      
      setIsLoadingCEP(false);
    }
  };

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    const validation = validationService.validatePhone(phone);
    
    if (validation.valid) {
      setValue('shippingPhone', validation.formatted);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="shippingName" className="block text-sm font-semibold text-gray-900 mb-1.5">
          Nome completo *
        </label>
        <input
          id="shippingName"
          type="text"
          {...register('shippingName')}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        {errors.shippingName && (
          <p className="mt-1 text-sm text-red-600">{errors.shippingName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="shippingZip" className="block text-sm font-semibold text-gray-900 mb-1.5">
          CEP *
        </label>
        <input
          id="shippingZip"
          type="text"
          {...register('shippingZip')}
          onBlur={handleCEPBlur}
          placeholder="00000-000"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading || isLoadingCEP}
        />
        {errors.shippingZip && (
          <p className="mt-1 text-sm text-red-600">{errors.shippingZip.message}</p>
        )}
        {isLoadingCEP && (
          <p className="mt-1 text-sm text-gray-500">Buscando endereço...</p>
        )}
      </div>

      <div>
        <label htmlFor="shippingAddress" className="block text-sm font-semibold text-gray-900 mb-1.5">
          Endereço *
        </label>
        <input
          id="shippingAddress"
          type="text"
          {...register('shippingAddress')}
          placeholder="Rua, número, complemento"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        {errors.shippingAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="shippingCity" className="block text-sm font-semibold text-gray-900 mb-1.5">
            Cidade *
          </label>
          <input
            id="shippingCity"
            type="text"
            {...register('shippingCity')}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          {errors.shippingCity && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingCity.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="shippingState" className="block text-sm font-semibold text-gray-900 mb-1.5">
            Estado *
          </label>
          <select
            id="shippingState"
            {...register('shippingState')}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <option value="">Selecione</option>
            <option value="AC">AC</option>
            <option value="AL">AL</option>
            <option value="AP">AP</option>
            <option value="AM">AM</option>
            <option value="BA">BA</option>
            <option value="CE">CE</option>
            <option value="DF">DF</option>
            <option value="ES">ES</option>
            <option value="GO">GO</option>
            <option value="MA">MA</option>
            <option value="MT">MT</option>
            <option value="MS">MS</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
            <option value="PB">PB</option>
            <option value="PR">PR</option>
            <option value="PE">PE</option>
            <option value="PI">PI</option>
            <option value="RJ">RJ</option>
            <option value="RN">RN</option>
            <option value="RS">RS</option>
            <option value="RO">RO</option>
            <option value="RR">RR</option>
            <option value="SC">SC</option>
            <option value="SP">SP</option>
            <option value="SE">SE</option>
            <option value="TO">TO</option>
          </select>
          {errors.shippingState && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingState.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="shippingPhone" className="block text-sm font-semibold text-gray-900 mb-1.5">
          Telefone *
        </label>
        <input
          id="shippingPhone"
          type="tel"
          {...register('shippingPhone')}
          onBlur={handlePhoneBlur}
          placeholder="(00) 00000-0000"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        {errors.shippingPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.shippingPhone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="shippingEmail" className="block text-sm font-semibold text-gray-900 mb-1.5">
          Email *
        </label>
        <input
          id="shippingEmail"
          type="email"
          {...register('shippingEmail')}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        {errors.shippingEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.shippingEmail.message}</p>
        )}
      </div>
    </form>
  );
}
