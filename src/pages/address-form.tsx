import { InputLabel } from "@/components/input-label";
import { Button } from "../components/ui/button";
import { useForm } from "react-hook-form";
import { addressSchema, type AddressSchema } from "@/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "../hooks/use-budget";

interface CepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
}

export function AddressForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAddressInfo, addressInfo } = useBudget();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressSchema>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressInfo ?? {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      state: "",
      city: "",
    },
  });

  const fetchAddress = async (cep: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v1/${cep}`
      );
      const data: CepResponse = await response.json();

      if (response.ok) {
        setValue("street", data.street);
        setValue("neighborhood", data.neighborhood);
        setValue("city", data.city);
        setValue("state", data.state);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length === 8) {
      fetchAddress(value);
    }
  };

  const handleAddress = async (data: AddressSchema) => {
    setAddressInfo(data);
    navigate("/chats");
  };

  return (
    <div className="flex flex-col items-center gap-5 p-6 w-full text-white">
      <h1 className="text-3xl font-semibold">Endereço</h1>
      <form
        onSubmit={handleSubmit(handleAddress)}
        className="flex flex-col justify-center gap-3 w-full max-w-2xl"
      >
        <div className="flex flex-col gap-3">
          <InputLabel
            label="CEP"
            placeholder="Digite apenas números"
            required
            register={register("cep", {
              onChange: handleCepChange,
            })}
            error={errors.cep?.message}
          />
          <InputLabel
            label="Logradouro"
            disable
            register={register("street")}
            error={errors.street?.message}
          />
        </div>

        <div className="flex gap-3">
          <InputLabel
            label="Número"
            placeholder="Ex: 110"
            required
            register={register("number")}
            error={errors.number?.message}
          />
          <InputLabel
            label="Complemento"
            placeholder="Ex: apto 48"
            register={register("complement")}
            error={errors.complement?.message}
          />
        </div>

        <div className="flex gap-3 mb-5">
          <InputLabel
            label="Bairro"
            disable
            register={register("neighborhood")}
            error={errors.neighborhood?.message}
          />
          <InputLabel
            label="Estado"
            disable
            register={register("state")}
            error={errors.state?.message}
          />
          <InputLabel
            label="Cidade"
            disable
            register={register("city")}
            error={errors.city?.message}
          />
        </div>

        <div className="flex justify-between pt-3 border-t border-zinc-700">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/")}
          >
            Anterior
          </Button>
          <Button type="submit" disabled={isLoading}>
            Próximo
          </Button>
        </div>
      </form>
    </div>
  );
}
